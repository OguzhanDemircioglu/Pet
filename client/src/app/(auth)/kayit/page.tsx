'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await saasApi.registerCompany({ companyName, email, password })
      toast.success('Hesap oluşturuldu, giriş yapılıyor…')
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.ok) router.push('/dashboard')
      else setErr('Otomatik giriş yapılamadı, manuel giriş yapın')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-6 text-3xl font-bold">
        <span className="text-red-600">Pet</span><span className="text-sky-400">Toptan</span>
        <span className="ml-2 text-base font-normal text-gray-500">— ücretsiz başla</span>
      </h1>

      {err && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <Field label="İşletme Adı">
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required minLength={2} className={input} />
        </Field>
        <Field label="E-posta">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} />
        </Field>
        <Field label="Şifre">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={input} />
        </Field>
        <button type="submit" disabled={busy} className="w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {busy ? 'Oluşturuluyor…' : 'Ücretsiz Hesap Oluştur'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Hesabın var mı? <a href="/giris" className="text-sky-700 hover:underline">Giriş yap</a>
        </p>
      </form>
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
