import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">◆ AgentCanvas</h1>
        <a href="https://github.com/EricZhou0815/agent-canvas" className="text-sm text-muted-foreground hover:text-foreground">GitHub</a>
      </header>
      <main className="max-w-4xl mx-auto p-6 space-y-10">

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
            <p>1. Agent calls <code className="text-xs bg-muted px-1 rounded">POST /api/canvas?userId=xxx&amp;canvasId=yyy</code> with slide data.</p>
            <p>2. Data is stored in Supabase.</p>
            <p>3. User opens a URL like <code className="text-xs bg-muted px-1 rounded">https://agent-canvas-eta.vercel.app/eric/today</code>.</p>
            <p>4. Frontend reads from Supabase and renders the slides.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">API Reference</h2>
          <div className="text-sm space-y-2">
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Push slides</p>
              <p className="text-xs text-muted-foreground">POST /api/canvas?userId=xxx&amp;canvasId=yyy</p>
              <pre className="text-xs mt-2 overflow-x-auto">
{`{
  "slides": [
    {
      "type": "dashboard",
      "title": "My Dashboard",
      "data": { ... }
    }
  ]
}`}
              </pre>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium mb-1">Read slides</p>
              <p className="text-xs text-muted-foreground">GET /api/canvas?userId=xxx&amp;canvasId=yyy</p>
              <p className="text-xs text-muted-foreground mt-1">Returns the slide array and current index.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Slide Types &amp; Data Schemas</h2>

          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">dashboard</h3>
            <p className="text-xs text-muted-foreground mb-2">Task list with battery, stats, and collections.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "dashboard",
  "title": "Eric's Dashboard",
  "data": {
    "battery": 85,
    "tasks": [
      {
        "title": "Call contractor",
        "status": "TODO",
        "priority": "URGENT",
        "due": "today"
      }
    ],
    "collections": [
      { "name": "Job A", "amount": 100 }
    ]
  }
}`}
            </pre>
            <table className="text-xs w-full mt-2">
              <thead><tr className="text-left border-b"><th className="py-1 pr-4">Field</th><th className="py-1 pr-4">Type</th><th className="py-1">Notes</th></tr></thead>
              <tbody>
                <tr><td className="py-1 pr-4 font-mono">tasks[].title</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required</td></tr>
                <tr><td className="py-1 pr-4 font-mono">tasks[].status</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required: &quot;TODO&quot; or &quot;DONE&quot;</td></tr>
                <tr><td className="py-1 pr-4 font-mono">tasks[].priority</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Optional: URGENT / HIGH / MEDIUM / LOW</td></tr>
                <tr><td className="py-1 pr-4 font-mono">tasks[].due</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Optional: any text</td></tr>
                <tr><td className="py-1 pr-4 font-mono">collections[].name</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Optional</td></tr>
                <tr><td className="py-1 pr-4 font-mono">collections[].amount</td><td className="py-1 pr-4">number</td><td className="py-1 text-muted-foreground">Optional</td></tr>
                <tr><td className="py-1 pr-4 font-mono">battery</td><td className="py-1 pr-4">number</td><td className="py-1 text-muted-foreground">Optional: percentage</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">timeline</h3>
            <p className="text-xs text-muted-foreground mb-2">Milestones with dates and completion status.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "timeline",
  "title": "House Move Countdown",
  "data": {
    "items": [
      { "title": "Clear furniture", "date": "Jul 27", "done": true },
      { "title": "Hand over keys", "date": "Aug 2", "done": false }
    ]
  }
}`}
            </pre>
            <table className="text-xs w-full mt-2">
              <thead><tr className="text-left border-b"><th className="py-1 pr-4">Field</th><th className="py-1 pr-4">Type</th><th className="py-1">Notes</th></tr></thead>
              <tbody>
                <tr><td className="py-1 pr-4 font-mono">items[].title</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required</td></tr>
                <tr><td className="py-1 pr-4 font-mono">items[].date</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required</td></tr>
                <tr><td className="py-1 pr-4 font-mono">items[].done</td><td className="py-1 pr-4">boolean</td><td className="py-1 text-muted-foreground">Required</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <h3 className="text-sm font-medium mb-1">kanban</h3>
            <p className="text-xs text-muted-foreground mb-2">Column-based workflow view.</p>
            <pre className="text-xs overflow-x-auto">
{`{
  "type": "kanban",
  "title": "Project Board",
  "data": {
    "columns": [
      {
        "title": "To Do",
        "items": [{ "title": "Task A" }]
      }
    ]
  }
}`}
            </pre>
            <table className="text-xs w-full mt-2">
              <thead><tr className="text-left border-b"><th className="py-1 pr-4">Field</th><th className="py-1 pr-4">Type</th><th className="py-1">Notes</th></tr></thead>
              <tbody>
                <tr><td className="py-1 pr-4 font-mono">columns[].title</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required</td></tr>
                <tr><td className="py-1 pr-4 font-mono">columns[].items[].title</td><td className="py-1 pr-4">string</td><td className="py-1 text-muted-foreground">Required</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Quick Example</h2>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=eric&canvasId=demo" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slides": [
      {
        "type": "dashboard",
        "title": "Today",
        "data": {
          "tasks": [
            {"title": "Call contractor", "status": "TODO", "priority": "URGENT"}
          ]
        }
      }
    ]
  }'`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Then share: <code className="bg-muted px-1 rounded">https://agent-canvas-eta.vercel.app/eric/demo</code>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Multi-User</h2>
          <p className="text-sm text-muted-foreground">
            Each userId is a separate namespace. Any agent can push to any userId/canvasId combination.
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
            AgentCanvas 是 AI Agent 的幻灯片式展示层。Agent 可以把面板、时间线、看板等内容推送到独立的网页上。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Slide 数据格式</h2>

          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">dashboard — 任务面板</h3>
            <p className="text-xs text-muted-foreground">data.tasks[].title（必需）· data.tasks[].status（必需，"TODO"或"DONE"）· data.tasks[].priority（可选）· data.tasks[].due（可选）· data.collections（可选）收款列表 · data.battery（可选）电池百分比</p>
          </div>
          <div className="bg-muted p-3 rounded-md mb-3">
            <h3 className="text-sm font-medium mb-1">timeline — 时间线</h3>
            <p className="text-xs text-muted-foreground">data.items[].title（必需）· data.items[].date（必需）· data.items[].done（必需）</p>
          </div>
          <div className="bg-muted p-3 rounded-md">
            <h3 className="text-sm font-medium mb-1">kanban — 看板</h3>
            <p className="text-xs text-muted-foreground">data.columns[].title（必需）· data.columns[].items[].title（必需）</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Agent 集成</h2>
          <p className="text-sm text-muted-foreground">POST /api/canvas?userId=userId&amp;canvasId=canvasId 推送 Slide 数据。用户打开 /:userId/:canvasId 即可查看。</p>
        </section>

      </main>
    </div>
  )
}
