'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useTheme } from 'next-themes'
import { useMounted } from '@/hooks/useMounted'
import { authClientApi } from '@/lib/api'
import PhoneInput from '@/components/common/PhoneInput'
import { EMAIL_RE, PHONE_RE, WHITESPACE_RE } from '@/lib/constants'

function validateEmail(v: string) {
  if (!v) return 'E-posta zorunludur'
  if (!EMAIL_RE.test(v)) return 'Geçerli bir e-posta adresi girin'
  return ''
}
function validatePhone(v: string) {
  if (!v) return 'Telefon numarası zorunludur'
  if (!PHONE_RE.test(v)) return '05XX XXX XX XX formatında girin'
  return ''
}
function validatePassword(v: string) {
  if (!v) return 'Şifre zorunludur'
  if (v.length < 8) return 'En az 8 karakter olmalıdır'
  return ''
}

function Field({ label, type = 'text', value, onChange, placeholder, error, extra }: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; extra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', height: 46, border: `1.5px solid ${error ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, background: error ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: extra ? '0 46px 0 14px' : '0 14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s', boxSizing: 'border-box' }} />
        {extra}
      </div>
      {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && theme === 'dark'

  useEffect(() => {
    if (status === 'authenticated' && session) router.replace('/')
  }, [status, session, router])

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginShowPass, setLoginShowPass] = useState(false)
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({})

  // Register form state
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPass, setRegShowPass] = useState(false)
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})

  // Verify state — kayıt sonrası ya da "doğrulanmamış" hatasından sonra gösterilir
  const [verifyMode, setVerifyMode] = useState<null | 'register' | 'login'>(null)
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPassword, setPendingPassword] = useState('') // verify sonrası otomatik signIn
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')

  // Geri sayım — register response'undan dönen verifyExpiryMinutes ile başlatılır
  const [verifyMinutes, setVerifyMinutes] = useState(3)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback((minutes?: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const m = minutes ?? verifyMinutes
    setSecondsLeft(m * 60)
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }, [verifyMinutes])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  useEffect(() => {
    if (searchParams.get('emailChanged') === 'true') {
      toast.success('E-posta adresiniz güncellendi. Lütfen tekrar giriş yapın.')
    }
  }, [searchParams])

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof loginErrors = {}
    const emailErr = validateEmail(loginEmail)
    if (emailErr) errs.email = emailErr
    if (!loginPassword) errs.password = 'Şifre zorunludur'
    if (Object.keys(errs).length) { setLoginErrors(errs); return }
    setLoading(true)
    try {
      const res = await signIn('credentials', { email: loginEmail, password: loginPassword, redirect: false })
      if (res?.error) {
        // Backend "doğrulanmamış" mesajı dönüyorsa verify ekranına geç
        // NextAuth Credentials sadece null dönmemize izin verir, bu yüzden
        // backend'i direkt çağırıp ayrımı buradan yapıyoruz
        const probe = await authClientApi.login(loginEmail, loginPassword).catch((err: Error) => err)
        const msg = probe instanceof Error ? probe.message : ''
        if (msg.toLowerCase().includes('doğrulan')) {
          setPendingEmail(loginEmail)
          setPendingPassword(loginPassword)
          setVerifyMode('login')
          startTimer()
          toast.error('E-posta doğrulanmamış. Mailinize gönderilen kodu girin.')
        } else {
          toast.error('E-posta veya şifre hatalı')
        }
      } else {
        toast.success('Giriş başarılı')
        router.replace('/')
      }
    } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!regFirstName.trim()) errs.firstName = 'Ad zorunludur'
    if (!regLastName.trim()) errs.lastName = 'Soyad zorunludur'
    const emailErr = validateEmail(regEmail); if (emailErr) errs.email = emailErr
    const phoneErr = validatePhone(regPhone); if (phoneErr) errs.phone = phoneErr
    const passErr = validatePassword(regPassword); if (passErr) errs.password = passErr
    if (Object.keys(errs).length) { setRegErrors(errs); return }
    setLoading(true)
    try {
      const res = await authClientApi.register(regEmail, regPassword, regFirstName, regLastName, regPhone.replace(WHITESPACE_RE, ''))
      const minutes = res?.verifyExpiryMinutes ?? 3
      setVerifyMinutes(minutes)
      setPendingEmail(regEmail)
      setPendingPassword(regPassword)
      setVerifyMode('register')
      startTimer(minutes)
      toast.success('Doğrulama kodu e-postanıza gönderildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally { setLoading(false) }
  }

  // Verify code submit — backend doğrularsa otomatik NextAuth signIn yapar
  const handleVerify = useCallback(async (code: string) => {
    if (!code || code.length !== 6) { setVerifyError('6 haneli kodu girin'); return }
    setVerifyError('')
    setLoading(true)
    try {
      await authClientApi.verifyEmail(pendingEmail, code)
      // Doğrulama başarılı → otomatik signIn (kullanıcı şifresini biliyoruz)
      const res = await signIn('credentials', { email: pendingEmail, password: pendingPassword, redirect: false })
      if (res?.error) {
        toast.success('Doğrulama başarılı. Lütfen giriş yapın.')
        setVerifyMode(null)
        setVerifyCode('')
        setLoginEmail(pendingEmail)
        setTab('login')
      } else {
        toast.success('Hesabınız doğrulandı, giriş yapıldı')
        router.replace('/')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Doğrulama başarısız')
      setVerifyCode('')
    } finally { setLoading(false) }
  }, [pendingEmail, pendingPassword, router])

  const handleResend = async () => {
    try {
      await authClientApi.resendVerification(pendingEmail)
      startTimer()
      toast.success('Doğrulama kodu tekrar gönderildi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kod gönderilemedi')
    }
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', height: 48, background: 'var(--primary)', color: '#fff',
    borderRadius: 8, fontSize: 15, fontWeight: 700, boxShadow: '0 4px 14px rgba(220,38,38,.3)',
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4,
  }
  const googleBtnStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 8,
    height: 46, fontSize: 14.5, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', marginBottom: 20,
  }
  const dividerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }
  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
      {show ? '🙈' : '👁️'}
    </button>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: isDark ? '#1a2333' : 'var(--bg2)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,var(--primary),#ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🐾</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              <span style={{ color: 'var(--primary)' }}>Pet</span>
              <span style={{ color: 'var(--accent)' }}>Toptan</span>
            </div>
          </Link>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', marginLeft: 8, fontSize: 24 }}>
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,.13)', padding: '40px 40px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,var(--primary),#f87171)' }} />

            {/* Verify ekranı */}
            {verifyMode ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>E-posta Doğrulama 📧</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>
                    <strong>{pendingEmail}</strong> adresine gönderilen 6 haneli kodu girin
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: secondsLeft <= 20 ? '#dc2626' : 'var(--text3)' }}>
                    {secondsLeft > 0 ? <>⏱ Geçerlilik: <span>{fmtTime(secondsLeft)}</span></> : '⛔ Kodun süresi doldu'}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Doğrulama Kodu</label>
                  <input autoFocus value={verifyCode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerifyCode(v); setVerifyError('')
                      if (v.length === 6) handleVerify(v)
                    }}
                    placeholder="------" maxLength={6} disabled={secondsLeft === 0 || loading}
                    style={{ width: '100%', height: 54, border: `1.5px solid ${verifyError ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, background: verifyError ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 24, letterSpacing: 8, textAlign: 'center', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  {loading && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>Doğrulanıyor...</div>}
                  {verifyError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{verifyError}</div>}
                </div>
                {secondsLeft === 0 && (
                  <button onClick={handleResend} style={{ width: '100%', height: 44, background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', marginBottom: 12 }}>
                    🔄 Kodu Tekrar Gönder
                  </button>
                )}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={() => { setVerifyMode(null); setVerifyCode('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer' }}>
                    ← Geri dön
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 28 }}>
                  {(['login', 'register'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{ flex: 1, padding: '10px 0', fontSize: 14.5, fontWeight: 700, color: tab === t ? 'var(--primary)' : 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2 }}>
                      {t === 'login' ? 'Giriş Yap' : 'Üye Ol'}
                    </button>
                  ))}
                </div>

                {tab === 'login' ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tekrar hoş geldiniz 👋</div>
                    </div>
                    <button onClick={() => signIn('google', { callbackUrl: '/' })} style={googleBtnStyle}>
                      Google ile Giriş Yap
                    </button>
                    <div style={dividerStyle}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>veya e-posta ile</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    <form onSubmit={handleLogin}>
                      <Field label="E-posta Adresi" type="email" value={loginEmail}
                        onChange={v => { setLoginEmail(v); setLoginErrors(p => ({ ...p, email: '' })) }}
                        placeholder="ornek@email.com" error={loginErrors.email} />
                      <Field label="Şifre" type={loginShowPass ? 'text' : 'password'} value={loginPassword}
                        onChange={v => { setLoginPassword(v); setLoginErrors(p => ({ ...p, password: '' })) }}
                        placeholder="••••••••" error={loginErrors.password}
                        extra={eyeBtn(loginShowPass, () => setLoginShowPass(!loginShowPass))} />
                      <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Ücretsiz Kayıt Ol ✨</div>
                    </div>
                    <button onClick={() => signIn('google', { callbackUrl: '/' })} style={googleBtnStyle}>
                      Google ile Kayıt Ol
                    </button>
                    <div style={dividerStyle}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>veya e-posta ile</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    <form onSubmit={handleRegister}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field label="Ad" value={regFirstName} onChange={v => { setRegFirstName(v.replace(/\d/g, '').slice(0, 20)); setRegErrors(p => ({ ...p, firstName: '' })) }} placeholder="Adınız" error={regErrors.firstName} />
                        <Field label="Soyad" value={regLastName} onChange={v => { setRegLastName(v.replace(/\d/g, '').slice(0, 20)); setRegErrors(p => ({ ...p, lastName: '' })) }} placeholder="Soyadınız" error={regErrors.lastName} />
                      </div>
                      <Field label="E-posta Adresi" type="email" value={regEmail} onChange={v => { setRegEmail(v); setRegErrors(p => ({ ...p, email: '' })) }} placeholder="ornek@email.com" error={regErrors.email} />
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Telefon</label>
                        <PhoneInput value={regPhone}
                          onChange={v => { setRegPhone(v); setRegErrors(p => ({ ...p, phone: '' })) }}
                          style={{ width: '100%', height: 46, border: `1.5px solid ${regErrors.phone ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, background: regErrors.phone ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 14.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        {regErrors.phone && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{regErrors.phone}</div>}
                      </div>
                      <Field label="Şifre" type={regShowPass ? 'text' : 'password'} value={regPassword} onChange={v => { setRegPassword(v); setRegErrors(p => ({ ...p, password: '' })) }} placeholder="En az 8 karakter" error={regErrors.password} extra={eyeBtn(regShowPass, () => setRegShowPass(!regShowPass))} />
                      <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Kaydediliyor...' : 'Üye Ol'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
            <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600 }}>Misafir olarak devam et →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
