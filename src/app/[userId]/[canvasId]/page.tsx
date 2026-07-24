import CanvasClient from './client'

export default async function Page({ params }: { params: Promise<{ userId: string; canvasId: string }> }) {
  const { userId, canvasId } = await params
  return <CanvasClient userId={userId} canvasId={canvasId} />
}
