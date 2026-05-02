'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const { status } = useSession()
  const callbackUrl = params.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.error) {
        setErr('E-posta veya şifre hatalı')
      } else if (res?.ok) {
        toast.success('Giriş başarılı')
        router.replace(callbackUrl)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">
        <span className="text-red-600">Pet</span><span className="text-sky-400">Toptan</span>
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-6 text-xl font-semibold">Giriş yap</h2>

        {err && <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Field label="E-posta">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" />
          </Field>
          <Field label="Şifre">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete="current-password" />
          </Field>
          <button type="submit" disabled={busy} className="w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Hesabın yok mu? <Link href="/kayit" className="text-sky-700 hover:underline">Ücretsiz başla</Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          <Link href="/sifre-unuttum" className="text-gray-500 hover:text-sky-700 hover:underline">Şifremi unuttum</Link>
        </p>
      </div>
    </div>
  )
}

const input = 'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
