'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CanvasClient from './client'

export default function Page({ params }: { params: { userId: string; canvasId: string } }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const sessionUserId = localStorage.getItem('canvas_user_id')
    if (!sessionUserId) {
      router.push('/login')
    } else if (sessionUserId !== params.userId) {
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [params.userId, router])

  if (!authorized) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground animate-pulse">验证中...</p></div>

  return <CanvasClient userId={params.userId} canvasId={params.canvasId} />
}
