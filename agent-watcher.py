#!/usr/bin/env python3
"""
AgentCanvas local watcher — the polling tier for local agents (no public IP).

Polls GET /api/action/pending for this user, handles known action types,
logs everything, and acks processed events. Designed to run from cron
(e.g. every 1-2 minutes) or as a loop.

Usage:
  python3 agent-watcher.py poll        # fetch + handle + ack, print summary
  python3 agent-watcher.py drain       # same, but keep draining until empty
  python3 agent-watcher.py loop [sec]  # poll forever every N seconds

Known action handlers (extend handle_action()):
  - toggle_task   -> syncs task done-state into family-os
  - form_submit   -> logs structured submission
  - choice        -> logs button choice
  - text          -> logs free-text input

Output: newline-delimited JSON events on stdout (empty if nothing pending),
so it composes with cron no_agent delivery (empty stdout = silent).
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

API = os.environ.get("CANVAS_API", "https://agent-canvas-eta.vercel.app")
TOKEN_FILE = os.path.expanduser("~/.hermes/.canvas-token")
USER_FILE = os.path.expanduser("~/.hermes/.canvas-user")
LOG_DIR = os.path.expanduser("~/.hermes/agentcanvas/events")


def credentials():
    with open(TOKEN_FILE) as f:
        token = f.read().strip()
    with open(USER_FILE) as f:
        user = f.read().strip()
    return token, user


def fetch_pending(token, user):
    req = urllib.request.Request(
        f"{API}/api/action/pending?userId={user}",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def ack(token, action_ids):
    req = urllib.request.Request(
        f"{API}/api/action/ack",
        data=json.dumps({"actionIds": action_ids}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def log_event(event):
    os.makedirs(LOG_DIR, exist_ok=True)
    ts = event.get("timestamp", "").replace(":", "-").replace("T", "_")[:19]
    path = os.path.join(LOG_DIR, f"{ts}_{event['actionId']}.json")
    with open(path, "w") as f:
        json.dump(event, f, ensure_ascii=False, indent=2)


def handle_action(event):
    """Handle a known action type. Return True if handled (should be acked)."""
    action = event.get("action")
    payload = event.get("payload") or {}

    if action == "toggle_task":
        return handle_toggle_task(payload)

    # form_submit / choice / text: log and surface (agent decides next step)
    log_event(event)
    return True


def handle_toggle_task(payload):
    """Sync task done-state into family-os by title match."""
    title = payload.get("title", "")
    done = bool(payload.get("done"))
    if not title:
        return False

    cmd = ["python3", os.path.expanduser("~/family-os/family-os.py"), "task", "list"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=15).stdout
    except Exception:
        return False

    task_id = None
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[1] == title:
            task_id = parts[0]
            break

    if not task_id:
        # no exact match — log for agent review
        log_event({"action": "toggle_task", "payload": payload, "actionId": "unmatched"})
        return True  # ack so it doesn't retry forever; logged for review

    try:
        subprocess.run(
            ["python3", os.path.expanduser("~/family-os/family-os.py"), "task", "done" if done else "todo", task_id],
            capture_output=True, text=True, timeout=15,
        )
        log_event({"action": "toggle_task", "payload": payload, "actionId": f"family-os:{task_id}"})
        return True
    except Exception:
        return False


def run_once(token, user):
    data = fetch_pending(token, user)
    actions = data.get("actions", [])
    if not actions:
        return 0

    acked_ids = []
    for a in actions:
        event = {
            "actionId": a["actionId"],
            "action": a["action"],
            "payload": a["payload"],
            "canvasId": a.get("canvasId"),
            "timestamp": a.get("timestamp"),
        }
        try:
            if handle_action(event):
                acked_ids.append(a["actionId"])
        except Exception:
            continue

    if acked_ids:
        ack(token, acked_ids)
        # print handled events for cron delivery
        for a in actions:
            if a["actionId"] in acked_ids:
                print(json.dumps({"action": a["action"], "payload": a["payload"]}, ensure_ascii=False))
    return len(actions)


def main():
    token, user = credentials()
    mode = sys.argv[1] if len(sys.argv) > 1 else "poll"

    if mode == "loop":
        sec = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        while True:
            try:
                run_once(token, user)
            except Exception as e:
                print(f"watcher error: {e}", file=sys.stderr)
            time.sleep(sec)
    elif mode == "drain":
        while run_once(token, user) > 0:
            pass
    else:
        run_once(token, user)


if __name__ == "__main__":
    main()
