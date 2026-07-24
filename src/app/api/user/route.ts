import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: user } = await supabase.from('canvas_users')
    .select('id, email, username')
    .eq('id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: canvases } = await supabase.from('canvas')
    .select('id, slide_data, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  const canvasList = (canvases || []).map((c: any) => ({
    name: c.id.split('/').pop(),
    slideCount: (c.slide_data || []).length,
    updatedAt: c.updated_at,
  }))

  return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username }, canvases: canvasList })
}
