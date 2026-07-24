import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuwluwwsbpeolqxyvbtu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const canvasId = searchParams.get('canvasId')
  if (!userId || !canvasId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const body = await req.json()
  const { error } = await supabase.from('canvas').upsert({
    id: `${userId}/${canvasId}`, user_id: userId,
    slide_data: body.slides || [],
    current_index: body.currentIndex ?? (body.slides ? body.slides.length - 1 : 0),
    updated_at: new Date().toISOString()
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const canvasId = searchParams.get('canvasId')
  if (!userId || !canvasId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const { data, error } = await supabase.from('canvas').select('slide_data, current_index').eq('id', `${userId}/${canvasId}`).single()
  if (error) return NextResponse.json({ slides: [], currentIndex: 0 })
  return NextResponse.json({ slides: data.slide_data, currentIndex: data.current_index })
}
