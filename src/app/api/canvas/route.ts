import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yuwluwwsbpeolqxyvbtu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// --- Schema validation ---

interface ValidationError {
  field: string
  message: string
  expected?: string
  received?: string
}

function validateSlides(body: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'Request body is required', expected: 'JSON object' })
    return errors
  }

  const slides = body.slides
  if (!slides) {
    errors.push({ field: 'slides', message: 'Missing required field', expected: 'array of slide objects' })
    return errors
  }

  if (!Array.isArray(slides)) {
    errors.push({ field: 'slides', message: 'Must be an array', expected: 'array', received: typeof slides })
    return errors
  }

  if (slides.length === 0) {
    errors.push({ field: 'slides', message: 'Array must not be empty' })
    return errors
  }

  const validTypes = ['dashboard', 'timeline', 'kanban', 'form']

  slides.forEach((slide: any, i: number) => {
    const prefix = `slides[${i}]`

    if (!slide || typeof slide !== 'object') {
      errors.push({ field: prefix, message: 'Each slide must be an object', expected: 'object', received: typeof slide })
      return
    }

    if (!slide.type) {
      errors.push({ field: `${prefix}.type`, message: 'Missing required field', expected: `one of: ${validTypes.join(', ')}` })
    } else if (!validTypes.includes(slide.type)) {
      errors.push({ field: `${prefix}.type`, message: 'Invalid slide type', expected: `one of: ${validTypes.join(', ')}`, received: slide.type })
    }

    if (!slide.title || typeof slide.title !== 'string') {
      errors.push({ field: `${prefix}.title`, message: 'Missing or invalid', expected: 'non-empty string', received: typeof slide.title })
    }

    if (!slide.data || typeof slide.data !== 'object') {
      errors.push({ field: `${prefix}.data`, message: 'Missing or invalid', expected: 'object', received: typeof slide.data })
      return
    }

    // Type-specific validations
    const data = slide.data

    if (slide.type === 'dashboard') {
      if (data.tasks) {
        if (!Array.isArray(data.tasks)) {
          errors.push({ field: `${prefix}.data.tasks`, message: 'Must be an array', expected: 'array', received: typeof data.tasks })
        } else {
          data.tasks.forEach((task: any, j: number) => {
            const tp = `${prefix}.data.tasks[${j}]`
            if (!task.title) errors.push({ field: `${tp}.title`, message: 'Missing required field', expected: 'non-empty string' })
            if (task.status && !['TODO', 'DONE'].includes(task.status)) {
              errors.push({ field: `${tp}.status`, message: 'Invalid status', expected: '"TODO" or "DONE"', received: task.status })
            }
            if (task.priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(task.priority)) {
              errors.push({ field: `${tp}.priority`, message: 'Invalid priority', expected: 'LOW/MEDIUM/HIGH/URGENT', received: task.priority })
            }
          })
        }
      }
      if (data.collections) {
        if (!Array.isArray(data.collections)) {
          errors.push({ field: `${prefix}.data.collections`, message: 'Must be an array', expected: 'array', received: typeof data.collections })
        } else {
          data.collections.forEach((c: any, j: number) => {
            if (c.amount !== undefined && typeof c.amount !== 'number') {
              errors.push({ field: `${prefix}.data.collections[${j}].amount`, message: 'Must be a number', expected: 'number', received: typeof c.amount })
            }
          })
        }
      }
    }

    if (slide.type === 'timeline') {
      if (data.items) {
        if (!Array.isArray(data.items)) {
          errors.push({ field: `${prefix}.data.items`, message: 'Must be an array', expected: 'array', received: typeof data.items })
        } else {
          data.items.forEach((item: any, j: number) => {
            const ip = `${prefix}.data.items[${j}]`
            if (!item.title) errors.push({ field: `${ip}.title`, message: 'Missing required field', expected: 'non-empty string' })
            if (!item.date) errors.push({ field: `${ip}.date`, message: 'Missing required field', expected: 'non-empty string' })
            if (item.done !== undefined && typeof item.done !== 'boolean') {
              errors.push({ field: `${ip}.done`, message: 'Must be a boolean', expected: 'boolean', received: typeof item.done })
            }
          })
        }
      }
    }

    if (slide.type === 'kanban') {
      if (data.columns) {
        if (!Array.isArray(data.columns)) {
          errors.push({ field: `${prefix}.data.columns`, message: 'Must be an array', expected: 'array', received: typeof data.columns })
        } else {
          data.columns.forEach((col: any, j: number) => {
            const cp = `${prefix}.data.columns[${j}]`
            if (!col.title) errors.push({ field: `${cp}.title`, message: 'Missing required field', expected: 'non-empty string' })
            if (col.items && !Array.isArray(col.items)) {
              errors.push({ field: `${cp}.items`, message: 'Must be an array', expected: 'array', received: typeof col.items })
            }
          })
        }
      }
    }
  })

  return errors
}

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

  // Validate
  const errors = validateSlides(body)
  if (errors.length > 0) {
    return NextResponse.json({
      error: 'Schema validation failed',
      validation_errors: errors,
      documentation: 'https://agent-canvas-eta.vercel.app'
    }, { status: 422 })
  }

  // Store
  const { error } = await supabase.from('canvas').upsert({
    id: `${userId}/${canvasId}`,
    user_id: userId,
    slide_data: body.slides,
    current_index: body.currentIndex ?? (body.slides ? body.slides.length - 1 : 0),
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
