import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const isGuest = (await cookies()).get('pt-guest')?.value === 'true'
  if (!isGuest) redirect('/giris')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-8">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-black tracking-tight">
          <span className="text-[var(--primary)]">Pet</span>
          <span className="text-[var(--accent)]">Toptan</span>
        </h1>
        <p className="mb-6 text-[var(--text2)]">Anasayfa yakında açılacak.</p>
        <Link
          href="/giris"
          className="inline-block rounded-md bg-[var(--primary)] px-6 py-2.5 font-semibold text-white shadow-[0_4px_14px_rgba(220,38,38,.3)] hover:bg-[var(--primary-dk)]"
        >
          Giriş yap
        </Link>
      </div>
    </main>
  )
}
