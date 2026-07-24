import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">◆ AgentCanvas</h1>
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
          <h2 className="text-lg font-semibold mb-1">For AI Agents</h2>
          <p className="text-sm text-muted-foreground mb-2">Push a dashboard from your agent:</p>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=eric&canvasId=today" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slides": [{
      "type": "dashboard",
      "title": "My Dashboard",
      "data": {
        "battery": 85,
        "tasks": [
          {"title": "Task A", "status": "TODO", "priority": "HIGH", "due": "today"}
        ],
        "collections": [
          {"name": "Item 1", "amount": 30}
        ]
      }
    }]
  }'`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Then share the link: <code className="bg-muted px-1 rounded">https://agent-canvas-eta.vercel.app/eric/today</code>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Slide Types</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>dashboard</strong> — Task list with battery, stats, and collections</p>
            <p><strong>timeline</strong> — Milestones and deadlines</p>
            <p><strong>kanban</strong> — Column-based workflow</p>
            <p><strong>form</strong> — User input fields (coming soon)</p>
          </div>
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
            AgentCanvas 是 AI Agent 的幻灯片式展示层。Agent 可以把面板、时间线、看板、表单等内容推送到一个
            独立的网页上，用户通过浏览器查看，不再被聊天框限制。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">工作原理</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. Agent 调用 API 推送 Slide 数据</p>
            <p>2. 数据存储在 Supabase</p>
            <p>3. 用户打开对应链接查看</p>
            <p>4. 前端从数据库读取并渲染</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-1">Agent 集成</h2>
          <p className="text-sm text-muted-foreground">
            Agent 通过 <code className="text-xs bg-muted px-1 rounded">POST /api/canvas</code> 推送数据，用户打开链接即可查看。
            支持多用户（userId）和多画布（canvasId）。
          </p>
        </section>

      </main>
    </div>
  )
}
