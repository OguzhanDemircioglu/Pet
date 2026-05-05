'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { saasApi } from '@/lib/api/saas'
import AuthShell from './AuthShell'

type Tab = 'login' | 'register'

const GoogleSvg = () => (
  <svg className="google-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function AuthMockup({ initialTab }: { initialTab: Tab }) {
  const router = useRouter()
  const params = useSearchParams()
  const { status } = useSession()
  const callbackUrl = params.get('callbackUrl') || '/dashboard'

  const [tab, setTab] = useState<Tab>(initialTab)
  const [shake, setShake] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [loginShowPwd, setLoginShowPwd] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [loginOk, setLoginOk] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  // Register state
  const [regCompany, setRegCompany] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [regShowPwd, setRegShowPwd] = useState(false)
  const [regErr, setRegErr] = useState('')
  const [regOk, setRegOk] = useState('')
  const [regBusy, setRegBusy] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  // Tab indicator pozisyonu
  useEffect(() => {
    if (!tabsRef.current) return
    const buttons = tabsRef.current.querySelectorAll<HTMLButtonElement>('.card-tab')
    const idx = tab === 'login' ? 0 : 1
    const btn = buttons[idx]
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [tab])

  const switchTab = (t: Tab) => {
    setTab(t)
    router.replace(t === 'login' ? '/giris' : '/kayit')
  }

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginErr('')
    setLoginOk('')
    setLoginBusy(true)
    try {
      const res = await signIn('credentials', { email: loginEmail, password: loginPwd, redirect: false })
      if (res?.error) {
        setLoginErr('E-posta veya şifre hatalı')
        triggerShake()
      } else if (res?.ok) {
        setLoginOk('Giriş başarılı! Yönlendiriliyorsunuz...')
        setTimeout(() => router.replace(callbackUrl), 600)
      }
    } catch {
      setLoginErr('Sunucuya bağlanılamadı.')
      triggerShake()
    } finally {
      setLoginBusy(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegErr('')
    setRegOk('')
    if (!regCompany.trim()) { setRegErr('İşletme adı zorunludur'); triggerShake(); return }
    if (regPwd.length < 6) { setRegErr('Şifre en az 6 karakter olmalıdır'); triggerShake(); return }
    setRegBusy(true)
    try {
      await saasApi.registerCompany({
        companyName: regCompany.trim(),
        email: regEmail,
        password: regPwd,
        firstName: regFirstName || undefined,
        lastName: regLastName || undefined,
      })
      setRegOk('Hesap oluşturuldu, giriş yapılıyor...')
      const res = await signIn('credentials', { email: regEmail, password: regPwd, redirect: false })
      if (res?.ok) setTimeout(() => router.replace('/dashboard'), 400)
      else setRegErr('Otomatik giriş yapılamadı, manuel giriş yapın')
    } catch (err) {
      setRegErr((err as Error).message ?? 'Kayıt başarısız')
      triggerShake()
    } finally {
      setRegBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className={'login-card' + (shake ? ' shake' : '')}>
        {/* Tabs */}
        <div className="card-tabs" ref={tabsRef}>
          <button
            type="button"
            className={'card-tab' + (tab === 'login' ? ' active' : '')}
            onClick={() => switchTab('login')}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={'card-tab' + (tab === 'register' ? ' active' : '')}
            onClick={() => switchTab('register')}
          >
            Üye Ol
          </button>
          <span
            className="card-tab-indicator"
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden="true"
          />
        </div>

        {/* GİRİŞ PANELI */}
        <div className={'tab-panel' + (tab === 'login' ? ' active' : '')}>
          <div className="login-header">
            <h2 className="login-title">Tekrar hoş geldiniz 👋</h2>
            <div className="login-sub">
              Hesabınıza giriş yaparak sipariş geçmişinizi ve özel fiyatlarınızı görebilirsiniz.
            </div>
          </div>

          <button type="button" className="btn-google" onClick={() => signIn('google', { callbackUrl })}>
            <GoogleSvg />
            Google ile Giriş Yap
          </button>

          <div className="divider"><span>veya e-posta ile</span></div>

          <form onSubmit={handleLogin} aria-label="Giriş formu">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">E-posta Adresi</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Şifre</label>
              <div className="password-wrap">
                <input
                  id="login-password"
                  type={loginShowPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPwd}
                  onChange={(e) => setLoginPwd(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setLoginShowPwd((v) => !v)}
                  aria-label={loginShowPwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {loginShowPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-row">
              <label className="remember-wrap">
                <input type="checkbox" />
                <span className="remember-label">Beni hatırla</span>
              </label>
              <Link href="/sifre-unuttum" className="forgot-link">Şifremi unuttum</Link>
            </div>
            {loginErr && <div role="alert" className="alert-error">⚠️ {loginErr}</div>}
            {loginOk && <div className="alert-success">✅ {loginOk}</div>}
            <button type="submit" className="btn-submit" disabled={loginBusy}>
              {loginBusy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="register-link">
            Hesabın yok mu?
            <button type="button" onClick={() => switchTab('register')}>Üye ol</button>
          </div>
        </div>

        {/* KAYIT PANELI */}
        <div className={'tab-panel' + (tab === 'register' ? ' active' : '')}>
          <div className="login-header">
            <h2 className="login-title">Ücretsiz Kayıt Ol ✨</h2>
            <div className="login-sub">
              İşletme hesabınızı oluşturun, FREE plan ile sınırsız ürün ve satış kaydını
              hemen kullanmaya başlayın.
            </div>
          </div>

          <button type="button" className="btn-google" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
            <GoogleSvg />
            Google ile Kayıt Ol
          </button>

          <div className="divider"><span>veya e-posta ile</span></div>

          <form onSubmit={handleRegister} aria-label="Kayıt formu">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-company">İşletme Adı</label>
              <input
                id="reg-company"
                type="text"
                className="form-input"
                placeholder="ör. Mavi Pet Shop"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-firstname">Ad</label>
                <input
                  id="reg-firstname"
                  type="text"
                  className="form-input"
                  placeholder="Adınız"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value.replace(/\d/g, '').slice(0, 20))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-lastname">Soyad</label>
                <input
                  id="reg-lastname"
                  type="text"
                  className="form-input"
                  placeholder="Soyadınız"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value.replace(/\d/g, '').slice(0, 20))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">E-posta Adresi</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 22 }}>
              <label className="form-label" htmlFor="reg-password">Şifre</label>
              <div className="password-wrap">
                <input
                  id="reg-password"
                  type={regShowPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="En az 6 karakter"
                  value={regPwd}
                  onChange={(e) => setRegPwd(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setRegShowPwd((v) => !v)}
                  aria-label={regShowPwd ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {regShowPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {regErr && <div role="alert" className="alert-error">⚠️ {regErr}</div>}
            {regOk && <div className="alert-success">✅ {regOk}</div>}
            <button type="submit" className="btn-submit" disabled={regBusy}>
              {regBusy ? 'Kaydediliyor...' : 'Üye Ol'}
            </button>
          </form>

          <div className="register-link">
            Zaten hesabın var mı?
            <button type="button" onClick={() => switchTab('login')}>Giriş yap</button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="trust-row">
          <div className="trust-badge">🔒 SSL Güvenli</div>
          <div className="trust-badge">🛡️ Verileriniz Korumalı</div>
          <div className="trust-badge">✅ Ücretsiz Üyelik</div>
        </div>
      </div>

      {/* Guest checkout note */}
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
        Üye olmadan da göz atabilirsiniz —{' '}
        <Link
          href="/"
          onClick={() => {
            if (typeof document !== 'undefined') {
              document.cookie = 'pt-guest=true; path=/; max-age=31536000; samesite=lax'
            }
          }}
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          Misafir olarak devam et →
        </Link>
      </div>
    </AuthShell>
  )
}
