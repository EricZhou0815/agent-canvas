import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function verifyAuth(req: NextRequest): Promise<{ userId?: string; error?: NextResponse }> {
  const authHeader = req.headers.get('authorization')

  // Public reads (GET) don't require auth
  if (req.method === 'GET') return {}

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Missing Authorization header. Use: Bearer <token>' }, { status: 401 }) }
  }

  const token = authHeader.slice(7)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  // Check both api_tokens (ac_ prefix) and session tokens (sess_ prefix)
  const { data, error } = await supabase.from('api_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data) {
    return { error: NextResponse.json({ error: 'Invalid token. Register first via POST /api/auth/register.' }, { status: 401 }) }
  }

  // Verify userId match if provided in URL
  const { searchParams } = new URL(req.url)
  const requestUserId = searchParams.get('userId')
  if (requestUserId && requestUserId !== data.user_id) {
    return { error: NextResponse.json({ error: 'Token does not have access to this userId' }, { status: 403 }) }
  }

  return { userId: data.user_id }
}
