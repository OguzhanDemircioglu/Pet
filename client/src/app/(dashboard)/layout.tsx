import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export const metadata: Metadata = {
  title: 'Pano | PetToptan',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/giris')

  const s = session as unknown as { plan?: 'FREE' | 'PRO' | 'PRO_PLUS' | null; user: { name?: string | null; email?: string | null } }
  const plan = s.plan ?? 'FREE'

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar plan={plan} />
      <div className="flex flex-1 flex-col">
        <Topbar plan={plan} userEmail={s.user.email ?? ''} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
