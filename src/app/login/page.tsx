'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const body: any = { email, password }
    if (mode === 'register') {
      body.confirmPassword = confirmPwd
      if (username) body.username = username
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setMsg(data.error)

    if (mode === 'register') {
      setMsg('✅ Registered! Go to your Dashboard to view your API token.')
      localStorage.setItem('canvas_token', data.token)
      localStorage.setItem('canvas_user_id', data.userId)
    } else {
      localStorage.setItem('canvas_token', data.token)
      localStorage.setItem('canvas_user_id', data.userId)
      router.push(`/${data.userId}/dashboard`)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold tracking-tight mb-4">◆ AgentCanvas</h1>
        <input className="w-full rounded-md border bg-card px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition" placeholder="Email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} required />
        <input className="w-full rounded-md border bg-card px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition" placeholder="Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        {mode === 'register' && (
          <>
            <input className="w-full rounded-md border bg-card px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition" placeholder="Confirm password" type="password"
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
            <input className="w-full rounded-md border bg-card px-3.5 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition" placeholder="Username (optional)" value={username}
              onChange={e => setUsername(e.target.value)} />
          </>
        )}
        <button className="w-full rounded-md bg-foreground text-background py-2 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50" type="submit" disabled={loading}>
          {loading ? <span className="inline-block w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : null}
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
        <p className="text-xs text-center text-muted-foreground">
          <button type="button" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')} className="underline hover:text-foreground transition-colors">
            {mode === 'login' ? 'New identity? Register' : 'Already registered? Login'}
          </button>
        </p>
        {msg && <p className="text-xs text-muted-foreground whitespace-pre-wrap break-all">{msg}</p>}
      </form>
    </div>
  )
}
