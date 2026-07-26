#!/usr/bin/env python3
"""
AgentCanvas CLI — push slides from the command line.

Usage:
  ac push <canvas> <type> <title> [--data <json> | --tasks <json> | --content <text>]
  ac list <canvas>
  ac token <token>           # Save a new token

Examples:
  ac push eric/today dashboard "Today's Tasks" --data '{"battery":85,"tasks":[{"title":"Call contractor","status":"TODO"}]}'
  ac push eric/report page "Weekly Report" --content "# Report\\n\\nAll done!"
  ac push eric/milestones timeline "Project Timeline" --data '{"items":[{"title":"Phase 1","date":"Jul 27","done":true}]}'
  ac list eric
"""

import json, os, sys, argparse
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API = os.environ.get("AC_API", "https://agent-canvas-eta.vercel.app")
TOKEN_FILE = Path.home() / ".hermes" / ".canvas-token"
USER_ID_FILE = Path.home() / ".hermes" / ".canvas-user"

def get_user_id():
    if USER_ID_FILE.exists():
        return USER_ID_FILE.read_text().strip()
    return os.environ.get("AC_USER_ID", "")

def get_token():
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text().strip()
    return os.environ.get("AC_TOKEN", "")

def api(method, path, data=None):
    token = get_token()
    url = f"{API}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        err = e.read().decode()
        try:
            return json.loads(err)
        except:
            return {"error": err.strip()}

def cmd_push(args):
    canvas = args.canvas
    if "/" not in canvas:
        uid = get_user_id()
        if not uid:
            print("❌ No userId configured. Use 'userId/canvasId' format or save userId with 'ac save-id <userId>'")
            sys.exit(1)
        canvas = f"{uid}/{canvas}"
    userId, canvasId = canvas.split("/", 1)

    slide = {"type": args.type, "title": args.title, "data": {}}

    if args.data:
        slide["data"] = json.loads(args.data)
    if args.content:
        slide["data"]["content"] = args.content
    if args.tasks:
        slide["data"]["tasks"] = json.loads(args.tasks)
    if args.battery is not None:
        slide["data"]["battery"] = args.battery
    if args.collections:
        slide["data"]["collections"] = json.loads(args.collections)
    if args.items:
        slide["data"]["items"] = json.loads(args.items)

    result = api("POST", f"/api/canvas?userId={userId}&canvasId={canvasId}", {"slides": [slide]})

    if result.get("ok"):
        link = f"https://agent-canvas-eta.vercel.app/{userId}/{canvasId}"
        print(f"✅  Pushed: {link}")
        return link
    else:
        print(f"❌  {result.get('error', 'Failed')}")
        if "issues" in result:
            for i in result["issues"]:
                print(f"   {i['path']}: {i['message']}")
        sys.exit(1)

def cmd_list(args):
    userId = args.userId
    result = api("GET", f"/api/user?userId={userId}")
    if "error" in result:
        print(f"❌ {result['error']}")
        sys.exit(1)
    print(f"👤 {result['user'].get('username', '')} ({result['user']['email']})")
    print(f"🔗 https://agent-canvas-eta.vercel.app/{userId}/dashboard")
    print()
    for c in result.get("canvases", []):
        print(f"  📺 {c['name']}  ({c['slideCount']} slides)")

def cmd_token(args):
    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(args.token)
    print(f"✅ Token saved to {TOKEN_FILE}")

def cmd_save_id(args):
    USER_ID_FILE.parent.mkdir(parents=True, exist_ok=True)
    USER_ID_FILE.write_text(args.userId)
    print(f"✅ User ID saved to {USER_ID_FILE}")

def main():
    parser = argparse.ArgumentParser(description="AgentCanvas CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("push", help="Push a slide to a canvas")
    p.add_argument("canvas", help="userId/canvasId (e.g. eric/today)")
    p.add_argument("type", choices=["dashboard", "timeline", "page", "kanban", "form"], help="Slide type")
    p.add_argument("title", help="Slide title")
    p.add_argument("--data", help='JSON data object (overrides all other -- flags)')
    p.add_argument("--content", help='Markdown content (for page type)')
    p.add_argument("--tasks", help='JSON array of tasks')
    p.add_argument("--battery", type=int, help='Battery percentage')
    p.add_argument("--collections", help='JSON array of collections')
    p.add_argument("--items", help='JSON array of timeline items')
    p.set_defaults(func=cmd_push)

    p = sub.add_parser("list", help="List canvases for a user")
    p.add_argument("userId", help="User ID")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("token", help="Save an API token")
    p.add_argument("token", help="The token string")
    p.set_defaults(func=cmd_token)

    p = sub.add_parser("save-id", help="Save your userId (so you can just write 'canvasId' instead of 'userId/canvasId')")
    p.add_argument("userId", help="Your user ID")
    p.set_defaults(func=cmd_save_id)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
