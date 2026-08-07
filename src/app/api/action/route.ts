import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * POST /api/action — user interaction from the Canvas frontend.
 *
 * Every interaction (checkbox, button, form, free text) is a structured event.
 * Flow:
 *   1. INSERT into actions table (status: pending) — the durable event queue
 *   2. If a webhook is configured, forward to it (best effort — never blocks)
 *   3. Return ok. The agent picks the event up via webhook (cloud),
 *      Supabase Realtime (local), or polling GET /api/action/pending (any).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload, userId, canvasId, webhookUrl } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // 1. Store the event first — the queue is the source of truth
    const event = {
      user_id: userId,
      canvas_id: canvasId || 'unknown',
      action,
      payload: payload || {},
      status: 'pending',
    }
    const { data: row, error: insertError } = await supabase
      .from('actions')
      .insert(event)
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 2. Best-effort webhook forward (cloud agents / tunneled local agents)
    let delivered: 'webhook' | 'queued' | 'none' = 'queued'
    let targetUrl = webhookUrl
    if (!targetUrl) {
      const { data: user } = await supabase.from('canvas_users')
        .select('webhook_url')
        .eq('id', userId)
        .single()
      if (user?.webhook_url) targetUrl = user.webhook_url
    }

    if (targetUrl) {
      const forwarded = {
        action,
        payload: payload || {},
        userId,
        canvasId: canvasId || 'unknown',
        actionId: row.id,
        timestamp: new Date().toISOString(),
      }
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(forwarded),
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) {
          delivered = 'webhook'
          await supabase.from('actions').update({ status: 'done', acked_at: new Date().toISOString() }).eq('id', row.id)
        }
      } catch {
        // webhook unreachable — event stays queued for polling
      }
    } else {
      delivered = 'none'
    }

    return NextResponse.json({ ok: true, actionId: row.id, delivered, message: delivered === 'webhook' ? 'Action delivered to agent' : 'Action queued for agent polling' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
