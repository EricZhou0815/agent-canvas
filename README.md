# ◆ AgentCanvas

> Slide-based UI layer for AI agents.  
> AI Agent 的幻灯片式展示层。

**Agents no longer trapped inside chat bubbles.** Push structured slides — dashboards, timelines,
kanban boards, forms — to a dedicated web page that the user opens in their browser.

---

## 🇬🇧 English

### For AI Agents / LLM Integration

**Agent workflow:**

1. Agent sends structured slide data via `POST /api/canvas?userId=<id>&canvasId=<name>`.
2. Data is stored in Supabase.
3. User visits `https://agent-canvas-eta.vercel.app/:userId/:canvasId` to see the slides.
4. Frontend polls for updates — push new slides any time.

**Example — push a dashboard:**

```bash
curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=eric&canvasId=today" \
  -H "Content-Type: application/json" \
  -d '{
    "slides": [{
      "type": "dashboard",
      "title": "Today\'s Tasks",
      "data": {
        "battery": 85,
        "tasks": [
          {"title": "Call contractor", "status": "TODO", "priority": "URGENT", "due": "today"},
          {"title": "Buy groceries", "status": "DONE", "due": "yesterday"}
        ],
        "collections": [
          {"name": "Job A", "amount": 100}
        ]
      }
    }]
  }'
```

Then share: `https://agent-canvas-eta.vercel.app/eric/today`

**Multi-user:** Each `userId` is isolated. Any agent can push to any `userId/canvasId` combination.

### API Reference

| Method | Endpoint | Who | What |
|--------|----------|-----|------|
| POST | `/api/canvas?userId=:id&canvasId=:name` | Agent | Push slides |
| GET | `/api/canvas?userId=:id&canvasId=:name` | Frontend | Read slides |

### Slide Types

| Type | Description |
|------|-------------|
| `dashboard` | Task list with stats, battery, collections |
| `timeline` | Milestones and deadlines |
| `kanban` | Column-based workflow |
| `form` | User input (coming) |

### Tech Stack

Next.js · shadcn/ui · Supabase · Tailwind CSS · TypeScript

### Quick Start (local dev)

```bash
git clone https://github.com/EricZhou0815/agent-canvas.git
cd agent-canvas
npm install
npm run dev
```

Requires a Supabase project with a `canvas` table (see schema below).

### Database Schema

```sql
CREATE TABLE public.canvas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    slide_data JSONB DEFAULT '[]'::jsonb,
    current_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🇨🇳 中文

### 给 Agent / AI 的集成说明

**Agent 工作流程：**

1. Agent 调用 API 推送 Slide 数据
2. 数据存储在 Supabase
3. 用户打开对应链接查看
4. 前端自动轮询更新

**示例 — 推送一个面板：**

```bash
curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=eric&canvasId=today" \
  -H "Content-Type: application/json" \
  -d '{"slides":[{"type":"dashboard","title":"今日任务","data":{"tasks":[{"title":"事项A","status":"TODO"}]}}]}'
```

然后分享链接：`https://agent-canvas-eta.vercel.app/eric/today`

### 多用户

每个 `userId` 隔离。Agent 可以推送到任意 `userId/canvasId` 组合。

### Slide 类型

| 类型 | 用途 |
|------|------|
| `dashboard` | 任务列表 + 统计 |
| `timeline` | 时间线 / 里程碑 |
| `kanban` | 看板 |
| `form` | 表单（开发中） |

### 开发

```bash
git clone git@github.com:EricZhou0815/agent-canvas.git
cd agent-canvas
npm install
npm run dev
```

需要配置 Supabase 环境和 `canvas` 表。

---

## Project Structure

```
agent-canvas/
├── src/
│   ├── app/
│   │   ├── [userId]/[canvasId]/  # User canvas pages
│   │   │   ├── page.tsx          # Server component (params)
│   │   │   └── client.tsx        # Client component (shadcn/ui)
│   │   ├── api/canvas/route.ts   # REST API (Supabase)
│   │   ├── globals.css           # Tailwind + shadcn theme
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Homepage
│   └── components/ui/            # shadcn/ui components
├── public/
├── .env.local                    # Supabase keys (not committed)
├── components.json               # shadcn/ui config
└── vercel.json
```
