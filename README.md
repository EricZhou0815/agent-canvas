# ◆ AgentCanvas

> The presentation layer for AI agents.

**Claude has Artifacts. ChatGPT has Canvas. AgentCanvas is the presentation layer for every other agent.**

Every agent — Claude Code, Codex, Cursor, personal assistants, agent frameworks — produces output trapped inside a chat bubble. AgentCanvas gives any third-party agent a dedicated, shareable, interactive web page to present structured output.

---

## Why AgentCanvas

| | Claude Artifacts | ChatGPT Canvas | **AgentCanvas** |
|---|---|---|---|
| Works with any agent | ❌ Claude only | ❌ ChatGPT only | ✅ **Any agent, any platform** |
| Standalone shareable URL | ⚠️ Limited | ❌ | ✅ |
| Interactive (user actions → agent) | ❌ View only | ⚠️ Edit only | ✅ **Bidirectional** |
| Agent-first API | ❌ | ❌ | ✅ |

**The two-way channel is the moat:** agents push slides to the page; users click, check, and submit on the page; actions are forwarded back to the agent via webhook.

---

## Quick Start for AI Agents

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

---

## CLI Reference

```
Usage: ac <command> [options]

Commands:
  config [--token <t>] [--user-id <id>]    View or save credentials
  push <canvasId> <type> <title> [flags]    Push a slide
  list [userId]                              List all canvases

Slide types: dashboard, timeline, page, kanban, form, table, chart

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

---

## API Reference

| Method | Endpoint | Auth | Who | What |
|--------|----------|------|-----|------|
| POST | `/api/auth/register` | — | Agent/User | Register, get userId + token |
| POST | `/api/auth/login` | — | User | Login, get session token |
| POST | `/api/canvas` | Bearer token | Agent | Push slides |
| GET | `/api/canvas` | — | Frontend | Read slides (public) |
| POST | `/api/action` | — | Frontend | Forward user actions to webhook |
| GET | `/api/user` | — | Dashboard | Get user info + canvas list |
| POST | `/api/user/webhook` | — | Dashboard | Save webhook URL |

---

## Slide Types

| Type | Purpose | Data shape |
|------|---------|------------|
| `dashboard` | Task board with stats | `{ battery?, tasks[], collections[] }` |
| `timeline` | Milestones & deadlines | `{ items: [{ title, date, done }] }` |
| `page` | Markdown report | `{ content: "# Markdown" }` |
| `kanban` | Column-based workflow | `{ columns: [{ title, items }] }` |
| `form` | User input | `{ fields: [{ key, label }] }` |
| `table` | Structured data | `{ table: { columns, rows } }` |
| `chart` | Line / bar / pie chart | `{ chart: { type, data: [{ name, value }] } }` |

---

## Webhook Integration

When a user interacts with a Canvas (clicks, fills forms), actions are forwarded to your local machine. Set your webhook URL in the Dashboard.

1. Run a webhook listener on your machine
2. Expose it via Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8888`
3. Go to Dashboard → paste the tunnel URL → Save

All user actions will be POSTed to that URL in real time.

---

## Error Handling

The API returns descriptive Zod validation errors:

```json
{
  "error": "Schema validation failed",
  "issues": [{
    "path": "slides.0.type",
    "message": "Invalid option: expected one of dashboard|timeline|page|kanban|form|table|chart",
    "code": "invalid_value"
  }],
  "docs": "https://agent-canvas-eta.vercel.app"
}
```

---

## Design System & Theming

AgentCanvas uses **design tokens** (CSS variables) — no hardcoded colors in components. This means every user can customize the look by changing a few variables.

**Theme tokens** (`src/app/globals.css`):

| Token | Default (Linear Light) | Purpose |
|-------|----------------------|---------|
| `--color-background` | `#F7F8F8` | Page background |
| `--color-foreground` | `#0F1117` | Primary text |
| `--color-card` | `#FFFFFF` | Card surfaces |
| `--color-primary` | `#5E6AD2` | Accent (buttons, links) |
| `--color-border` | `#E2E4E5` | Hairline borders |
| `--color-success` | `#059669` | Positive states |
| `--color-destructive` | `#E5484D` | Errors / urgent |
| `--radius` | `0.5rem` | Corner radius |

**Icons:** [lucide-react](https://lucide.dev) — no emoji in the UI.

To ship a new theme (dark, high-contrast, brand colors), override the tokens in `globals.css` — no component changes needed.

---

## User Interaction & Data Flow

AgentCanvas is **bidirectional** — users don't just view slides, they interact with them, and those interactions flow back to the agent.

```
User clicks / checks / submits on a Canvas
                  ↓
          POST /api/action
                  ↓
        Action stored (pending queue)
                  ↓
        ┌─────────┼────────────┐
        ↓         ↓            ↓
  Webhook    Realtime     Polling
  (cloud     (local       (any agent,
   agent)     watcher)     zero config)
```

**Action payload shape:**

```json
{
  "action": "toggle_task",
  "payload": { "taskIndex": 0, "title": "Call contractor", "done": true },
  "userId": "<uuid>",
  "canvasId": "today",
  "timestamp": "2026-08-07T05:00:00Z"
}
```

**How an agent receives actions — three tiers:**

1. **Webhook (cloud agents)** — set a webhook URL in the Dashboard; actions are POSTed in real time. Already implemented.
2. **Supabase Realtime (local agents)** — run a small watcher that subscribes to the actions channel over WebSocket (same pattern as a messaging gateway). No tunnel, no public IP needed.
3. **Polling (any agent)** — call `GET /api/action/pending?userId=xxx` to fetch queued actions. Zero configuration, works everywhere.

**Agent-side watcher (example):**

```javascript
// agent-watcher.js — local agent receives user actions in real time
const { createClient } = require('@supabase/supabase-js')
const { exec } = require('child_process')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

supabase.channel('agent-actions')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actions' },
    (payload) => exec(`./handle-action.sh '${JSON.stringify(payload.new)}'`))
  .subscribe()
```

---

## Tech Stack

Next.js · shadcn/ui · Supabase · Zod · Recharts · Tailwind CSS · TypeScript · lucide-react

---

## Deployment

**Vercel (primary)** — push to `main`, auto-deploys to `https://agent-canvas-eta.vercel.app`. No manual deploy needed.

**Cloudflare Workers (for mainland China)** — `*.vercel.app` is blocked in mainland China; Cloudflare Workers/Pages is reachable there. Config is already in the repo:

- `open-next.config.ts` — OpenNext adapter (no ISR/cache)
- `wrangler.jsonc` — Worker config (name: `agent-canvas`, nodejs_compat)

Build locally: `npx opennextjs-cloudflare build`, then deploy via the Cloudflare Dashboard (Workers & Pages → Create → connect the GitHub repo, framework: Next.js/OpenNext, Node 22).

**Env vars required (both platforms):**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |

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
