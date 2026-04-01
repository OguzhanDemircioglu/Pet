import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { loginThunk } from '../store/authSlice'
import InfoBar from '../components/InfoBar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'

const GOOGLE_SVG = (
  <svg className="google-icon" viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await dispatch(loginThunk({ email, password })).unwrap()
      toast.success('Giriş başarılı')
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <InfoBar />

      {/* Header (simple, no search) */}
      <header style={{
        background: isDark ? '#1a2333' : 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,.07)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,var(--primary),#ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px rgba(220,38,38,.35)' }}>🐾</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--primary)' }}>Pet</span>
                <span style={{ color: 'var(--accent)' }}>Toptan</span>
              </div>
            </Link>
            <button onClick={toggleTheme} title="Tema değiştir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 4, lineHeight: 1 }}>
              <span style={{ fontSize: 12, lineHeight: 1.15 }}>{isDark ? '🌙' : '☀️'}</span>
              <span style={{ fontSize: 16, lineHeight: 1.1 }}>{isDark ? '😴' : '🐱'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Card */}
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 8px 40px rgba(0,0,0,.13)',
            padding: '40px 40px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,var(--primary),#f87171)' }} />

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 28 }}>
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, textAlign: 'center', padding: '10px 0',
                  fontSize: 14.5, fontWeight: 700,
                  color: tab === t ? 'var(--primary)' : 'var(--text3)',
                  cursor: 'pointer', transition: '0.2s', position: 'relative',
                  background: 'none', border: 'none',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -2,
                }}>
                  {t === 'login' ? 'Giriş Yap' : 'Üye Ol'}
                </button>
              ))}
            </div>

            {/* Login Panel */}
            {tab === 'login' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: -0.3 }}>Tekrar hoş geldiniz 👋</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>Hesabınıza giriş yaparak sipariş geçmişinizi ve özel fiyatlarınızı görebilirsiniz.</div>
                </div>

                {/* Google Button */}
                <button style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
                  height: 46, fontSize: 14.5, fontWeight: 600, color: 'var(--text)', transition: '0.2s', marginBottom: 22,
                  cursor: 'pointer',
                }}>
                  {GOOGLE_SVG}
                  Google ile Giriş Yap
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>veya e-posta ile</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>E-posta Adresi</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="ornek@email.com" required
                      style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Şifre</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required
                        style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 46px 0 14px', outline: 'none', fontFamily: 'inherit' }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, marginTop: -4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>Beni hatırla</span>
                    </label>
                    <a href="#" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Şifremi unuttum</a>
                  </div>
                  <button type="submit" disabled={loading} style={{
                    width: '100%', height: 48, background: 'var(--primary)', color: '#fff',
                    borderRadius: 'var(--r)', fontSize: 15, fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(220,38,38,.3)', border: 'none', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}>
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--text2)' }}>
                  Hesabın yok mu? <a href="#" onClick={() => setTab('register')} style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: 4 }}>Üye ol</a>
                </div>
              </div>
            )}

            {/* Register Panel */}
            {tab === 'register' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Ücretsiz Kayıt Ol ✨</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>Hesap oluşturarak sipariş geçmişinizi takip edebilir, özel kampanyalardan haberdar olabilirsiniz.</div>
                </div>

                <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', height: 46, fontSize: 14.5, fontWeight: 600, color: 'var(--text)', transition: '0.2s', marginBottom: 22, cursor: 'pointer' }}>
                  {GOOGLE_SVG}
                  Google ile Kayıt Ol
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>veya e-posta ile</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <form onSubmit={e => e.preventDefault()}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Ad</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Adınız" style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Soyad</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Soyadınız" style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>E-posta Adresi</label>
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="ornek@email.com" style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Şifre</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showRegPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="En az 8 karakter" style={{ width: '100%', height: 46, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 46px 0 14px', outline: 'none', fontFamily: 'inherit' }} />
                      <button type="button" onClick={() => setShowRegPass(!showRegPass)} style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
                        {showRegPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" style={{ width: '100%', height: 48, background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 14px rgba(220,38,38,.3)', border: 'none', cursor: 'pointer' }}>
                    Üye Ol
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--text2)' }}>
                  Zaten hesabın var mı? <a href="#" onClick={() => setTab('login')} style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: 4 }}>Giriş yap</a>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['🔒 SSL Güvenli', '🛡️ Verileriniz Korumalı', '✅ Ücretsiz Üyelik'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text3)', fontWeight: 500 }}>{b}</div>
              ))}
            </div>
          </div>

          {/* Guest checkout note */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
            Üye olmadan da alışveriş yapabilirsiniz —{' '}
            <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Misafir olarak devam et →</Link>
          </div>
        </div>
      </main>

      <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '18px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          © 2024 PetToptan &nbsp;·&nbsp;
          <a href="#" style={{ color: 'var(--primary)' }}>Gizlilik Politikası</a> &nbsp;·&nbsp;
          <a href="#" style={{ color: 'var(--primary)' }}>Kullanım Koşulları</a>
        </div>
      </footer>
    </div>
  )
}
