'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Battery, ListTodo, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide { type: string; title: string; data: any }

export default function CanvasClient({ userId, canvasId }: { userId: string; canvasId: string }) {
  const router = useRouter()
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const storedUserId = localStorage.getItem('canvas_user_id')
    const token = localStorage.getItem('canvas_token')
    if (!storedUserId || !token || storedUserId !== userId) {
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [userId, router])

  const load = async () => {
    const r = await fetch(`/api/canvas?userId=${userId}&canvasId=${canvasId}`)
    const d = await r.json()
    if (d.slides) setSlides(d.slides)
  }
  useEffect(() => { if (authorized) { load().then(() => setLoading(false)); const t = setInterval(() => load(), 5000); return () => clearInterval(t) } }, [authorized, userId, canvasId])
  const s = slides[index]
  if (!s && loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" /></div>
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-12 bg-background/80 backdrop-blur border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold tracking-tight">◆ AgentCanvas</h1>
          <span className="text-xs text-muted-foreground">{userId.slice(0, 8)}/{canvasId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/${userId}/dashboard`)}>Dashboard</Button>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.clear(); router.push('/') }}>Logout</Button>
          {slides.length > 1 && (
            <>
              <span className="text-xs text-muted-foreground mx-1 tabular-nums">{index + 1}/{slides.length}</span>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}><ChevronLeft size={14} /></Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setIndex(i => Math.min(slides.length - 1, i + 1))} disabled={index === slides.length - 1}><ChevronRight size={14} /></Button>
            </>
          )}
        </div>
      </header>
      <main className="p-6 max-w-3xl mx-auto">
        {s.type === 'dashboard' && <Dashboard data={s.data} title={s.title} userId={userId} canvasId={canvasId} />}
        {s.type === 'form' && <FormSlide data={s.data} title={s.title} userId={userId} canvasId={canvasId} />}
        {s.type === 'timeline' && <Timeline data={s.data} title={s.title} />}
        {s.type === 'page' && <PageSlide data={s.data} title={s.title} />}
        {s.type === 'table' && <TableSlide data={s.data} title={s.title} />}
        {s.type === 'chart' && <ChartSlide data={s.data} title={s.title} />}
      </main>
    </div>
  )
}

function StatCard({ label, value, tone, icon }: { label: string; value: string; tone?: 'green' | 'red' | 'purple'; icon: React.ReactNode }) {
  const color = tone === 'green' ? 'text-success' : tone === 'red' ? 'text-destructive' : tone === 'purple' ? 'text-primary' : 'text-foreground'
  return (
    <div className="bg-card rounded-lg border px-4 py-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`text-xl font-semibold tabular-nums mt-0.5 ${color}`}>{value}</p>
      </div>
    </div>
  )
}

function Dashboard({ data, title, userId, canvasId }: { data: any; title: string; userId: string; canvasId: string }) {
  const tasks = data?.tasks || []; const battery = data?.battery; const cols = data?.collections || []
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set())
  const todoCount = tasks.filter((t: any) => t.status !== 'DONE').length
  const totalAmount = cols.reduce((a: number, c: any) => a + (c.amount || 0), 0)
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="grid grid-cols-3 gap-3">
        {battery !== undefined && <StatCard label="电池" value={`${battery}%`} tone={battery < 30 ? 'red' : 'green'} icon={<Battery size={16} />} />}
        {todoCount > 0 && <StatCard label="待办" value={`${todoCount}`} tone="purple" icon={<ListTodo size={16} />} />}
        {totalAmount > 0 && <StatCard label="收款" value={`$${totalAmount}`} tone="green" icon={<Wallet size={16} />} />}
      </div>
      {tasks.length > 0 && (
        <div className="bg-card rounded-lg border divide-y">
          <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tasks</div>
          {tasks.map((t: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors ${t.status === 'DONE' || doneTasks.has(i) ? 'opacity-60' : ''}`}>
              <Checkbox checked={t.status === 'DONE' || doneTasks.has(i)}
                onCheckedChange={() => {
                  const newDone = new Set(doneTasks)
                  newDone.has(i) ? newDone.delete(i) : newDone.add(i)
                  setDoneTasks(newDone)
                  fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'toggle_task', payload: { taskIndex: i, title: t.title, done: !doneTasks.has(i) }, userId, canvasId })
                  }).catch(() => {})
                }}
              />
              <span className={`flex-1 text-[13px] ${t.status === 'DONE' || doneTasks.has(i) ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
              {t.priority === 'URGENT' && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">紧急</Badge>}
              {t.priority === 'HIGH' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">高</Badge>}
              {t.due && <span className="text-xs text-muted-foreground tabular-nums">{t.due}</span>}
            </div>
          ))}
        </div>
      )}
      {cols.length > 0 && (
        <div className="bg-card rounded-lg border divide-y">
          <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">收款</div>
          {cols.map((c: any, i: number) => (
            <div key={i} className="flex justify-between px-4 py-2.5 text-[13px] hover:bg-muted/50 transition-colors">
              <span>{c.name}</span>
              <span className="text-success font-medium tabular-nums">+${c.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormSlide({ data, title, userId, canvasId }: { data: any; title: string; userId: string; canvasId: string }) {
  const fields = data?.fields || []
  const buttons = data?.buttons || []
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const send = async (action: string, payload: any) => {
    setSubmitting(true)
    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, userId, canvasId }),
      })
      setSent(action)
    } catch {
      setSent('error')
    }
    setSubmitting(false)
  }

  // Buttons-only card (e.g. confirm / reject)
  if (fields.length === 0 && buttons.length > 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          {buttons.map((b: any) => (
            <Button
              key={b.key}
              variant={b.variant === 'destructive' ? 'destructive' : b.variant === 'secondary' ? 'secondary' : 'default'}
              disabled={submitting || sent !== null}
              onClick={() => send('choice', { choice: b.key })}
            >
              {sent === b.key ? '已提交' : b.label}
            </Button>
          ))}
          {sent === 'error' && <p className="text-xs text-destructive">提交失败</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f: any) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-[13px] font-medium">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={values[f.key] || ''}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder || ''}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            ) : (
              <Input value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} />
            )}
          </div>
        ))}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={submitting || sent !== null}
            onClick={() => send('form_submit', { values })}
          >
            {sent === 'form_submit' ? '已提交 ✓' : '提交'}
          </Button>
          {buttons.map((b: any) => (
            <Button
              key={b.key}
              variant={b.variant === 'destructive' ? 'destructive' : b.variant === 'secondary' ? 'secondary' : 'default'}
              disabled={submitting || sent !== null}
              onClick={() => send('choice', { choice: b.key, values })}
            >
              {b.label}
            </Button>
          ))}
        </div>
        {sent === 'error' && <p className="text-xs text-destructive">提交失败，请重试</p>}
      </CardContent>
    </Card>
  )
}

function Timeline({ data, title }: { data: any; title: string }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent><div className="space-y-4 pl-4 border-l-2 border-border">{(data?.items || []).map((item: any, i: number) => (
        <div key={i} className="relative pl-4">
          <div className={`absolute left-[-9px] top-1 w-3 h-3 rounded-full border-2 ${item.done ? 'bg-emerald-500 border-emerald-500' : 'bg-background border-muted-foreground'}`} />
          <p className="text-[13px] font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.date}</p>
        </div>
      ))}</div></CardContent>
    </Card>
  )
}

function PageSlide({ data, title }: { data: any; title: string }) {
  const content = data?.content || ''
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-a:text-primary prose-li:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}

function TableSlide({ data, title }: { data: any; title: string }) {
  const table = data?.table || { columns: [], rows: [] }
  const { columns, rows } = table
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b">
                {columns.map((c: any, i: number) => (
                  <th key={i} className="text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide px-3 py-2 whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r: any, i: number) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  {columns.map((c: any, j: number) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap">{r[c.key] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

const CHART_COLORS = ['#5E6AD2', '#7C8CF8', '#059669', '#F59E0B', '#E5484D', '#8B5CF6']

function ChartSlide({ data, title }: { data: any; title: string }) {
  const chart = data?.chart || { type: 'bar', data: [] }
  const { type, data: chartData } = chart
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E2E4E5" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E2E4E5" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E4E5' }} />
                <Line type="monotone" dataKey="value" stroke="#5E6AD2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : type === 'pie' ? (
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {chartData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E4E5' }} />
              </PieChart>
            ) : (
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E2E4E5" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E2E4E5" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E4E5' }} />
                <Bar dataKey="value" fill="#5E6AD2" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
