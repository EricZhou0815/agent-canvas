import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Get user info
  const { data: user } = await supabase.from('canvas_users')
    .select('id, email, username')
    .eq('id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Get all canvas records for this user
  const { data: canvases } = await supabase.from('canvas')
    .select('id, slide_data, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  // Extract canvas names from IDs (format: "userId/canvasName")
  const canvasList = (canvases || []).map((c: any) => ({
    name: c.id.split('/').pop(),
    slideCount: (c.slide_data || []).length,
    updatedAt: c.updated_at,
  }))

  return NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username },
    canvases: canvasList,
    dashboardUrl: `https://agent-canvas-eta.vercel.app/${userId}/dashboard`,
  })
}
