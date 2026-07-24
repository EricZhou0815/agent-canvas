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
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">◆ AgentCanvas</h1>
          <span className="text-xs text-muted-foreground">{userId}/{canvasId}</span>
        </div>
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>←</Button>
            <span className="text-sm text-muted-foreground">{index + 1}/{slides.length}</span>
            <Button variant="outline" size="sm" onClick={() => setIndex(i => Math.min(slides.length - 1, i + 1))} disabled={index === slides.length - 1}>→</Button>
          </div>
        )}
      </header>
      <main className="p-6 max-w-4xl mx-auto">
        {s.type === 'dashboard' && <Dashboard data={s.data} title={s.title} />}
        {s.type === 'form' && <FormSlide data={s.data} title={s.title} />}
        {s.type === 'timeline' && <Timeline data={s.data} title={s.title} />}
        {s.type === 'page' && <PageSlide data={s.data} title={s.title} />}
      </main>
    </div>
  )
}

function Dashboard({ data, title }: { data: any; title: string }) {
  const tasks = data?.tasks || []; const battery = data?.battery; const cols = data?.collections || []
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set())
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-3 gap-4">
        {battery !== undefined && (
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">电池</p>
            <p className={`text-2xl font-bold ${battery < 30 ? 'text-destructive' : 'text-green-500'}`}>{battery}%</p>
          </CardContent></Card>
        )}
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">待办</p>
          <p className="text-2xl font-bold text-blue-500">{tasks.filter((t: any) => t.status !== 'DONE').length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">收款</p>
          <p className="text-2xl font-bold text-green-500">${cols.reduce((a: number, c: any) => a + (c.amount || 0), 0)}</p>
        </CardContent></Card>
      </div>
      <div className="space-y-2">
        {tasks.map((t: any, i: number) => (
          <Card key={i} className={t.status === 'DONE' || doneTasks.has(i) ? 'opacity-50' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <Checkbox checked={t.status === 'DONE' || doneTasks.has(i)}
                onCheckedChange={() => setDoneTasks(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })}
              />
              <span className={`flex-1 text-sm ${t.status === 'DONE' || doneTasks.has(i) ? 'line-through text-muted-foreground' : ''}`}>{t.title}</span>
              {t.priority === 'URGENT' && <Badge variant="destructive">紧急</Badge>}
              {t.due && <span className="text-xs text-muted-foreground">{t.due}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
      {cols.length > 0 && (
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground uppercase">收款</CardTitle></CardHeader>
          <CardContent className="space-y-2">{cols.map((c: any, i: number) => (
            <div key={i} className="flex justify-between text-sm"><span>{c.name}</span><span className="text-green-500 font-medium">+${c.amount}</span></div>
          ))}</CardContent>
        </Card>
      )}
    </div>
  )
}

function FormSlide({ data, title }: { data: any; title: string }) {
  const fields = data?.fields || []
  const [values, setValues] = useState<Record<string, string>>({})
  return (
    <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f: any) => (
          <div key={f.key} className="space-y-1">
            <label className="text-sm font-medium">{f.label}</label>
            <Input value={values[f.key] || ''} onChange={e => setValues(v => ({...v, [f.key]: e.target.value}))} placeholder={f.placeholder || ''} />
          </div>
        ))}
        <Button>提交</Button>
      </CardContent>
    </Card>
  )
}

function Timeline({ data, title }: { data: any; title: string }) {
  return (
    <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent><div className="space-y-4 pl-4 border-l-2">{(data?.items || []).map((item: any, i: number) => (
        <div key={i} className="relative pl-4">
          <div className={`absolute left-[-9px] w-3 h-3 rounded-full border-2 ${item.done ? 'bg-green-500 border-green-500' : 'bg-background border-muted-foreground'}`} />
          <p className="text-sm font-medium">{item.title}</p>
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
      <CardHeader><CardTitle className="text-xl">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-a:text-primary prose-li:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}
