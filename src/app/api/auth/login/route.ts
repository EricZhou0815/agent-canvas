import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuwluwwsbpeolqxyvbtu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const password_hash = crypto.createHash('sha256').update(password).digest('hex')
    const { data, error } = await supabase.from('canvas_users')
      .select('user_id')
      .eq('email', email)
      .eq('password_hash', password_hash)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Generate a session token (simple — store in cookie later)
    const session = 'sess_' + crypto.randomBytes(24).toString('hex')

    return NextResponse.json({ user_id: data.user_id, session, message: 'Login successful' })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
