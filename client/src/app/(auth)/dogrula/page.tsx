'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import AuthShell from '../AuthShell'
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
  const [shake, setShake] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialEmail && codeRef.current) codeRef.current.focus()
  }, [initialEmail])

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setErr('6 haneli kodu girin'); triggerShake(); return }
    setErr(null); setBusy(true)
    try {
      await clientApi.post('/auth/verify-email', { email, code })
      toast.success('Hesap doğrulandı')
      router.push('/giris?verified=1')
    } catch (e) {
      setErr((e as Error).message)
      triggerShake()
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!email) { setErr('Önce e-posta girin'); triggerShake(); return }
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
    <AuthShell>
      <div className={'login-card' + (shake ? ' shake' : '')}>
        <div className="login-header">
          <h2 className="login-title">E-posta Doğrulama 📧</h2>
          <div className="login-sub">
            Posta kutuna gönderdiğimiz 6 haneli kodu gir.
          </div>
        </div>

        <form onSubmit={verify} aria-label="Doğrulama formu">
          <div className="form-group">
            <label className="form-label" htmlFor="verify-email">E-posta Adresi</label>
            <input
              id="verify-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="ornek@email.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="verify-code">Doğrulama Kodu</label>
            <input
              ref={codeRef}
              id="verify-code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="otp-input"
              placeholder="------"
              autoComplete="one-time-code"
            />
          </div>
          {err && <div role="alert" className="alert-error">⚠️ {err}</div>}
          <button type="submit" className="btn-submit" disabled={busy}>
            {busy ? 'Doğrulanıyor…' : 'Doğrula'}
          </button>
          <div className="helper-row">
            <button type="button" onClick={resend} disabled={busy}>
              Kodu tekrar gönder
            </button>
            <Link href="/giris" className="muted">← Girişe dön</Link>
          </div>
        </form>
      </div>
    </AuthShell>
  )
}
