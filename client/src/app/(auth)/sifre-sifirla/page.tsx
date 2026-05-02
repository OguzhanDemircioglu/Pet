'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setErr('Geçersiz veya eksik token')
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setErr('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirm) { setErr('Şifreler eşleşmiyor'); return }
    setErr(null); setBusy(true)
    try {
      await saasApi.confirmPasswordReset(token, password)
      setDone(true)
      toast.success('Şifreniz sıfırlandı')
      setTimeout(() => router.push('/giris'), 2000)
    } catch (err) {
      setErr((err as Error).message)
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
        <h2 className="mb-6 text-xl font-semibold">Yeni Şifre Belirle</h2>

        {done ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Şifreniz başarıyla değiştirildi. Giriş ekranına yönlendiriliyorsunuz…
          </div>
        ) : (
          <>
            {err && <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Yeni şifre</span>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Yeni şifre (tekrar)</span>
                <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900" />
              </label>
              <button type="submit" disabled={busy || !token} className="w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {busy ? 'Sıfırlanıyor…' : 'Şifreyi Sıfırla'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/giris" className="text-sky-700 hover:underline">← Girişe dön</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
