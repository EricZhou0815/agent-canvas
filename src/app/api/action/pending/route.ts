import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * GET /api/action/pending?userId=xxx&limit=50
 *
 * The polling tier — how local agents (no public IP) receive user actions.
 * Agent polls this endpoint with its Bearer token, gets queued events,
 * then acks them via POST /api/action/ack.
 *
 * Auth: Bearer token required (agent api_tokens). Public read is NOT
 * allowed here because actions may contain sensitive form data.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify agent token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization header. Use: Bearer <token>' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const { data: tokenRow, error: tokenError } = await supabase
      .from('api_tokens')
      .select('user_id')
      .eq('token_hash', tokenHash)
      .single()
    if (tokenError || !tokenRow) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || tokenRow.user_id
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    // Token must own the userId being queried
    if (userId !== tokenRow.user_id) {
      return NextResponse.json({ error: 'Token does not have access to this userId' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('actions')
      .select('id, user_id, canvas_id, action, payload, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      count: data.length,
      actions: data.map((a: any) => ({
        actionId: a.id,
        action: a.action,
        payload: a.payload,
        canvasId: a.canvas_id,
        timestamp: a.created_at,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
