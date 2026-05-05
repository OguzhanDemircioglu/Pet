'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell from '../AuthShell'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!token) setErr('Geçersiz veya eksik token')
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setErr('Şifre en az 6 karakter olmalı'); triggerShake(); return }
    if (password !== confirm) { setErr('Şifreler eşleşmiyor'); triggerShake(); return }
    setErr(null); setBusy(true)
    try {
      await saasApi.confirmPasswordReset(token, password)
      setDone(true)
      toast.success('Şifreniz sıfırlandı')
      setTimeout(() => router.push('/giris'), 2000)
    } catch (err) {
      setErr((err as Error).message)
      triggerShake()
    } finally {
      setBusy(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  return (
    <AuthShell>
      <div className={'login-card' + (shake ? ' shake' : '')}>
        <div className="login-header">
          <h2 className="login-title">Yeni Şifre Belirle 🔐</h2>
          <div className="login-sub">Hesabın için güçlü bir şifre seç. En az 6 karakter.</div>
        </div>

        {done ? (
          <div className="auth-done">
            <div className="auth-done-icon" aria-hidden="true">✓</div>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
              Şifren başarıyla değiştirildi. Giriş ekranına yönlendiriliyorsun…
            </p>
          </div>
        ) : (
          <form onSubmit={submit} aria-label="Şifre sıfırlama formu">
            <div className="form-group">
              <label className="form-label" htmlFor="new-pwd">Yeni Şifre</label>
              <div className="password-wrap">
                <input
                  id="new-pwd"
                  type={showPwd ? 'text' : 'password'}
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pwd">Yeni Şifre (Tekrar)</label>
              <input
                id="confirm-pwd"
                type={showPwd ? 'text' : 'password'}
                minLength={6}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input"
                placeholder="Şifreyi tekrar yaz"
              />
            </div>
            {err && <div role="alert" className="alert-error">⚠️ {err}</div>}
            <button type="submit" className="btn-submit" disabled={busy || !token}>
              {busy ? 'Sıfırlanıyor…' : 'Şifreyi Sıfırla'}
            </button>
            <div className="helper-row">
              <span className="muted">İşin bitti mi?</span>
              <Link href="/giris">← Girişe dön</Link>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
