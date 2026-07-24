import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload, userId, canvasId, webhookUrl } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    // Determine webhook URL: from request, or from DB
    let targetUrl = webhookUrl
    if (!targetUrl && userId) {
      const { data: user } = await supabase.from('canvas_users')
        .select('webhook_url')
        .eq('id', userId)
        .single()
      if (user?.webhook_url) targetUrl = user.webhook_url
    }

    if (!targetUrl) {
      return NextResponse.json({ ok: true, message: 'No webhook configured. Set one in your Dashboard.' })
    }

    // Forward to local agent
    const payload2 = { action, payload: payload || {}, userId: userId || 'unknown', canvasId: canvasId || 'unknown', timestamp: new Date().toISOString() }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload2),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Webhook returned ${res.status}` }, { status: 502 })
    }

    return NextResponse.json({ ok: true, message: 'Action forwarded to agent' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
