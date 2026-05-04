'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { saasApi } from '@/lib/api/saas'
import './auth-mockup.css'

type Tab = 'login' | 'register'

const MailSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const WhatsAppSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && (theme === 'system' ? resolvedTheme : theme) === 'dark'

  // info-bar carousel
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % 3), 3500)
    return () => clearInterval(id)
  }, [])

  // tabs
  const [tab, setTab] = useState<Tab>(initialTab)
  const switchTab = (t: Tab) => {
    setTab(t)
    router.replace(t === 'login' ? '/giris' : '/kayit')
  }

  // login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPwd, setLoginPwd] = useState('')
  const [loginShowPwd, setLoginShowPwd] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [loginOk, setLoginOk] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  // register state
  const [regCompany, setRegCompany] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPwd, setRegPwd] = useState('')
  const [regShowPwd, setRegShowPwd] = useState(false)
  const [regErr, setRegErr] = useState('')
  const [regOk, setRegOk] = useState('')
  const [regBusy, setRegBusy] = useState(false)

  // logo fallback
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginErr('')
    setLoginOk('')
    setLoginBusy(true)
    try {
      const res = await signIn('credentials', {
        email: loginEmail,
        password: loginPwd,
        redirect: false,
      })
      if (res?.error) {
        setLoginErr('E-posta veya şifre hatalı')
      } else if (res?.ok) {
        setLoginOk('Giriş başarılı! Yönlendiriliyorsunuz...')
        setTimeout(() => router.replace(callbackUrl), 600)
      }
    } catch {
      setLoginErr('Sunucuya bağlanılamadı.')
    } finally {
      setLoginBusy(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegErr('')
    setRegOk('')
    if (!regCompany.trim()) { setRegErr('İşletme adı zorunludur'); return }
    if (regPwd.length < 6) { setRegErr('Şifre en az 6 karakter olmalıdır'); return }
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
    } finally {
      setRegBusy(false)
    }
  }

  return (
    <div className="mlogin">
      {/* INFO BAR */}
      <div className="info-bar">
        <div className="info-bar-inner">
          <div className={'info-bar-slide' + (slide === 0 ? ' active' : '')}>
            <MailSvg />
            Bize ulaşın: <a href="mailto:info@pettoptan.com.tr">info@pettoptan.com.tr</a>
          </div>
          <div className={'info-bar-slide' + (slide === 1 ? ' active' : '')}>
            <a
              href="https://wa.me/905XXXXXXXXX"
              target="_blank"
              rel="noopener"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.95)', textDecoration: 'none' }}
            >
              <WhatsAppSvg />
              <strong>WhatsApp:</strong> +90 5XX XXX XX XX
            </a>
            &nbsp;·&nbsp; Haftaiçi 09:00–18:00
          </div>
          <div className={'info-bar-slide' + (slide === 2 ? ' active' : '')}>
            <WhatsAppSvg />
            <strong>Satıcıya Sor</strong> — Her ürün sayfasında WhatsApp ile direkt satıcıya ulaşın
          </div>
          <div className="info-bar-dot-wrap">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slayt ${i + 1}`}
                onClick={() => setSlide(i)}
                className={'info-bar-dot' + (slide === i ? ' active' : '')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <Link href="/" className="logo">
              {!logoBroken ? (
                <div className="logo-icon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.svg"
                    alt="PetToptan"
                    onError={() => setLogoBroken(true)}
                  />
                </div>
              ) : (
                <div className="logo-icon-fallback">🐾</div>
              )}
              <div className="logo-text">
                <span className="pet-text">Pet</span>
                <span className="toptan-text">Toptan</span>
              </div>
            </Link>
            <button
              type="button"
              className="theme-toggle"
              title="Tema değiştir"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="page-wrap">
        <div className="login-wrap">
          <div className="login-card">

            {/* Tabs */}
            <div className="card-tabs">
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
            </div>

            {/* GİRİŞ PANELI */}
            <div className={'tab-panel' + (tab === 'login' ? ' active' : '')}>
              <div className="login-header" style={{ marginBottom: 24 }}>
                <h1 className="login-title">Tekrar hoş geldiniz 👋</h1>
                <div className="login-sub">Hesabınıza giriş yaparak sipariş geçmişinizi ve özel fiyatlarınızı görebilirsiniz.</div>
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
                    aria-label="E-posta"
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
                      aria-label="Şifre"
                      required
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setLoginShowPwd((v) => !v)}>
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
                {loginErr && (
                  <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                    {loginErr}
                  </div>
                )}
                {loginOk && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 14 }}>
                    {loginOk}
                  </div>
                )}
                <button type="submit" className="btn-submit" disabled={loginBusy}>
                  {loginBusy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>

              <div className="register-link">
                Hesabın yok mu?{' '}
                <button type="button" onClick={() => switchTab('register')}>Üye ol</button>
              </div>
            </div>

            {/* KAYIT PANELI */}
            <div className={'tab-panel' + (tab === 'register' ? ' active' : '')}>
              <div className="login-header" style={{ marginBottom: 24 }}>
                <h1 className="login-title">Ücretsiz Kayıt Ol ✨</h1>
                <div className="login-sub">İşletme hesabınızı oluşturun, FREE plan ile sınırsız ürün ve satış kaydını hemen kullanmaya başlayın.</div>
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
                    aria-label="İşletme Adı"
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
                    aria-label="E-posta"
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
                      aria-label="Şifre"
                      required
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setRegShowPwd((v) => !v)}>
                      {regShowPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                {regErr && (
                  <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                    {regErr}
                  </div>
                )}
                {regOk && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 14 }}>
                    {regOk}
                  </div>
                )}
                <button type="submit" className="btn-submit" disabled={regBusy}>
                  {regBusy ? 'Kaydediliyor...' : 'Üye Ol'}
                </button>
              </form>

              <div className="register-link">
                Zaten hesabın var mı?{' '}
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
                  // Server tarafı page.tsx bunu okuyup yönlendirme kararı verir.
                  // 1 yıl, path=/, lax SameSite (cross-site form post'larından korumak için).
                  document.cookie = 'pt-guest=true; path=/; max-age=31536000; samesite=lax'
                }
              }}
              style={{ color: 'var(--primary)', fontWeight: 600 }}
            >
              Misafir olarak devam et →
            </Link>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-text">
          © {new Date().getFullYear()} PetToptan &nbsp;·&nbsp;
          <a href="#">Gizlilik Politikası</a> &nbsp;·&nbsp;
          <a href="#">Kullanım Koşulları</a>
        </div>
      </footer>
    </div>
  )
}
