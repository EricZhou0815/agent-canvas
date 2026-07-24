import DashboardClient from './client'

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <DashboardClient userId={userId} />
}
