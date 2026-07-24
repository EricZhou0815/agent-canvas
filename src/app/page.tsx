import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">◆ AgentCanvas</h1>
        <a href="https://github.com/EricZhou0815/agent-canvas" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
      </header>
      <main className="max-w-4xl mx-auto p-6 space-y-10">

        {/* English */}
        <section>
          <h2 className="text-lg font-semibold mb-1">What is AgentCanvas?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AgentCanvas is a slide-based UI layer for AI agents. Instead of cramming information into a chat bubble,
            an agent can push structured slides — dashboards, timelines, kanban boards, forms — to a dedicated web page
            that the user opens in their browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">How it works</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. Agent calls <code className="text-xs bg-muted px-1 rounded">POST /api/canvas?userId=xxx&canvasId=yyy</code> with slide data.</p>
            <p>2. Data is stored in Supabase.</p>
            <p>3. User opens <code className="text-xs bg-muted px-1 rounded">https://agent-canvas-eta.vercel.app/:userId/:canvasId</code>.</p>
            <p>4. Frontend reads from Supabase and renders the slides.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">API Reference</h2>
          <div className="text-sm space-y-2">
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Push slides</p>
              <p className="text-xs text-muted-foreground">POST /api/canvas?userId={userId}&canvasId={canvasId}</p>
              <pre className="text-xs mt-2 overflow-x-auto">
{`{
  "slides": [
    {
      "type": "dashboard",     // Required: slide type
      "title": "My Dashboard",  // Required: display title
      "data": { ... }           // Required: type-specific data
    }
  ],
  "currentIndex": 0             // Optional: start page (default: last slide)
}`}
              </pre>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Read slides</p>
              <p className="text-xs text-muted-foreground">GET /api/canvas?userId={userId}&canvasId={canvasId}</p>
              <p className="text-xs text-muted-foreground mt-1">Returns: { slides: Slide[], currentIndex: number }</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Slide Types &amp; Data Schema</h2>

          {/* dashboard */}
          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">dashboard</h3>
            <p className="text-xs text-muted-foreground mb-2">Task list with battery, stats, and collections.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "dashboard",
  "title": "Eric's Dashboard",
  "data": {
    "battery": 85,                    // Optional: battery percentage
    "tasks": [                        // Required: task list
      {
        "title": "Call contractor",   // Required: task text
        "status": "TODO",             // Required: "TODO" | "DONE"
        "priority": "URGENT",         // Optional: "URGENT" | "HIGH" | "MEDIUM" | "LOW"
        "due": "today"                // Optional: due date text
      }
    ],
    "collections": [                  // Optional: money/payment list
      {
        "name": "Job A",              // Required: item name
        "amount": 100                 // Required: dollar amount
      }
    ]
  }
}`}
            </pre>
          </div>

          {/* timeline */}
          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">timeline</h3>
            <p className="text-xs text-muted-foreground mb-2">Milestones and deadlines in chronological order.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "timeline",
  "title": "House Move Countdown",
  "data": {
    "items": [
      {
        "title": "Clear furniture",   // Required: milestone text
        "date": "Jul 27",             // Required: date text
        "done": true                  // Required: completed or not
      }
    ]
  }
}`}
            </pre>
          </div>

          {/* kanban */}
          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">kanban</h3>
            <p className="text-xs text-muted-foreground mb-2">Column-based workflow view.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "kanban",
  "title": "Project Board",
  "data": {
    "columns": [
      {
        "title": "To Do",             // Required: column name
        "items": [                    // Required: cards in this column
          { "title": "Task A" }       // Required: card text
        ]
      }
    ]
  }
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Quick Example — Agent Push</h2>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=eric&canvasId=today" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slides": [{
      "type": "dashboard",
      "title": "Today'\\''s Tasks",
      "data": {
        "tasks": [
          {"title": "Call contractor", "status": "TODO", "priority": "URGENT", "due": "today"}
        ]
      }
    }, {
      "type": "timeline",
      "title": "Countdown",
      "data": {
        "items": [
          {"title": "Clear furniture", "date": "Jul 27", "done": false}
        ]
      }
    }]
  }'`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Then share: <code className="bg-muted px-1 rounded">https://agent-canvas-eta.vercel.app/eric/today</code>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Multi-User</h2>
          <p className="text-sm text-muted-foreground">
            Each <code className="text-xs bg-muted px-1 rounded">userId</code> is a separate namespace. 
            Any agent can push to any <code className="text-xs bg-muted px-1 rounded">userId/canvasId</code> combination.
            Users simply open their own link to see the content their agent pushed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Tech Stack</h2>
          <p className="text-sm text-muted-foreground">Next.js · shadcn/ui · Supabase · Tailwind CSS · TypeScript</p>
        </section>

        <hr className="border-muted" />

        {/* Chinese */}
        <section>
          <h2 className="text-lg font-semibold mb-1">什么是 AgentCanvas？</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AgentCanvas 是 AI Agent 的幻灯片式展示层。Agent 可以把面板、时间线、看板等内容推送到独立的网页上，
            用户通过浏览器查看，不再被聊天框限制。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">API 参考</h2>
          <div className="text-sm space-y-1">
            <p><strong>推送 Slide：</strong></p>
            <p className="text-xs text-muted-foreground">POST /api/canvas?userId={userId}&canvasId={canvasId}</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Slide 数据格式</h2>

          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">dashboard — 任务面板</h3>
            <p className="text-xs text-muted-foreground mb-1">data.tasks[].title（必需）任务内容</p>
            <p className="text-xs text-muted-foreground mb-1">data.tasks[].status（必需）"TODO" 或 "DONE"</p>
            <p className="text-xs text-muted-foreground mb-1">data.tasks[].priority（可选）"URGENT" / "HIGH" / "MEDIUM" / "LOW"</p>
            <p className="text-xs text-muted-foreground mb-1">data.tasks[].due（可选）截止日期文字</p>
            <p className="text-xs text-muted-foreground mb-1">data.collections[].name（可选）收款项目名称</p>
            <p className="text-xs text-muted-foreground mb-1">data.collections[].amount（可选）收款金额</p>
            <p className="text-xs text-muted-foreground">data.battery（可选）电池百分比</p>
          </div>

          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">timeline — 时间线</h3>
            <p className="text-xs text-muted-foreground mb-1">data.items[].title（必需）里程碑名称</p>
            <p className="text-xs text-muted-foreground mb-1">data.items[].date（必需）日期文字</p>
            <p className="text-xs text-muted-foreground">data.items[].done（必需）是否已完成</p>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <h3 className="text-sm font-medium mb-1">kanban — 看板</h3>
            <p className="text-xs text-muted-foreground mb-1">data.columns[].title（必需）列名称</p>
            <p className="text-xs text-muted-foreground">data.columns[].items[].title（必需）卡片内容</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">多用户</h2>
          <p className="text-sm text-muted-foreground">
            每个 userId 独立命名空间。Agent 可以推送到任意 userId/canvasId。
            用户打开自己的链接即可看到 Agent 推送的内容。
          </p>
        </section>

      </main>
    </div>
  )
}
