import { NextRequest, NextResponse } from 'next/server'

// Webhook URL — update this when Cloudflare tunnel restarts
// In production, store this in Vercel KV or Supabase
const WEBHOOK_URL = process.env.AGENT_WEBHOOK_URL || 'https://paying-winners-friendly-holders.trycloudflare.com'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload, userId, canvasId } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    // Forward to local agent via webhook (await to prevent cancellation)
    const webhookPayload = {
      action,
      payload: payload || {},
      userId: userId || 'unknown',
      canvasId: canvasId || 'unknown',
      timestamp: new Date().toISOString(),
    }

    try {
      const webhookRes = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
      if (!webhookRes.ok) {
        console.error(`Webhook returned ${webhookRes.status}`)
      }
    } catch (err: any) {
      console.error('Webhook failed:', err.message)
    }

    return NextResponse.json({ ok: true, message: 'Action forwarded to agent' })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
