import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canvasPushSchema } from '@/lib/schema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuwluwwsbpeolqxyvbtu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// --- Handlers ---

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const canvasId = searchParams.get('canvasId')

  if (!userId || !canvasId) {
    return NextResponse.json({
      error: 'Missing query parameters',
      expected: '?userId=xxx&canvasId=yyy',
      example: '/api/canvas?userId=eric&canvasId=demo'
    }, { status: 400 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({
      error: 'Invalid JSON in request body',
      expected: 'Valid JSON object with "slides" array'
    }, { status: 400 })
  }

  // Validate with Zod
  const result = canvasPushSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({
      error: 'Schema validation failed',
      issues: result.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
      docs: 'https://agent-canvas-eta.vercel.app'
    }, { status: 422 })
  }

  // Store
  const { slides, currentIndex } = result.data
  const { error } = await supabase.from('canvas').upsert({
    id: `${userId}/${canvasId}`,
    user_id: userId,
    slide_data: slides,
    current_index: currentIndex ?? (slides ? slides.length - 1 : 0),
    updated_at: new Date().toISOString()
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, link: `https://agent-canvas-eta.vercel.app/${userId}/${canvasId}` })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const canvasId = searchParams.get('canvasId')

  if (!userId || !canvasId) {
    return NextResponse.json({ error: 'Missing query parameters', expected: '?userId=xxx&canvasId=yyy' }, { status: 400 })
  }

  const { data, error } = await supabase.from('canvas')
    .select('slide_data, current_index')
    .eq('id', `${userId}/${canvasId}`)
    .single()

  if (error) return NextResponse.json({ slides: [], currentIndex: 0, link: `https://agent-canvas-eta.vercel.app/${userId}/${canvasId}` })
  return NextResponse.json({ slides: data.slide_data, currentIndex: data.current_index, link: `https://agent-canvas-eta.vercel.app/${userId}/${canvasId}` })
}
