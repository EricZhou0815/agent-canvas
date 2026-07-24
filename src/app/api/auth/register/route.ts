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

    // Check if user exists
    const { data: existing } = await supabase.from('canvas_users').select('user_id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Generate user_id from email prefix
    const user_id = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    // Hash password (simple SHA256 — for MVP, use bcrypt/argon2 in production)
    const password_hash = crypto.createHash('sha256').update(password).digest('hex')

    // Insert user
    const { error } = await supabase.from('canvas_users').insert({ email, password_hash, user_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Generate API token
    const token = 'ac_' + crypto.randomBytes(32).toString('hex')
    const token_hash = crypto.createHash('sha256').update(token).digest('hex')
    await supabase.from('api_tokens').insert({ user_id, name: 'default', token_hash })

    return NextResponse.json({ user_id, token, message: 'Save this token — it will not be shown again' })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}
