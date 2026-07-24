import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    error: 'Invalid API endpoint',
    docs: 'https://agent-canvas-eta.vercel.app',
    validEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/canvas?userId=xxx&canvasId=yyy (requires Bearer token)',
      'GET /api/canvas?userId=xxx&canvasId=yyy (public)',
    ]
  }, { status: 404 })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: 'Invalid API endpoint',
    docs: 'https://agent-canvas-eta.vercel.app',
    validEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/canvas?userId=xxx&canvasId=yyy (requires Bearer token)',
    ]
  }, { status: 404 })
}
