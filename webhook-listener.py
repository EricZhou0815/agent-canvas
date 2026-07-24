#!/usr/bin/env python3
"""
AgentCanvas webhook listener — runs on Eric's Mac.
Receives user actions from Vercel via Cloudflare Tunnel.
"""
import json, os
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get('WEBHOOK_PORT', '8888'))

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            action = data.get('action', 'unknown')
            payload = data.get('payload', {})
            userId = data.get('userId', '?')
            canvasId = data.get('canvasId', '?')
            
            print(f"\n🔥 Action received!")
            print(f"   User: {userId[:8]}...")
            print(f"   Canvas: {canvasId}")
            print(f"   Action: {action}")
            if payload:
                print(f"   Payload: {json.dumps(payload, ensure_ascii=False)[:200]}")
            
            # Save to a file so Hermes can pick it up
            out_dir = os.path.expanduser("~/.hermes/agentcanvas")
            os.makedirs(out_dir, exist_ok=True)
            with open(os.path.join(out_dir, "pending.json"), "w") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode())
        except Exception as e:
            print(f"❌ Webhook error: {e}")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        status = {"status": "running", "port": PORT}
        pending_path = os.path.expanduser("~/.hermes/agentcanvas/pending.json")
        if os.path.exists(pending_path):
            with open(pending_path) as f:
                status["pending"] = json.load(f)
        self.wfile.write(json.dumps(status, indent=2).encode())
    
    def log_message(self, format, *args):
        pass  # Suppress default logging

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), WebhookHandler)
    print(f"◆ AgentCanvas Webhook listening on http://localhost:{PORT}")
    print(f"  Start tunnel: cloudflared tunnel --url http://localhost:{PORT}")
    server.serve_forever()
