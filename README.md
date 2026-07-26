# ◆ AgentCanvas

> Slide-based UI layer for AI agents.  
> AI Agent 的幻灯片式展示层。

Agents no longer trapped inside chat bubbles. Push structured slides — dashboards, timelines,
reports, kanban boards — to a dedicated web page. Users open a link. Agents stay in control.

---

## 🇬🇧 English — Agent Integration

### Quick Start for AI Agents

**1. Register (one time)**

```bash
curl -X POST "https://agent-canvas-eta.vercel.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "my-agent@example.com", "password": "secure123", "confirmPassword": "secure123"}'
```

→ Response: `{ "userId": "<uuid>", "token": "ac_...", ... }`

**2. Save credentials**
Write the token and userId to `~/.hermes/.canvas-token` and `~/.hermes/.canvas-user`.

**3. Push a slide**

```bash
# Using the CLI (after saving credentials)
python3 agent-canvas.py push today dashboard "My Dashboard" --data '{
  "battery": 85,
  "tasks": [
    {"title": "Call contractor", "status": "TODO", "priority": "URGENT", "due": "today"}
  ],
  "collections": [
    {"name": "Job A", "amount": 100}
  ]
}'
```

→ Response: `✅ https://agent-canvas-eta.vercel.app/<userId>/today`

**4. Share the link**
Your user opens the link and sees the slides. Push new slides any time — the page updates automatically.

### CLI Reference

```
Usage: ac <command> [options]

Commands:
  config [--token <t>] [--user-id <id>]    View or save credentials
  push <canvasId> <type> <title> [flags]    Push a slide
  list [userId]                              List all canvases

Slide types: dashboard, timeline, page, kanban, form

Flags for push:
  --data <json>         Full slide data (overrides other flags)
  --content <md>        Markdown content (for page type)
  --tasks <json>        Task array
  --battery <0-100>     Battery percentage
  --collections <json>  Payment collection array
  --items <json>        Timeline items array

Examples:
  ac push today dashboard "Today" --data '{"battery":85,"tasks":[{"title":"Task","status":"TODO"}]}'
  ac push report page "Report" --content "# Week 1\\n\\nDone!"
  ac push milestones timeline "Timeline" --data '{"items":[{"title":"Phase 1","date":"Jul 27","done":false}]}'
```

### API Reference

| Method | Endpoint | Auth | Who | What |
|--------|----------|------|-----|------|
| POST | `/api/auth/register` | — | Agent/User | Register, get userId + token |
| POST | `/api/auth/login` | — | User | Login, get session token |
| POST | `/api/canvas` | Bearer token | Agent | Push slides |
| GET | `/api/canvas` | — | Frontend | Read slides (public) |
| POST | `/api/action` | — | Frontend | Forward user actions to webhook |
| GET | `/api/user` | — | Dashboard | Get user info + canvas list |
| POST | `/api/user/webhook` | — | Dashboard | Save webhook URL |

### Slide Data Schemas

**dashboard**
```typescript
{
  type: "dashboard",
  title: string,
  data: {
    battery?: number,              // percentage 0-100
    tasks: [{                       // required
      title: string,                // required
      status: "TODO" | "DONE",     // required
      priority?: "LOW"|"MEDIUM"|"HIGH"|"URGENT",
      due?: string
    }],
    collections?: [{ name: string, amount: number }]  // payments
  }
}
```

**page** — Markdown report
```typescript
{
  type: "page",
  title: string,
  data: { content: string }  // Markdown
}
```

**timeline**
```typescript
{
  type: "timeline",
  title: string,
  data: { items: [{ title: string, date: string, done: boolean }] }
}
```

**kanban**
```typescript
{
  type: "kanban",
  title: string,
  data: { columns: [{ title: string, items: [{ title: string }] }] }
}
```

### Webhook Integration

When a user interacts with a Canvas (clicks, fills forms), actions can be forwarded
to your local machine. Set your webhook URL in the Dashboard.

1. Run a webhook listener on your machine
2. Expose it via Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8888`
3. Go to Dashboard → paste the tunnel URL → Save

All user actions will be POSTed to that URL in real time.

### Error Handling

The API returns descriptive Zod validation errors:

```json
{
  "error": "Schema validation failed",
  "issues": [{
    "path": "slides.0.type",
    "message": "Invalid option: expected one of dashboard|timeline|page|kanban|form",
    "code": "invalid_value"
  }],
  "docs": "https://agent-canvas-eta.vercel.app"
}
```

### Tech Stack

Next.js · shadcn/ui · Supabase · Zod · Tailwind CSS · TypeScript

---

## 🇨🇳 中文

### Agent 集成说明

**1. 注册**
```bash
curl -X POST "https://agent-canvas-eta.vercel.app/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "my-agent@example.com", "password": "123"}'
```
返回 userId + token，保存好。

**2. 推送数据**
```bash
python3 agent-canvas.py push today dashboard "今日面板" \
  --data '{"battery":85,"tasks":[{"title":"任务A","status":"TODO"}]}'
```

**3. 分享链接**
用户打开链接即可查看。

### CLI 使用

```bash
# 配置
ac config --token <token> --user-id <userId>

# 推送
ac push today dashboard "标题" --data '{...}'
ac push report page "报告" --content "# 内容"
ac push timeline timeline "时间线" --data '{"items":[...]}'

# 列出所有 Canvas
ac list
```

### Slide 类型

| 类型 | 用途 |
|------|------|
| dashboard | 任务面板 + 统计卡片 |
| page | Markdown 报告/文档 |
| timeline | 时间线/里程碑 |
| kanban | 看板 |
| form | 表单（开发中） |

---

## Project Structure

```
agent-canvas/
├── agent-canvas.py              # CLI client
├── webhook-listener.cjs         # Local webhook receiver
├── src/
│   ├── app/
│   │   ├── page.tsx             # Homepage (agent docs)
│   │   ├── login/page.tsx       # Login/Register UI
│   │   ├── not-found.tsx        # 404 → redirect /
│   │   ├── [userId]/
│   │   │   ├── dashboard/       # User dashboard (profile, token, webhook config, canvas list)
│   │   │   └── [canvasId]/      # Canvas viewer (page.tsx + client.tsx)
│   │   └── api/
│   │       ├── auth/register    # Identity registration
│   │       ├── auth/login       # Login
│   │       ├── canvas           # Push/read slides
│   │       ├── action           # Forward user actions
│   │       ├── user             # User info + canvas list
│   │       └── user/webhook     # Save webhook URL
│   ├── components/ui/           # shadcn/ui components
│   ├── lib/
│   │   ├── schema.ts            # Zod validation schemas
│   │   └── auth.ts              # Token verification middleware
│   └── globals.css              # Tailwind + shadcn theme
├── .env.local                   # Supabase credentials (not committed)
├── vercel.json
└── README.md
```
