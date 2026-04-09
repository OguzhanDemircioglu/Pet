import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useSelector, useDispatch } from 'react-redux'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import type { RootState, AppDispatch } from '../store'
import { toggleCart, closeCart, removeFromCart, updateQuantity, clearCart } from '../store/cartSlice'
import { orderApi } from '../api/orderApi'
import { markReadThunk, markAllReadThunk } from '../store/notificationSlice'
import { setUser, updateUserPhone } from '../store/authSlice'
import { imgUrl } from '../api/productApi'
import { authApi } from '../api/authApi'
import { TURKEY_DISTRICTS } from '../data/turkeyDistricts'

type CheckoutStep = 'cart' | 'login' | 'phone' | 'address' | 'confirm'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const PHONE_RE = /^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

function GoogleCheckoutBtn({ onSuccess }: { onSuccess: (phoneExists: boolean) => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await authApi.googleAuth(tokenResponse.access_token)
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        dispatch(setUser(data.user))
        toast.success('Google ile giriş başarılı')
        onSuccess(!!data.user.phone)
      } catch {
        toast.error('Google ile giriş başarısız')
      }
    },
    onError: () => toast.error('Google ile giriş başarısız'),
  })
  return (
    <button onClick={() => login()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: '0.18s' }}>
      {GOOGLE_SVG} Google ile Devam Et
    </button>
  )
}

function GoogleCheckoutBtnSafe({ onSuccess }: { onSuccess: (phoneExists: boolean) => void }) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontWeight: 600, opacity: 0.45, cursor: 'not-allowed' }}>
        {GOOGLE_SVG} Google ile Devam Et
      </button>
    )
  }
  return <GoogleCheckoutBtn onSuccess={onSuccess} />
}

interface AddressForm {
  fullName: string
  phone: string
  city: string
  district: string
  address: string
}

const EMPTY_ADDRESS: AddressForm = { fullName: '', phone: '', city: '', district: '', address: '' }

const TR_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir',
  'Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli',
  'Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane',
  'Hakkari','Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli',
  'Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat',
  'Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman',
  'Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
]

interface HeaderProps {
  showSearch?: boolean
}

export default function Header({ showSearch = true }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const cartItems = useSelector((s: RootState) => s.cart.items)
  const cartOpen = useSelector((s: RootState) => s.cart.isOpen)
  const notifications = useSelector((s: RootState) => s.notifications.items)
  const unreadCount = notifications.filter(n => !n.isRead).length

  const [searchVal, setSearchVal] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [addressForm, setAddressForm] = useState<AddressForm>({ ...EMPTY_ADDRESS })
  const [addrSubmitted, setAddrSubmitted] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)

  const cartTotal = cartItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Drawer dışına tıklayınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        dispatch(closeCart())
        setCheckoutStep('cart')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dispatch])

  // Sepet kapanınca adımı sıfırla
  useEffect(() => {
    if (!cartOpen) { setCheckoutStep('cart'); setAddrSubmitted(false); setLoginEmail(''); setLoginPassword(''); setPhoneVal(''); setPhoneError('') }
  }, [cartOpen])

  // Adres adımına geçince kullanıcı bilgilerini pre-fill et
  useEffect(() => {
    if (checkoutStep === 'address' && user) {
      setAddressForm(prev => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName} ${user.lastName}`.trim(),
        phone: prev.phone || (user.phone ?? ''),
      }))
    }
  }, [checkoutStep, user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) navigate(`/urunler?q=${encodeURIComponent(searchVal.trim())}`)
  }

  const handleAddressNext = async () => {
    setAddrSubmitted(true)
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.city || !addressForm.district.trim() || !addressForm.address.trim()) {
      toast.error('Tüm alanları doldurun')
      return
    }
    if (user && !user.phone && addressForm.phone.trim()) {
      try {
        await authApi.updatePhone(addressForm.phone.trim())
        dispatch(updateUserPhone(addressForm.phone.trim()))
      } catch {
        // non-blocking
      }
    }
    setCheckoutStep('confirm')
  }

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error('E-posta ve şifre girin')
      return
    }
    setLoginLoading(true)
    try {
      const data = await authApi.login(loginEmail, loginPassword)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      dispatch(setUser(data.user))
      toast.success('Giriş başarılı')
      setCheckoutStep(data.user.phone ? 'address' : 'phone')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'E-posta veya şifre hatalı')
    } finally {
      setLoginLoading(false)
    }
  }

  const handlePhoneSubmit = async () => {
    const val = phoneVal.trim()
    if (!PHONE_RE.test(val)) {
      setPhoneError('05XX XXX XX XX formatında girin')
      return
    }
    setPhoneSaving(true)
    try {
      await authApi.updatePhone(val)
      dispatch(updateUserPhone(val))
      setCheckoutStep('address')
    } catch {
      setPhoneError('Telefon kaydedilemedi, tekrar deneyin')
    } finally {
      setPhoneSaving(false)
    }
  }

  const [orderLoading, setOrderLoading] = useState(false)

  const handleConfirmOrder = async () => {
    setOrderLoading(true)
    try {
      await orderApi.create({
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        city: addressForm.city,
        district: addressForm.district,
        address: addressForm.address,
        totalAmount: cartTotal,
        items: cartItems.map(i => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.basePrice,
        })),
      })
      dispatch(clearCart())
      dispatch(closeCart())
      toast.success('Siparişiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.')
    } catch {
      toast.error('Sipariş oluşturulamadı, lütfen tekrar deneyin.')
    } finally {
      setOrderLoading(false)
    }
  }

  const addrField = (key: keyof AddressForm) => addrSubmitted && !addressForm[key].trim()

  const isDark = theme === 'dark'

  const drawerTitle: Record<CheckoutStep, string> = {
    cart: '🛒 Sepetim',
    login: '🔐 Giriş Yapın',
    phone: '📱 Telefon Numaranız',
    address: '📍 Teslimat Adresi',
    confirm: '✅ Sipariş Onayı',
  }

  return (
    <header style={{ background: isDark ? '#1a2333' : 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Logo + Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo.svg" alt="Patilya" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--primary)' }}>{import.meta.env.VITE_BRAND_PART1}</span>
              <span style={{ color: 'var(--accent)' }}>{import.meta.env.VITE_BRAND_PART2}</span>
            </div>
          </Link>
          <button onClick={toggleTheme} title="Tema değiştir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', marginLeft: 4, fontSize: 24, lineHeight: 1 }}>
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 0, position: 'relative', margin: '0 16px' }}>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Ürün, kategori veya marka ara..." autoComplete="off"
              style={{ width: '100%', height: 42, border: '2px solid var(--border)', borderRadius: 'var(--r)', background: isDark ? '#1f2937' : 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 48px 0 16px', outline: 'none', transition: '0.2s', fontFamily: 'inherit' }} />
            <button type="submit" style={{ position: 'absolute', right: 0, top: 0, width: 44, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', borderRadius: '0 var(--r) var(--r) 0', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
          </form>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: showSearch ? 8 : 'auto' }}>

          {/* Notifications */}
          {user && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setNotifOpen(o => !o) }}
                style={{ position: 'relative', background: 'none', height: 42, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 20, padding: '0 10px', border: 'none', cursor: 'pointer' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', background: 'var(--primary)', color: '#fff' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 320, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow-lg)', zIndex: 600, overflow: 'hidden', animation: 'dropIn 0.18s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px 9px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Bildirimler {unreadCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>({unreadCount})</span>}</span>
                    {unreadCount > 0 && (
                      <span onClick={() => dispatch(markAllReadThunk())} style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }}>Tümünü okundu işaretle</span>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Bildirim yok</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} onClick={() => { if (!n.isRead) dispatch(markReadThunk(n.id)) }}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 15px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : 'rgba(220,38,38,.04)', cursor: n.isRead ? 'default' : 'pointer' }}>
                        <span style={{ fontSize: 18, width: 34, height: 34, background: 'var(--bg3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.type === 'ORDER' ? '📦' : '🔔'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, marginBottom: 2, fontWeight: n.isRead ? 400 : 600 }}>{n.message}</p>
                          <small style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                        {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    ))}
                  </div>
                  {notifications.length > 10 && (
                    <div style={{ padding: '9px 15px', textAlign: 'center', fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
                      <Link to="/profil" onClick={() => setNotifOpen(false)} style={{ color: 'var(--primary)', fontWeight: 600 }}>Tümünü profilde gör</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Login / Profile */}
          {user ? (
            <Link to="/profil" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--primary)', padding: '0 10px', height: 42, borderRadius: 'var(--r)', transition: '0.2s' }}>👤 <span>{user.firstName}</span></Link>
          ) : (
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text2)', padding: '0 10px', height: 42, borderRadius: 'var(--r)', transition: '0.2s' }}>👤 <span>Üye Girişi</span></Link>
          )}

          {/* Cart Button */}
          <div ref={cartRef} style={{ position: 'relative' }}>
            <button onClick={() => dispatch(toggleCart())}
              style={{ position: 'relative', background: cartOpen ? 'var(--primary)' : 'none', height: 42, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cartOpen ? '#fff' : 'var(--text)', padding: '0 12px', gap: 6, border: '2px solid var(--border)', cursor: 'pointer', transition: '0.2s' }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>₺{cartTotal.toFixed(2)}</span>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{cartCount}</span>
              )}
            </button>

            {/* ── Checkout Drawer ── */}
            {cartOpen && (
              <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 40px rgba(0,0,0,.18)', zIndex: 800, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.22s ease' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  {/* Step indicator (login ve phone adımlarında gizle) */}
                  {checkoutStep !== 'login' && checkoutStep !== 'phone' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      {(['cart', 'address', 'confirm'] as CheckoutStep[]).map((s, i) => {
                        const steps = ['cart', 'address', 'confirm']
                        const curIdx = steps.indexOf(checkoutStep)
                        const done = curIdx > i
                        const active = checkoutStep === s
                        return (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: active ? 'var(--primary)' : done ? '#16a34a' : 'var(--bg3)', color: active || done ? '#fff' : 'var(--text3)', transition: '0.2s' }}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                              {s === 'cart' ? 'Sepet' : s === 'address' ? 'Adres' : 'Onay'}
                            </span>
                            {i < 2 && <div style={{ width: 20, height: 1, background: 'var(--border)', flexShrink: 0 }} />}
                          </div>
                        )
                      })}
                      <div style={{ flex: 1 }} />
                      <button onClick={() => { dispatch(closeCart()) }} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  )}
                  {(checkoutStep === 'login' || checkoutStep === 'phone') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <button onClick={() => { dispatch(closeCart()) }} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{drawerTitle[checkoutStep]}</h3>
                    {checkoutStep !== 'cart' && (
                      <button onClick={() => {
                        if (checkoutStep === 'confirm') setCheckoutStep('address')
                        else if (checkoutStep === 'phone') setCheckoutStep('login')
                        else setCheckoutStep('cart')
                      }} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>← Geri</button>
                    )}
                  </div>
                </div>

                {/* ── Step: Cart ── */}
                {checkoutStep === 'cart' && (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: cartItems.length ? 0 : '60px 20px' }}>
                      {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                          <div style={{ fontSize: 52, marginBottom: 12 }}>🛒</div>
                          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Sepetiniz boş</div>
                          <div style={{ fontSize: 13 }}>Ürün eklemek için alışverişe başlayın</div>
                        </div>
                      ) : cartItems.map(item => (
                        <div key={item.productId} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                          <div style={{ width: 60, height: 60, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                            {item.primaryImageUrl ? <img src={imgUrl(item.primaryImageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 2 }}>{item.brandName}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{item.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - item.moq }))} style={{ width: 28, height: 28, border: 'none', background: 'var(--bg3)', color: 'var(--text)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ minWidth: 32, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + item.moq }))} style={{ width: 28, height: 28, border: 'none', background: 'var(--bg3)', color: 'var(--text)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              </div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>₺{(item.basePrice * item.quantity).toFixed(2)}</div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>₺{item.basePrice.toFixed(2)} / {item.unit} · Min. {item.moq} {item.unit}</div>
                          </div>
                          <button onClick={() => dispatch(removeFromCart(item.productId))} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: 2, flexShrink: 0, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                    {cartItems.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: 'var(--text2)' }}><span>{cartCount} ürün</span><span>₺{cartTotal.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 16, fontWeight: 800 }}><span>Toplam</span><span style={{ color: 'var(--primary)' }}>₺{cartTotal.toFixed(2)}</span></div>
                        <button onClick={() => setCheckoutStep(user ? 'address' : 'login')}
                          style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                          Siparişi Tamamla →
                        </button>
                        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>KDV dahil · Kargo sipariş onayında hesaplanır</div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Step: Login ── */}
                {checkoutStep === 'login' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                        Siparişi tamamlamak için giriş yapın
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        Hesabınızla devam edin
                      </div>
                    </div>

                    <GoogleCheckoutBtnSafe onSuccess={(phoneExists) => setCheckoutStep(phoneExists ? 'address' : 'phone')} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>veya e-posta ile</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="E-posta adresi"
                        onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                        style={{ width: '100%', height: 42, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Şifre"
                        onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                        style={{ width: '100%', height: 42, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={handleLoginSubmit}
                        disabled={loginLoading}
                        style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '12px 0', fontSize: 14, fontWeight: 800, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}>
                        {loginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
                      </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>Hesabınız yok mu? </span>
                      <Link to="/login" onClick={() => dispatch(closeCart())} style={{ color: 'var(--primary)', fontWeight: 700 }}>Kayıt olun</Link>
                    </div>
                  </div>
                )}

                {/* ── Step: Phone ── */}
                {checkoutStep === 'phone' && (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                      <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                        Telefon numaranızı girin
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        Sipariş bildirimleriniz için gereklidir
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Telefon Numarası *</label>
                      <input
                        type="tel"
                        value={phoneVal}
                        onChange={e => { setPhoneVal(e.target.value); setPhoneError('') }}
                        placeholder="05xx xxx xx xx"
                        onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                        autoFocus
                        style={{ width: '100%', height: 46, border: `1.5px solid ${phoneError ? '#dc2626' : 'var(--border)'}`, borderRadius: 'var(--r)', background: phoneError ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 15, padding: '0 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: '0.15s' }}
                      />
                      {phoneError && (
                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>{phoneError}</div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Format: 05XX XXX XX XX</div>
                    </div>
                    <button
                      onClick={handlePhoneSubmit}
                      disabled={phoneSaving}
                      style={{ width: '100%', marginTop: 20, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: phoneSaving ? 'not-allowed' : 'pointer', opacity: phoneSaving ? 0.7 : 1 }}>
                      {phoneSaving ? 'Kaydediliyor...' : 'Devam Et →'}
                    </button>
                  </div>
                )}

                {/* ── Step: Address ── */}
                {checkoutStep === 'address' && (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Ad Soyad */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Ad Soyad *</label>
                          <input value={addressForm.fullName} onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))}
                            placeholder="Ad Soyad"
                            style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('fullName') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        {/* Telefon */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Telefon *</label>
                          <input value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                            placeholder="05xx xxx xx xx" type="tel"
                            style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('phone') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        {/* İl + İlçe */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İl *</label>
                            <select value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value, district: '' }))}
                              style={{ width: '100%', height: 40, border: `1.5px solid ${addrSubmitted && !addressForm.city ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: addressForm.city ? 'var(--text)' : 'var(--text3)', fontSize: 13, padding: '0 10px', outline: 'none', fontFamily: 'inherit' }}>
                              <option value="">Seçiniz</option>
                              {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İlçe *</label>
                            <select value={addressForm.district} onChange={e => setAddressForm(p => ({ ...p, district: e.target.value }))}
                              disabled={!addressForm.city}
                              style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('district') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: addressForm.district ? 'var(--text)' : 'var(--text3)', fontSize: 13, padding: '0 10px', outline: 'none', fontFamily: 'inherit', opacity: !addressForm.city ? 0.5 : 1, cursor: !addressForm.city ? 'not-allowed' : 'pointer' }}>
                              <option value="">{addressForm.city ? 'Seçiniz' : 'Önce il seçin'}</option>
                              {(TURKEY_DISTRICTS[addressForm.city] ?? []).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* Tam Adres */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Tam Adres *</label>
                          <textarea value={addressForm.address} onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))}
                            placeholder="Mahalle, sokak, bina no, daire..." rows={3}
                            style={{ width: '100%', border: `1.5px solid ${addrField('address') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
                        </div>
                        {/* Order summary */}
                        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px 14px', marginTop: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>SİPARİŞ ÖZETİ</div>
                          {cartItems.map(item => (
                            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.name} ×{item.quantity}</span>
                              <span style={{ fontWeight: 700, flexShrink: 0 }}>₺{(item.basePrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                            <span>Toplam</span><span style={{ color: 'var(--primary)' }}>₺{cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', flexShrink: 0 }}>
                      <button onClick={handleAddressNext}
                        style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                        Devam Et →
                      </button>
                    </div>
                  </>
                )}

                {/* ── Step: Confirm ── */}
                {checkoutStep === 'confirm' && (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                      {/* Ödeme bilgisi */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 'var(--r2)', marginBottom: 18 }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>💵</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e', marginBottom: 3 }}>Ödeme Teslimatta Yapılacaktır</div>
                          <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>Siparişiniz kapıda nakit veya kart ile teslim alındığında ödenecektir.</div>
                        </div>
                      </div>

                      {/* Teslimat adresi özeti */}
                      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Teslimat Adresi</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>📍 {addressForm.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>{addressForm.city} / {addressForm.district}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{addressForm.address}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>📞 {addressForm.phone}</div>
                      </div>

                      {/* Sipariş özeti */}
                      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Sipariş Özeti</div>
                        {cartItems.map(item => (
                          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.name} ×{item.quantity}</span>
                            <span style={{ fontWeight: 700, flexShrink: 0 }}>₺{(item.basePrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                          <span>Ödenecek Tutar</span>
                          <span style={{ color: 'var(--primary)' }}>₺{cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', flexShrink: 0 }}>
                      <button onClick={handleConfirmOrder} disabled={orderLoading}
                        style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.7 : 1 }}>
                        {orderLoading ? 'Sipariş oluşturuluyor...' : 'Siparişi Onayla ✓'}
                      </button>
                      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Siparişiniz alındığında sizi arayacağız</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
      `}</style>
    </header>
  )
}
