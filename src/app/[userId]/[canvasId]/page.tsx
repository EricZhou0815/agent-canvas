'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CanvasClient from './client'

export default function Page({ params }: { params: { userId: string; canvasId: string } }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const storedUserId = localStorage.getItem('canvas_user_id')
    const token = localStorage.getItem('canvas_token')
    if (!storedUserId || !token) {
      router.push('/login')
    } else if (storedUserId !== params.userId) {
      // Different userId — ask to login again
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [params.userId, router])

  if (!authorized) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" /></div>

  return <CanvasClient userId={params.userId} canvasId={params.canvasId} />
}
