#!/usr/bin/env python3
"""
AgentCanvas CLI — push slides from the command line.

Usage:
  ac push <canvasId> <type> <title> [--data <json> | --content <md>]
  ac list [<userId>]
  ac config --token <token> --user-id <id>

Examples:
  ac push today dashboard "Today" --data '{"battery":85,"tasks":[{"title":"Call","status":"TODO"}]}'
  ac push report page "Report" --content "# Title\\n\\nBody"
  ac config --token ac_xxx --user-id 6826...
"""

import json, os, sys, argparse
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# ─── Config ───────────────────────────────────────────────

CONFIG = {
    "api_base_url": os.environ.get("AC_API", "https://agent-canvas-eta.vercel.app"),
    "token_path": str(Path.home() / ".hermes" / ".canvas-token"),
    "user_id_path": str(Path.home() / ".hermes" / ".canvas-user"),
}

# ─── Storage helpers ─────────────────────────────────────

def read_file(path):
    try: return Path(path).read_text().strip()
    except: return ""

def write_file(path, content):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(content)

def get_token():
    return read_file(CONFIG["token_path"]) or os.environ.get("AC_TOKEN", "")

def get_user_id():
    return read_file(CONFIG["user_id_path"]) or os.environ.get("AC_USER_ID", "")

# ─── API client ──────────────────────────────────────────

def api_call(method, path, body=None):
    url = f"{CONFIG['api_base_url']}{path}"
    headers = {"Content-Type": "application/json"}
    token = get_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)

    try:
        with urlopen(req) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        err = e.read().decode()
        try: return json.loads(err)
        except: return {"error": err.strip()}

# ─── Slide builder ───────────────────────────────────────

def build_slide(slide_type, title, args):
    data = {}
    if args.data:
        data = json.loads(args.data)
    else:
        if args.content is not None: data["content"] = args.content
        if args.tasks is not None:   data["tasks"] = json.loads(args.tasks)
        if args.battery is not None: data["battery"] = args.battery
        if args.items is not None:   data["items"] = json.loads(args.items)
        if args.collections is not None: data["collections"] = json.loads(args.collections)
    return {"type": slide_type, "title": title, "data": data}

# ─── Commands ─────────────────────────────────────────────

def cmd_push(args):
    canvas = args.canvas
    if "/" not in canvas:
        uid = get_user_id()
        if not uid:
            print("❌ No userId set. Run: ac config --user-id <your-id>")
            sys.exit(1)
        canvas = f"{uid}/{canvas}"
    userId, canvasId = canvas.split("/", 1)

    slide = build_slide(args.type, args.title, args)
    result = api_call("POST", f"/api/canvas?userId={userId}&canvasId={canvasId}", {"slides": [slide]})

    if result.get("ok"):
        link = f"{CONFIG['api_base_url']}/{userId}/{canvasId}"
        print(f"✅ {link}")
        return link
    else:
        print(f"❌ {result.get('error', 'Unknown error')}")
        for i in result.get("issues", []):
            print(f"   {i['path']}: {i['message']}")
        sys.exit(1)

def cmd_list(args):
    userId = args.userId or get_user_id()
    if not userId:
        print("❌ No userId. Provide one or run: ac config --user-id <id>")
        sys.exit(1)

    result = api_call("GET", f"/api/user?userId={userId}")
    if "error" in result:
        print(f"❌ {result['error']}")
        sys.exit(1)

    u = result["user"]
    print(f"👤 {u.get('username', '')} ({u['email']})")
    print(f"🔗 {CONFIG['api_base_url']}/{userId}/dashboard\n")
    for c in result.get("canvases", []):
        print(f"  📺 {c['name']}  ({c['slideCount']} slides)")

def cmd_config(args):
    if args.token:
        write_file(CONFIG["token_path"], args.token)
        print(f"✅ Token saved")
    if args.user_id:
        write_file(CONFIG["user_id_path"], args.user_id)
        print(f"✅ User ID saved")
    if not args.token and not args.user_id:
        print(f"Token:  {CONFIG['token_path']}  {'✅' if get_token() else '❌'}")
        print(f"User:   {CONFIG['user_id_path']}  {'✅' if get_user_id() else '❌'}")
        print(f"API:    {CONFIG['api_base_url']}")

# ─── CLI entry ────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(prog="ac", description="AgentCanvas CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    # push
    sp = sub.add_parser("push", help="Push a slide to a canvas")
    sp.add_argument("canvas", help="canvasId (if userId saved) or userId/canvasId")
    sp.add_argument("type", choices=["dashboard", "timeline", "page", "kanban", "form"])
    sp.add_argument("title", help="Slide title")
    sp.add_argument("--data", help='Full JSON data (overrides other flags)')
    sp.add_argument("--content", help="Markdown (for page type)")
    sp.add_argument("--tasks", help='JSON array: [{"title":"...","status":"TODO"}]')
    sp.add_argument("--battery", type=int, help="Battery %")
    sp.add_argument("--items", help='JSON array for timeline')
    sp.add_argument("--collections", help='JSON array for payments')
    sp.set_defaults(func=cmd_push)

    # list
    sp = sub.add_parser("list", help="List canvases for a user")
    sp.add_argument("userId", nargs="?", help="User ID (uses saved one if omitted)")
    sp.set_defaults(func=cmd_list)

    # config
    sp = sub.add_parser("config", help="View or set configuration")
    sp.add_argument("--token", help="Save API token")
    sp.add_argument("--user-id", help="Save user ID")
    sp.set_defaults(func=cmd_config)

    args = p.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
