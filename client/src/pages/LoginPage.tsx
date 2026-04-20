import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGoogleLogin } from '@react-oauth/google'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '../hooks/useAppDispatch'
import { loginThunk, registerThunk, verifyEmailThunk, setUser, logout } from '../store/authSlice'
import { authApi } from '../api/authApi'
import InfoBar from '../components/InfoBar'
import { useTheme } from '../context/ThemeContext'
import { EMAIL_RE, PHONE_RE, NON_DIGIT_RE, WHITESPACE_RE } from '../constants/regex'
import type { RootState } from '../store'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

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

function Field({
  label, type = 'text', value, onChange, placeholder, error, extra,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; extra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', height: 46,
            border: `1.5px solid ${error ? '#dc2626' : 'var(--border)'}`,
            borderRadius: 8, background: error ? '#fef2f2' : 'var(--bg3)',
            color: 'var(--text)', fontSize: 14.5,
            padding: extra ? '0 46px 0 14px' : '0 14px',
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color .15s',
          }}
        />
        {extra}
      </div>
      {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

// GoogleButton yalnızca GoogleOAuthProvider varken render edilir.
// GoogleButtonSafe → GOOGLE_CLIENT_ID yoksa disabled gösterir, varsa GoogleButton render eder.
// Bu sayede useGoogleLogin hook'u provider olmadan çağrılmaz.
function GoogleButton({ label, btnStyle }: { label: string; btnStyle: React.CSSProperties }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await authApi.googleAuth(tokenResponse.access_token)
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        dispatch(setUser(data.user))
        toast.success('Google ile giriş başarılı')
        navigate('/')
      } catch (err: unknown) {
        toast.error((err as Error).message ?? 'Google ile giriş başarısız')
      }
    },
    onError: () => toast.error('Google ile giriş başarısız'),
  })

  return <button style={btnStyle} onClick={() => login()}>{GOOGLE_SVG} {label}</button>
}

function GoogleButtonSafe({ label, btnStyle }: { label: string; btnStyle: React.CSSProperties }) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button style={{ ...btnStyle, opacity: 0.45, cursor: 'not-allowed' }}
        title="Google OAuth için VITE_GOOGLE_CLIENT_ID gerekli">
        {GOOGLE_SVG} {label}
      </button>
    )
  }
  return <GoogleButton label={label} btnStyle={btnStyle} />
}

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const dispatch = useAppDispatch()
  const authUser = useSelector((s: RootState) => s.auth.user)
  const authInitialized = useSelector((s: RootState) => s.auth.initialized)
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (authInitialized && authUser) navigate('/', { replace: true })
  }, [authInitialized, authUser, navigate])

  useEffect(() => {
    if (searchParams.get('emailChanged') === 'true') {
      dispatch(logout())
      toast.success('E-posta adresiniz güncellendi. Lütfen tekrar giriş yapın.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, dispatch])

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginShowPass, setLoginShowPass] = useState(false)
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({})
  const [pendingEmail, setPendingEmail] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')

  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regShowPass, setRegShowPass] = useState(false)
  const [regErrors, setRegErrors] = useState<Record<string, string>>({})
  const [showRegVerify, setShowRegVerify] = useState(false)
  const [regVerifyCode, setRegVerifyCode] = useState('')
  const [regVerifyError, setRegVerifyError] = useState('')

  // Doğrulama ekranı geri sayım — süre backend'den gelir
  const [verifyMinutes, setVerifyMinutes] = useState(3)
  const VERIFY_SECONDS = verifyMinutes * 60
  const [secondsLeft, setSecondsLeft] = useState(VERIFY_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    authApi.getConfig().then(c => setVerifyMinutes(c.verifyExpiryMinutes)).catch(() => {})
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSecondsLeft(VERIFY_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current!); return 0 }
        return s - 1
      })
    }, 1000)
  }, [VERIFY_SECONDS])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof loginErrors = {}
    const emailErr = validateEmail(loginEmail)
    if (emailErr) errs.email = emailErr
    if (!loginPassword) errs.password = 'Şifre zorunludur'
    if (Object.keys(errs).length) { setLoginErrors(errs); return }
    setLoginErrors({})
    setLoading(true)
    try {
      await dispatch(loginThunk({ email: loginEmail, password: loginPassword })).unwrap()
      toast.success('Giriş başarılı')
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as Error).message ?? 'Giriş başarısız'
      if (msg.toLowerCase().includes('doğrulan')) {
        setPendingEmail(loginEmail)
        setShowVerify(true)
        startTimer()
        toast.error('E-posta doğrulanmamış, kodu girin')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLoginVerify = async (code = verifyCode) => {
    if (!code || code.length !== 6) { setVerifyError('6 haneli kodu girin'); return }
    setVerifyError('')
    setLoading(true)
    try {
      await dispatch(verifyEmailThunk({ email: pendingEmail, code })).unwrap()
      toast.success('Doğrulama başarılı, giriş yapıldı')
      navigate('/')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Doğrulama başarısız')
      setVerifyCode('')
    } finally {
      setLoading(false)
    }
  }

  const phoneInputRef = useRef<HTMLInputElement>(null)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cursorPos = e.target.selectionStart ?? raw.length
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(NON_DIGIT_RE, '').length

    let digits = raw.replace(NON_DIGIT_RE, '').slice(0, 11)
    // 05 zorunluluğu
    if (digits.length >= 1 && digits[0] !== '0') digits = '0' + digits.slice(0, 10)
    if (digits.length >= 2 && digits[1] !== '5') digits = digits[0] + '5' + digits.slice(2)

    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 4) + ' ' + digits.slice(4)
    if (digits.length > 7) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7)
    if (digits.length > 9) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 9) + ' ' + digits.slice(9)
    setRegPhone(formatted)
    setRegErrors(p => ({ ...p, phone: '' }))

    requestAnimationFrame(() => {
      if (!phoneInputRef.current) return
      let digitCount = 0
      let newCursor = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++
          if (digitCount === digitsBeforeCursor) { newCursor = i + 1; break }
        }
      }
      phoneInputRef.current.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!regFirstName.trim()) errs.firstName = 'Ad zorunludur'
    else if (/\d/.test(regFirstName)) errs.firstName = 'Ad rakam içeremez'
    else if (regFirstName.trim().length > 20) errs.firstName = 'Ad en fazla 20 karakter olabilir'
    if (!regLastName.trim()) errs.lastName = 'Soyad zorunludur'
    else if (/\d/.test(regLastName)) errs.lastName = 'Soyad rakam içeremez'
    else if (regLastName.trim().length > 20) errs.lastName = 'Soyad en fazla 20 karakter olabilir'
    const emailErr = validateEmail(regEmail)
    if (emailErr) errs.email = emailErr
    const phoneErr = validatePhone(regPhone)
    if (phoneErr) errs.phone = phoneErr
    const passErr = validatePassword(regPassword)
    if (passErr) errs.password = passErr
    if (Object.keys(errs).length) { setRegErrors(errs); return }
    setRegErrors({})
    setLoading(true)
    try {
      await dispatch(registerThunk({
        email: regEmail, password: regPassword,
        firstName: regFirstName, lastName: regLastName,
        phone: regPhone.replace(WHITESPACE_RE, ''),
      })).unwrap()
      setPendingEmail(regEmail)
      setShowRegVerify(true)
      startTimer()
      toast.success('Doğrulama kodu e-postanıza gönderildi')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authApi.resendVerification(pendingEmail)
      toast.success('Doğrulama kodu tekrar gönderildi')
      startTimer()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Kod gönderilemedi')
    }
  }

  const handleRegVerify = async (code = regVerifyCode) => {
    if (!code || code.length !== 6) { setRegVerifyError('6 haneli kodu girin'); return }
    setRegVerifyError('')
    setLoading(true)
    try {
      await dispatch(verifyEmailThunk({ email: pendingEmail, code })).unwrap()
      toast.success('Hesabınız doğrulandı, giriş yapıldı')
      navigate('/')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Doğrulama başarısız')
      setRegVerifyCode('')
    } finally {
      setLoading(false)
    }
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', height: 48, background: 'var(--primary)', color: '#fff',
    borderRadius: 8, fontSize: 15, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(220,38,38,.3)', border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    marginTop: 4,
  }

  const googleBtnStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 8,
    height: 46, fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
    cursor: 'pointer', marginBottom: 20,
  }

  const dividerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
  }

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle}
      style={{ position: 'absolute', right: 0, top: 0, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>
      {show ? '🙈' : '👁️'}
    </button>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <InfoBar />

      <header style={{ background: isDark ? '#1a2333' : 'var(--bg2)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center' }}>
          <Link to="/" onClick={() => localStorage.setItem('pt-guest', 'true')} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,var(--primary),#ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px rgba(220,38,38,.35)' }}>🐾</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              <span style={{ color: 'var(--primary)' }}>{import.meta.env.VITE_BRAND_PART1}</span>
              <span style={{ color: 'var(--accent)' }}>{import.meta.env.VITE_BRAND_PART2}</span>
            </div>
          </Link>
          <button onClick={toggleTheme} title="Tema" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', marginLeft: 8, fontSize: 24, lineHeight: 1 }}>
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,.13)', padding: '40px 40px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,var(--primary),#f87171)' }} />

            <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 28 }}>
              {(['login', 'register'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setShowVerify(false); setShowRegVerify(false) }}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14.5, fontWeight: 700, color: tab === t ? 'var(--primary)' : 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2, transition: '0.2s' }}>
                  {t === 'login' ? 'Giriş Yap' : 'Üye Ol'}
                </button>
              ))}
            </div>

            {tab === 'login' && !showVerify && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tekrar hoş geldiniz 👋</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>Hesabınıza giriş yapın</div>
                </div>
                <GoogleButtonSafe label="Google ile Giriş Yap" btnStyle={googleBtnStyle} />
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: -6 }}>
                    <a href="#" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Şifremi unuttum</a>
                  </div>
                  <button type="submit" disabled={loading} style={btnStyle}>
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--text2)' }}>
                  Hesabın yok mu? <a href="#" onClick={() => setTab('register')} style={{ color: 'var(--primary)', fontWeight: 700 }}>Üye ol</a>
                </div>
              </div>
            )}

            {tab === 'login' && showVerify && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>E-posta Doğrulama 📧</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>
                    <strong>{pendingEmail}</strong> adresine gönderilen 6 haneli kodu girin
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: secondsLeft <= 20 ? '#dc2626' : 'var(--text3)' }}>
                    {secondsLeft > 0 ? <>⏱ Kodun geçerlilik süresi: <span>{fmtTime(secondsLeft)}</span></> : '⛔ Kodun süresi doldu'}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Doğrulama Kodu</label>
                  <input
                    autoFocus
                    value={verifyCode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerifyCode(v)
                      setVerifyError('')
                      if (v.length === 6) handleLoginVerify(v)
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
                  <a href="#" onClick={() => setShowVerify(false)} style={{ fontSize: 13, color: 'var(--text3)' }}>← Geri dön</a>
                </div>
              </div>
            )}

            {tab === 'register' && !showRegVerify && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Ücretsiz Kayıt Ol ✨</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>Sipariş geçmişi ve özel kampanyalar için üye olun</div>
                </div>
                <GoogleButtonSafe label="Google ile Kayıt Ol" btnStyle={googleBtnStyle} />
                <div style={dividerStyle}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>veya e-posta ile</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <form onSubmit={handleRegister}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Ad" value={regFirstName}
                      onChange={v => { setRegFirstName(v.replace(/\d/g, '').slice(0, 20)); setRegErrors(p => ({ ...p, firstName: '' })) }}
                      placeholder="Adınız" error={regErrors.firstName} />
                    <Field label="Soyad" value={regLastName}
                      onChange={v => { setRegLastName(v.replace(/\d/g, '').slice(0, 20)); setRegErrors(p => ({ ...p, lastName: '' })) }}
                      placeholder="Soyadınız" error={regErrors.lastName} />
                  </div>
                  <Field label="E-posta Adresi" type="email" value={regEmail}
                    onChange={v => { setRegEmail(v); setRegErrors(p => ({ ...p, email: '' })) }}
                    placeholder="ornek@email.com" error={regErrors.email} />
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Telefon Numarası</label>
                    <input
                      ref={phoneInputRef}
                      type="text"
                      value={regPhone}
                      onChange={handlePhoneChange}
                      placeholder="0532 123 45 67"
                      style={{
                        width: '100%', height: 46,
                        border: `1.5px solid ${regErrors.phone ? '#dc2626' : 'var(--border)'}`,
                        borderRadius: 8, background: regErrors.phone ? '#fef2f2' : 'var(--bg3)',
                        color: 'var(--text)', fontSize: 14.5, padding: '0 14px',
                        outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s',
                        boxSizing: 'border-box',
                      }}
                    />
                    {regErrors.phone && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{regErrors.phone}</div>}
                  </div>
                  <Field label="Şifre" type={regShowPass ? 'text' : 'password'} value={regPassword}
                    onChange={v => { setRegPassword(v); setRegErrors(p => ({ ...p, password: '' })) }}
                    placeholder="En az 8 karakter" error={regErrors.password}
                    extra={eyeBtn(regShowPass, () => setRegShowPass(!regShowPass))} />
                  <button type="submit" disabled={loading} style={btnStyle}>
                    {loading ? 'Kaydediliyor...' : 'Üye Ol'}
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--text2)' }}>
                  Zaten hesabın var mı? <a href="#" onClick={() => setTab('login')} style={{ color: 'var(--primary)', fontWeight: 700 }}>Giriş yap</a>
                </div>
              </div>
            )}

            {tab === 'register' && showRegVerify && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>E-posta Doğrulama 📧</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>
                    <strong>{pendingEmail}</strong> adresine gönderilen 6 haneli kodu girin
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: secondsLeft <= 20 ? '#dc2626' : 'var(--text3)' }}>
                    {secondsLeft > 0 ? <>⏱ Kodun geçerlilik süresi: <span>{fmtTime(secondsLeft)}</span></> : '⛔ Kodun süresi doldu'}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>Doğrulama Kodu</label>
                  <input
                    autoFocus
                    value={regVerifyCode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setRegVerifyCode(v)
                      setRegVerifyError('')
                      if (v.length === 6) handleRegVerify(v)
                    }}
                    placeholder="------" maxLength={6} disabled={secondsLeft === 0 || loading}
                    style={{ width: '100%', height: 54, border: `1.5px solid ${regVerifyError ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, background: regVerifyError ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 24, letterSpacing: 8, textAlign: 'center', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  {loading && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>Doğrulanıyor...</div>}
                  {regVerifyError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{regVerifyError}</div>}
                </div>
                {secondsLeft === 0 && (
                  <button onClick={handleResend} style={{ width: '100%', height: 44, background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>
                    🔄 Kodu Tekrar Gönder
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {['🔒 SSL Güvenli', '🛡️ Verileriniz Korumalı', '✅ Ücretsiz Üyelik'].map(b => (
                <div key={b} style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 500 }}>{b}</div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 20, color: 'var(--text3)' }}>
            <Link to="/" onClick={() => localStorage.setItem('pt-guest', 'true')} style={{ color: 'var(--primary)', fontWeight: 600 }}>Misafir olarak devam et →</Link>
          </div>
        </div>
      </main>

      <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '18px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          © 2025 {import.meta.env.VITE_BRAND_PART1}{import.meta.env.VITE_BRAND_PART2} &nbsp;·&nbsp;
          <a href="#" style={{ color: 'var(--primary)' }}>Gizlilik Politikası</a> &nbsp;·&nbsp;
          <a href="#" style={{ color: 'var(--primary)' }}>Kullanım Koşulları</a>
        </div>
      </footer>
    </div>
  )
}
