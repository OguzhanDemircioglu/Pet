'use client'
import { useState } from 'react'
import Link from 'next/link'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await saasApi.requestPasswordReset(email)
      setDone(true)
    } catch (err) {
      toast.error((err as Error).message)
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
        <h2 className="mb-6 text-xl font-semibold">Şifremi unuttum</h2>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Sıfırlama bağlantısı, sistemde kayıtlıysa <strong>{email}</strong> adresine gönderildi.
              Lütfen e-postanızı kontrol edin (30 dakika geçerli).
            </div>
            <Link href="/giris" className="inline-block text-sm text-sky-700 hover:underline">← Giriş ekranına dön</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              E-posta adresinize sıfırlama bağlantısı gönderelim.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">E-posta</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {busy ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
            <p className="text-center text-sm text-gray-500">
              <Link href="/giris" className="text-sky-700 hover:underline">← Girişe dön</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
