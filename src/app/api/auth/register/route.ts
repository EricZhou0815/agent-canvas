import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const { email, password, confirmPassword, username } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match. confirmPassword must match password.' }, { status: 400 })
    }

    // Check if email already registered
    const { data: existing } = await supabase.from('canvas_users').select('id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Email already registered. Use /api/auth/login instead.' }, { status: 409 })
    }

    // Generate userId (UUID) and hash password
    const userId = crypto.randomUUID()
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    // Create user
    const { error: insertError } = await supabase.from('canvas_users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      username: username || null,
    })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // Generate API token
    const token = 'ac_' + crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await supabase.from('api_tokens').insert({ user_id: userId, name: 'default', token_hash: tokenHash })

    return NextResponse.json({
      userId,
      token,
      username: username || null,
      message: 'Identity created. Use the token for API calls via Authorization: Bearer header.',
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
}
