// AgentCanvas webhook listener — runs on Eric's Mac
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 8888;
const PENDING_FILE = path.join(process.env.HOME || '/tmp', '.hermes', 'agentcanvas', 'pending.json');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`\n🔥 Action received:`);
        console.log(`   User: ${(data.userId || '?').slice(0,8)}...`);
        console.log(`   Canvas: ${data.canvasId || '?'}`);
        console.log(`   Action: ${data.action}`);
        
        fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true });
        fs.writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error(`❌ Error: ${e.message}`);
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    // GET — show status
    let status = { status: 'running', port: PORT };
    try {
      if (fs.existsSync(PENDING_FILE)) {
        status.pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`◆ AgentCanvas Webhook listening on http://localhost:${PORT}`);
  console.log(`  Tunnel: cloudflared tunnel --url http://localhost:${PORT}`);
});
