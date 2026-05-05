'use client'
import { useState } from 'react'
import Link from 'next/link'
import AuthShell from '../AuthShell'
import { saasApi } from '@/lib/api/saas'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await saasApi.requestPasswordReset(email)
      setDone(true)
    } catch (e) {
      setErr((e as Error).message)
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className={'login-card' + (shake ? ' shake' : '')}>
        <div className="login-header">
          <h2 className="login-title">Şifremi unuttum 🔑</h2>
          <div className="login-sub">
            E-posta adresine sıfırlama bağlantısı gönderelim.
          </div>
        </div>

        {done ? (
          <div className="auth-done">
            <div className="auth-done-icon" aria-hidden="true">✓</div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55, marginBottom: 18 }}>
              Sıfırlama bağlantısı, sistemde kayıtlıysa <strong>{email}</strong> adresine
              gönderildi. Lütfen e-postanızı kontrol edin (30 dakika geçerli).
            </p>
            <Link href="/giris" className="btn-submit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', height: 48 }}>
              ← Giriş ekranına dön
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} aria-label="Şifre sıfırlama formu">
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">E-posta Adresi</label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {err && <div role="alert" className="alert-error">⚠️ {err}</div>}
            <button type="submit" className="btn-submit" disabled={busy}>
              {busy ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
            </button>
            <div className="helper-row">
              <span className="muted">Hatırladın mı?</span>
              <Link href="/giris">← Girişe dön</Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
