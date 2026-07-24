import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuwluwwsbpeolqxyvbtu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function verifyAuth(req: NextRequest): Promise<{ userId?: string; error?: NextResponse }> {
  const authHeader = req.headers.get('authorization')
  
  // No auth required for GET (public read)
  if (req.method === 'GET') return {}

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Missing Authorization header. Use: Bearer ac_xxx' }, { status: 401 }) }
  }

  const token = authHeader.slice(7)
  const token_hash = crypto.createHash('sha256').update(token).digest('hex')

  const { data, error } = await supabase.from('api_tokens')
    .select('user_id')
    .eq('token_hash', token_hash)
    .single()

  if (error || !data) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) }
  }

  // Verify the request's userId matches the token's userId
  const { searchParams } = new URL(req.url)
  const requestUserId = searchParams.get('userId')
  
  if (requestUserId && requestUserId !== data.user_id) {
    return { error: NextResponse.json({ error: 'Token does not have access to this userId' }, { status: 403 }) }
  }

  return { userId: data.user_id }
}
