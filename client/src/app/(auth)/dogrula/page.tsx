'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'
import clientApi from '@/lib/api/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useSearchParams()
  const initialEmail = params.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialEmail && codeRef.current) codeRef.current.focus()
  }, [initialEmail])

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setErr('6 haneli kodu girin'); return }
    setErr(null); setBusy(true)
    try {
      await clientApi.post('/auth/verify-email', { email, code })
      toast.success('Hesap doğrulandı')
      // Backend AuthResponse döner ama biz NextAuth kullanıyoruz — kullanıcı şifresiyle login etsin
      router.push('/giris?verified=1')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!email) { setErr('Önce e-posta girin'); return }
    setBusy(true)
    try {
      await clientApi.post('/auth/resend-verification', { email })
      toast.success('Yeni doğrulama kodu gönderildi')
    } catch (e) {
      swalError((e as Error).message)
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
        <h2 className="mb-2 text-xl font-semibold">E-posta doğrulama</h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          E-postanıza gönderilen 6 haneli kodu girin.
        </p>

        {err && <div role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

        <form onSubmit={verify} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">E-posta</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Doğrulama Kodu</span>
            <input
              ref={codeRef}
              type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${input} text-center text-2xl tracking-[0.6em] font-mono`} placeholder="------"
            />
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-md bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? 'Doğrulanıyor…' : 'Doğrula'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button onClick={resend} disabled={busy} className="text-sky-700 hover:underline disabled:opacity-50">
            Kodu tekrar gönder
          </button>
          <Link href="/giris" className="text-gray-500 hover:underline">← Girişe dön</Link>
        </div>
      </div>
    </div>
  )
}

const input = 'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900'
