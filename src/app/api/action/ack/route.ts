import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * POST /api/action/ack — agent confirms it has handled queued actions.
 * Body: { actionIds: [1, 2, 3] }  (ids from GET /api/action/pending)
 *
 * Auth: Bearer token required. The token's user must own the actions.
 */
export async function POST(req: NextRequest) {
  try {
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

    const { actionIds } = await req.json()
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json({ error: 'Missing actionIds array' }, { status: 400 })
    }

    // Only ack actions owned by this user (prevents cross-user acking)
    const { data, error } = await supabase
      .from('actions')
      .update({ status: 'done', acked_at: new Date().toISOString() })
      .eq('user_id', tokenRow.user_id)
      .in('id', actionIds)
      .eq('status', 'pending')
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, acked: (data || []).length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
