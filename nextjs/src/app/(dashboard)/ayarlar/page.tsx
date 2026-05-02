import { auth } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await auth()
  const s = session as unknown as { user?: { email?: string }; plan?: string; companyId?: number }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ayarlar</h1>
      <dl className="max-w-md space-y-3 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex justify-between"><dt className="text-gray-500">E-posta</dt><dd>{s.user?.email}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Plan</dt><dd className="font-semibold">{s.plan}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Company ID</dt><dd className="font-mono text-xs">{s.companyId}</dd></div>
      </dl>
    </div>
  )
}
