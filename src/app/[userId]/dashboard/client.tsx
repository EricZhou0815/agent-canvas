'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [canvases, setCanvases] = useState<any[]>([])
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUserId = localStorage.getItem('canvas_user_id')
    const storedToken = localStorage.getItem('canvas_token')
    if (!storedUserId || !storedToken) return router.push('/login')
    if (storedUserId !== userId) return router.push('/login')

    setToken(storedToken)
    fetch(`/api/user?userId=${userId}`)
      .then(r => r.json())
      .then(d => { setUser(d.user); setCanvases(d.canvases || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">◆ AgentCanvas</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{userId.slice(0, 8)}...</span>
          <button onClick={() => { localStorage.clear(); router.push('/login') }}
            className="text-xs px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
          >Logout</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (<>
        <section>
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {user?.email || '...'}</p>
            <p><span className="text-muted-foreground">Username:</span> {user?.username || '—'}</p>
            <p><span className="text-muted-foreground">User ID:</span> <code className="bg-background px-1.5 py-0.5 rounded text-xs">{userId}</code></p>
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-3">API Token</h2>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Use this token to authenticate API calls.{' '}
              <code className="bg-background px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
            </p>
            <div className="flex gap-2">
              <code className="flex-1 bg-background rounded px-3 py-2 text-xs break-all select-all">
                {showToken ? token : '••••••••••••••••••••••••••••••••'}
              </code>
              <button onClick={() => setShowToken(!showToken)}
                className="px-3 py-2 rounded bg-muted hover:bg-muted/80 text-xs shrink-0"
              >{showToken ? 'Hide' : 'Show'}</button>
              <button onClick={() => navigator.clipboard.writeText(token)}
                className="px-3 py-2 rounded bg-foreground text-background text-xs shrink-0"
              >Copy</button>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-3">Canvases</h2>
          {canvases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No canvases yet. Tell your agent to push some data!</p>
          ) : (
            <div className="space-y-2">
              {canvases.map((c: any, i: number) => (
                <a key={i} href={`/${userId}/${c.name}`}
                  className="block bg-muted rounded-lg p-4 hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.slideCount} slides</span>
                  </div>
                  {c.updatedAt && <p className="text-xs text-muted-foreground mt-1">Updated: {new Date(c.updatedAt).toLocaleDateString()}</p>}
                </a>
              ))}
            </div>
          )}
        </section>
        </>)}
      </main>
    </div>
  )
}
