export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">◆ AgentCanvas</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/login" className="hover:text-foreground">Login</a>
          <a href="https://github.com/EricZhou0815/agent-canvas" className="hover:text-foreground">GitHub</a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6 space-y-10">

        {/* Hero */}
        <section className="text-center py-8">
          <h2 className="text-3xl font-bold mb-2">◆ AgentCanvas</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A slide-based UI layer for AI agents. Push structured slides to a dedicated web page
            that users open in their browser. No chat bubble limits.
          </p>
        </section>

        {/* Quick Start for Agents */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Quick Start for AI Agents</h2>
          <div className="bg-muted p-4 rounded-md space-y-3 text-sm">
            <div>
              <p className="font-medium">Step 1: Register</p>
              <p className="text-muted-foreground text-xs mb-1">Create an identity (agent or human):</p>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`curl -X POST "https://agent-canvas-eta.vercel.app/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "my-agent@example.com", "password": "secure123"}'`}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">→ Response: <code className="bg-background px-1 rounded">{`{ userId, token }`}</code></p>
            </div>
            <div>
              <p className="font-medium">Step 2: Save the token</p>
              <p className="text-xs text-muted-foreground">The token is your identity. Use it in every API call via <code className="bg-background px-1 rounded">Authorization: Bearer &lt;token&gt;</code>.</p>
            </div>
            <div>
              <p className="font-medium">Step 3: Push a slide</p>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`curl -X POST "https://agent-canvas-eta.vercel.app/api/canvas?userId=<USER_ID>&canvasId=demo" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slides": [
      {
        "type": "dashboard",
        "title": "My Dashboard",
        "data": {
          "tasks": [
            {"title": "Task A", "status": "TODO", "priority": "HIGH"}
          ]
        }
      }
    ]
  }'`}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">→ Response: <code className="bg-background px-1 rounded">{`{ ok: true, link: "https://..." }`}</code></p>
            </div>
            <div>
              <p className="font-medium">Step 4: Share the link</p>
              <p className="text-xs text-muted-foreground">Send the link to your user. They open it and see the slides.</p>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section>
          <h2 className="text-lg font-semibold mb-2">API Reference</h2>
          <div className="text-sm space-y-3">

            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">POST /api/auth/register</p>
              <p className="text-xs text-muted-foreground">Create an identity. Returns userId + token.</p>
              <pre className="text-xs mt-1 bg-background p-2 rounded overflow-x-auto">{`Body: { "email": "...", "password": "...", "username?": "..." }`}</pre>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">POST /api/auth/login</p>
              <p className="text-xs text-muted-foreground">Login with email + password. Returns userId + session token.</p>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">POST /api/canvas</p>
              <p className="text-xs text-muted-foreground">Push slides. Requires <code className="bg-background px-1 rounded">Authorization: Bearer &lt;token&gt;</code>.</p>
              <pre className="text-xs mt-1 bg-background p-2 rounded overflow-x-auto">{`Query: ?userId=<USER_ID>&canvasId=<NAME>
Header: Authorization: Bearer <TOKEN>
Body: { "slides": [...] }`}</pre>
            </div>

          </div>
        </section>

        {/* Slide Types */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Slide Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">dashboard</p>
              <p className="text-xs text-muted-foreground">Tasks, battery, collections</p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">timeline</p>
              <p className="text-xs text-muted-foreground">Milestones with dates</p>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">kanban</p>
              <p className="text-xs text-muted-foreground">Column-based workflow</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            See <a href="https://github.com/EricZhou0815/agent-canvas" className="underline">README</a> for full data schemas.
          </p>
        </section>

        {/* Error handling */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Error Handling</h2>
          <p className="text-sm text-muted-foreground">
            The API returns descriptive error messages. Schema validation uses Zod —
            invalid fields are reported with the exact path and expected type.
          </p>
          <pre className="text-xs bg-muted p-3 rounded-md mt-2 overflow-x-auto">
{`// Example error:
{
  "error": "Schema validation failed",
  "issues": [
    {
      "path": "slides.0.type",
      "message": "Invalid option: expected one of ...",
      "code": "invalid_value"
    }
  ]
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Tech Stack</h2>
          <p className="text-sm text-muted-foreground">Next.js · shadcn/ui · Supabase · Zod · Tailwind CSS · TypeScript</p>
        </section>

      </main>
    </div>
  )
}
