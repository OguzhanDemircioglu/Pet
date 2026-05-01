'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore'
import { clearCart, removeFromCart, updateQuantity } from '@/store/cartSlice'
import { closeCart, setCheckoutStep, type CheckoutStep } from '@/store/uiSlice'
import { imgUrl } from '@/lib/utils'
import { addressClientApi, orderClientApi, authClientApi } from '@/lib/api'
import { PHONE_RE } from '@/lib/constants'
import type { Address } from '@/types'
import PhoneInput from '@/components/common/PhoneInput'

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

type InvoiceForm = {
  invoiceType: 'INDIVIDUAL' | 'CORPORATE'
  invoiceIdentityNo: string
  invoiceTitle: string
  invoiceTaxOffice: string
  invoiceAddress: string
  invoiceCity: string
  invoiceDistrict: string
  sameAsShipping: boolean
}

const EMPTY_INVOICE: InvoiceForm = {
  invoiceType: 'INDIVIDUAL',
  invoiceIdentityNo: '',
  invoiceTitle: '',
  invoiceTaxOffice: '',
  invoiceAddress: '',
  invoiceCity: '',
  invoiceDistrict: '',
  sameAsShipping: true,
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

interface Props {
  isMobile: boolean
  onClose: () => void
}

export default function CheckoutDrawer({ isMobile, onClose }: Props) {
  const dispatch = useAppDispatch()
  const { data: session, update: updateSession } = useSession()
  const user = session?.user ?? null
  const cartItems = useAppSelector(s => s.cart.items)
  const checkoutStep = useAppSelector(s => s.ui.checkoutStep)

  const [addressForm, setAddressForm] = useState<AddressForm>({ ...EMPTY_ADDRESS })
  const [addrSubmitted, setAddrSubmitted] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>({ ...EMPTY_INVOICE })
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CREDIT_CARD'>('COD')

  const cartRef = useRef<HTMLDivElement>(null)

  const cartTotal = cartItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    dispatch(setCheckoutStep('cart'))
    setAddrSubmitted(false)
    setLoginEmail('')
    setLoginPassword('')
    setPhoneVal('')
    setPhoneError('')
    setSavedAddresses([])
    setSelectedSavedId(null)
    setShowManualForm(false)
    setPaymentMethod('COD')
  }, [dispatch])

  // Address step'ine geçildiğinde kayıtlı adresleri TEK BİR KEZ yükle.
  // Bağımlılık `user` objesi değil id; useSession refresh'lerinde yeni reference loop tetikler.
  const userId = user?.id
  const userFirstName = user?.firstName
  const userLastName = user?.lastName
  const userPhoneSafe = user?.phone
  useEffect(() => {
    if (checkoutStep !== 'address' || !userId) return
    setAddressForm(prev => ({
      ...prev,
      fullName: prev.fullName || `${userFirstName ?? ''} ${userLastName ?? ''}`.trim(),
      phone: prev.phone || (userPhoneSafe ?? ''),
    }))
    addressClientApi.list().then(list => {
      setSavedAddresses(list)
      const def = list.find((a: Address) => a.isDefault) ?? list[0]
      if (def) { setSelectedSavedId(def.id); setShowManualForm(false) }
      else setShowManualForm(true)
    }).catch(() => setShowManualForm(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutStep, userId])

  const handleAddressNext = async () => {
    if (selectedSavedId !== null && !showManualForm) {
      const saved = savedAddresses.find(a => a.id === selectedSavedId)
      if (saved) {
        setAddressForm({ fullName: saved.fullName, phone: saved.phone, city: saved.city, district: saved.district, address: saved.addressLine })
      }
      dispatch(setCheckoutStep('invoice'))
      return
    }
    setAddrSubmitted(true)
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.city || !addressForm.district.trim() || !addressForm.address.trim()) {
      toast.error('Tüm alanları doldurun')
      return
    }
    if (user && !user.phone && addressForm.phone.trim()) {
      try { await authClientApi.updatePhone(addressForm.phone.trim()) } catch { /* non-blocking */ }
    }
    dispatch(setCheckoutStep('invoice'))
  }

  const handleInvoiceSubmit = () => {
    setInvoiceSubmitted(true)
    const f = invoiceForm
    if (f.invoiceType === 'INDIVIDUAL') {
      if (!f.invoiceIdentityNo || f.invoiceIdentityNo.length !== 11) { toast.error('11 haneli TCKN girin'); return }
    } else {
      if (!f.invoiceIdentityNo || f.invoiceIdentityNo.length !== 10) { toast.error('10 haneli VKN girin'); return }
      if (!f.invoiceTitle.trim()) { toast.error('Firma ünvanı zorunlu'); return }
      if (!f.invoiceTaxOffice.trim()) { toast.error('Vergi dairesi zorunlu'); return }
    }
    if (!f.sameAsShipping && (!f.invoiceAddress.trim() || !f.invoiceCity.trim() || !f.invoiceDistrict.trim())) {
      toast.error('Fatura adresi eksik'); return
    }
    dispatch(setCheckoutStep('confirm'))
  }

  const buildInvoicePayload = () => {
    const f = invoiceForm
    const same = f.sameAsShipping
    return {
      invoiceType: f.invoiceType,
      invoiceIdentityNo: f.invoiceIdentityNo,
      invoiceTitle: f.invoiceType === 'CORPORATE' ? f.invoiceTitle : undefined,
      invoiceTaxOffice: f.invoiceType === 'CORPORATE' ? f.invoiceTaxOffice : undefined,
      invoiceAddress: same ? addressForm.address : f.invoiceAddress,
      invoiceCity: same ? addressForm.city : f.invoiceCity,
      invoiceDistrict: same ? addressForm.district : f.invoiceDistrict,
    } as const
  }

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) { toast.error('E-posta ve şifre girin'); return }
    setLoginLoading(true)
    try {
      const res = await signIn('credentials', { email: loginEmail, password: loginPassword, redirect: false })
      if (res?.error) throw new Error('E-posta veya şifre hatalı')
      toast.success('Giriş başarılı')
      // Session güncellenmesi için kısa bekle
      setTimeout(() => dispatch(setCheckoutStep('address')), 500)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'E-posta veya şifre hatalı')
    } finally {
      setLoginLoading(false)
    }
  }

  const handlePhoneSubmit = async () => {
    if (!PHONE_RE.test(phoneVal)) { setPhoneError('05XX XXX XX XX formatında girin'); return }
    const val = phoneVal.replace(/\s/g, '')
    setPhoneSaving(true)
    try {
      await authClientApi.updatePhone(val)
      await updateSession()
      dispatch(setCheckoutStep('address'))
    } catch {
      setPhoneError('Telefon kaydedilemedi, tekrar deneyin')
    } finally {
      setPhoneSaving(false)
    }
  }

  const handleConfirmOrder = async () => {
    setOrderLoading(true)
    try {
      await orderClientApi.create({
        fullName: addressForm.fullName, phone: addressForm.phone, city: addressForm.city,
        district: addressForm.district, address: addressForm.address,
        totalAmount: cartTotal,
        items: cartItems.map(i => ({ productId: i.productId, variantId: i.variantId ?? null, productName: i.name, quantity: i.quantity, unitPrice: i.basePrice })),
        ...buildInvoicePayload(),
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

  const handleCreditCardOrder = async () => {
    setOrderLoading(true)
    try {
      const res = await orderClientApi.initiatePayment({
        fullName: addressForm.fullName, phone: addressForm.phone, city: addressForm.city,
        district: addressForm.district, address: addressForm.address,
        totalAmount: cartTotal,
        items: cartItems.map(i => ({ productId: i.productId, variantId: i.variantId ?? null, productName: i.name, quantity: i.quantity, unitPrice: i.basePrice })),
        ...buildInvoicePayload(),
      })
      // ÖNEMLI: Sepeti BURADA TEMİZLEME. Kullanıcı iyzico'da ödeme
      // yapmazsa veya iptal ederse sepetin korunması gerekir.
      // Sepet temizleme /odeme-sonuc sayfasında ödeme başarılıysa yapılır
      // (PaymentResultClient içinde clearCart dispatch ediliyor).
      dispatch(closeCart())
      window.location.href = res.paymentPageUrl
    } catch {
      toast.error('Ödeme başlatılamadı, lütfen tekrar deneyin.')
    } finally {
      setOrderLoading(false)
    }
  }

  const addrField = (key: keyof AddressForm) => addrSubmitted && !addressForm[key].trim()

  const drawerTitle: Record<CheckoutStep, string> = {
    cart: '🛒 Sepetim', login: '🔐 Giriş Yapın', phone: '📱 Telefon Numaranız',
    address: '📍 Teslimat Adresi', invoice: '🧾 Fatura Bilgileri', confirm: '✅ Sipariş Onayı',
  }

  const goBack = () => {
    if (checkoutStep === 'confirm') dispatch(setCheckoutStep('invoice'))
    else if (checkoutStep === 'invoice') dispatch(setCheckoutStep('address'))
    else if (checkoutStep === 'phone') dispatch(setCheckoutStep('login'))
    else dispatch(setCheckoutStep('cart'))
  }

  return (
    <div ref={cartRef} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 440, maxWidth: '100vw', background: 'var(--bg2)', borderLeft: '1px solid var(--border)', boxShadow: '-8px 0 40px rgba(0,0,0,.18)', zIndex: 800, display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.22s ease' }}>

      {/* Drawer Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {checkoutStep !== 'login' && checkoutStep !== 'phone' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {(['cart', 'address', 'invoice', 'confirm'] as CheckoutStep[]).map((s, i) => {
              const steps = ['cart', 'address', 'invoice', 'confirm']
              const curIdx = steps.indexOf(checkoutStep)
              const done = curIdx > i
              const active = checkoutStep === s
              const label = s === 'cart' ? 'Sepet' : s === 'address' ? 'Adres' : s === 'invoice' ? 'Fatura' : 'Onay'
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: active ? 'var(--primary)' : done ? '#16a34a' : 'var(--bg3)', color: active || done ? '#fff' : 'var(--text3)', transition: '0.2s' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)', whiteSpace: 'nowrap' }}>{label}</span>
                  {i < 3 && <div style={{ width: 12, height: 1, background: 'var(--border)', flexShrink: 0 }} />}
                </div>
              )
            })}
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        )}
        {(checkoutStep === 'login' || checkoutStep === 'phone') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{drawerTitle[checkoutStep]}</h3>
          {checkoutStep !== 'cart' && (
            <button onClick={goBack} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>← Geri</button>
          )}
        </div>
      </div>

      {/* Step: Cart */}
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
              <div key={`${item.productId}-${item.variantId ?? 0}`} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {item.primaryImageUrl ? <Image src={imgUrl(item.primaryImageUrl) ?? ''} alt={item.name} width={60} height={60} sizes="60px" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 2 }}>{item.brandName}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: item.variantLabel ? 4 : 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{item.name}</div>
                  {item.variantLabel && <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 700, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', color: 'var(--text2)' }}>⚖️ {item.variantLabel}</span></div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                      <button onClick={() => dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, quantity: item.quantity - 1 }))} style={{ width: 28, height: 28, border: 'none', background: 'var(--bg3)', color: 'var(--text)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ minWidth: 32, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.quantity}</span>
                      <button onClick={() => {
                        if (item.quantity >= item.availableStock) { toast.error('Stokta yeterli ürün yok'); return }
                        dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, quantity: item.quantity + 1 }))
                      }} style={{ width: 28, height: 28, border: 'none', background: 'var(--bg3)', color: 'var(--text)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>₺{(item.basePrice * item.quantity).toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>₺{item.basePrice.toFixed(2)} / {item.variantLabel ?? item.unit}</div>
                </div>
                <button onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                  style={{ alignSelf: 'flex-start', height: 44, width: 38, flexShrink: 0, background: 'rgba(220,38,38,.10)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {cartItems.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: 'var(--text2)' }}><span>{cartCount} ürün</span><span>₺{cartTotal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 16, fontWeight: 800 }}><span>Toplam</span><span style={{ color: 'var(--primary)' }}>₺{cartTotal.toFixed(2)}</span></div>
              <button onClick={() => dispatch(setCheckoutStep(!user ? 'login' : (!user.phone ? 'phone' : 'address')))}
                style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                Siparişi Tamamla →
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>KDV dahil · Kargo sipariş onayında hesaplanır</div>
            </div>
          )}
        </>
      )}

      {/* Step: Login */}
      {checkoutStep === 'login' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Siparişi tamamlamak için giriş yapın</div>
          </div>
          <button onClick={() => signIn('google')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {GOOGLE_SVG} Google ile Devam Et
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>veya e-posta ile</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="E-posta adresi" onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
              style={{ width: '100%', height: 42, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Şifre" onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
              style={{ width: '100%', height: 42, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <button onClick={handleLoginSubmit} disabled={loginLoading}
              style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '12px 0', fontSize: 14, fontWeight: 800, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}>
              {loginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>Hesabınız yok mu? </span>
            <Link href="/giris" onClick={onClose} style={{ color: 'var(--primary)', fontWeight: 700 }}>Kayıt olun</Link>
          </div>
        </div>
      )}

      {/* Step: Phone */}
      {checkoutStep === 'phone' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Telefon numaranızı girin</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Sipariş bildirimleriniz için gereklidir</div>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Telefon Numarası *</label>
          <PhoneInput value={phoneVal} onChange={v => { setPhoneVal(v); setPhoneError('') }} onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()} autoFocus
            style={{ width: '100%', height: 46, border: `1.5px solid ${phoneError ? '#dc2626' : 'var(--border)'}`, borderRadius: 'var(--r)', background: phoneError ? '#fef2f2' : 'var(--bg3)', color: 'var(--text)', fontSize: 15, padding: '0 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          {phoneError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>{phoneError}</div>}
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Format: 05XX XXX XX XX</div>
          <button onClick={handlePhoneSubmit} disabled={phoneSaving}
            style={{ width: '100%', marginTop: 20, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: phoneSaving ? 'not-allowed' : 'pointer', opacity: phoneSaving ? 0.7 : 1 }}>
            {phoneSaving ? 'Kaydediliyor...' : 'Devam Et →'}
          </button>
        </div>
      )}

      {/* Step: Address */}
      {checkoutStep === 'address' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {savedAddresses.length > 0 && !showManualForm && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>KAYITLI ADRESLER</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedAddresses.map(addr => (
                      <div key={addr.id} onClick={() => setSelectedSavedId(addr.id)}
                        style={{ padding: '12px 14px', border: `2px solid ${selectedSavedId === addr.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: selectedSavedId === addr.id ? 'var(--primary-bg)' : 'var(--bg3)', cursor: 'pointer', transition: '0.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{addr.title}</span>
                          {addr.isDefault && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'rgba(220,38,38,.1)', padding: '2px 8px', borderRadius: 10 }}>Varsayılan</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{addr.fullName} · {addr.phone}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{addr.city} / {addr.district} · {addr.addressLine}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setShowManualForm(true); setSelectedSavedId(null) }}
                    style={{ marginTop: 10, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    + Farklı bir adres kullan
                  </button>
                </div>
              )}
              {(showManualForm || savedAddresses.length === 0) && (
                <>
                  {savedAddresses.length > 0 && (
                    <button onClick={() => { setShowManualForm(false); const def = savedAddresses.find(a => a.isDefault) ?? savedAddresses[0]; if (def) setSelectedSavedId(def.id) }}
                      style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textAlign: 'left' }}>
                      ← Kayıtlı adreslerime dön
                    </button>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Ad Soyad *</label>
                    <input value={addressForm.fullName} onChange={e => setAddressForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Ad Soyad"
                      style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('fullName') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Telefon *</label>
                    <PhoneInput value={addressForm.phone} onChange={v => setAddressForm(p => ({ ...p, phone: v }))}
                      style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('phone') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İl *</label>
                    <select value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value, district: '' }))}
                      style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('city') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                      <option value="">Seçin</option>
                      {TR_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İlçe *</label>
                    <input value={addressForm.district} onChange={e => setAddressForm(p => ({ ...p, district: e.target.value }))} placeholder="İlçe"
                      style={{ width: '100%', height: 40, border: `1.5px solid ${addrField('district') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Adres *</label>
                    <textarea value={addressForm.address} onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))} placeholder="Mahalle, sokak, bina no, daire..."
                      style={{ width: '100%', minHeight: 80, border: `1.5px solid ${addrField('address') ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
            <button onClick={handleAddressNext} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '12px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
              Devam Et →
            </button>
          </div>
        </>
      )}

      {/* Step: Invoice */}
      {checkoutStep === 'invoice' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['INDIVIDUAL', 'CORPORATE'] as const).map(t => (
                <button key={t} onClick={() => setInvoiceForm(p => ({ ...p, invoiceType: t }))}
                  style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, border: `2px solid ${invoiceForm.invoiceType === t ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: invoiceForm.invoiceType === t ? 'var(--primary-bg)' : 'var(--bg3)', color: invoiceForm.invoiceType === t ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer' }}>
                  {t === 'INDIVIDUAL' ? '👤 Bireysel' : '🏢 Kurumsal'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>
                  {invoiceForm.invoiceType === 'INDIVIDUAL' ? 'T.C. Kimlik No *' : 'Vergi Kimlik No *'}
                </label>
                <input value={invoiceForm.invoiceIdentityNo}
                  onChange={e => setInvoiceForm(p => ({ ...p, invoiceIdentityNo: e.target.value.replace(/\D/g, '') }))}
                  maxLength={invoiceForm.invoiceType === 'INDIVIDUAL' ? 11 : 10} placeholder={invoiceForm.invoiceType === 'INDIVIDUAL' ? '11 haneli TCKN' : '10 haneli VKN'}
                  style={{ width: '100%', height: 40, border: `1.5px solid ${invoiceSubmitted && (!invoiceForm.invoiceIdentityNo || invoiceForm.invoiceIdentityNo.length < 10) ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              {invoiceForm.invoiceType === 'CORPORATE' && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Firma Ünvanı *</label>
                    <input value={invoiceForm.invoiceTitle} onChange={e => setInvoiceForm(p => ({ ...p, invoiceTitle: e.target.value }))} placeholder="Firma Ünvanı"
                      style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Vergi Dairesi *</label>
                    <input value={invoiceForm.invoiceTaxOffice} onChange={e => setInvoiceForm(p => ({ ...p, invoiceTaxOffice: e.target.value }))} placeholder="Vergi Dairesi"
                      style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={invoiceForm.sameAsShipping} onChange={e => setInvoiceForm(p => ({ ...p, sameAsShipping: e.target.checked }))} />
                Teslimat adresiyle aynı
              </label>
              {!invoiceForm.sameAsShipping && (
                <>
                  <input value={invoiceForm.invoiceAddress} onChange={e => setInvoiceForm(p => ({ ...p, invoiceAddress: e.target.value }))} placeholder="Fatura Adresi"
                    style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={invoiceForm.invoiceCity} onChange={e => setInvoiceForm(p => ({ ...p, invoiceCity: e.target.value }))} placeholder="İl"
                      style={{ flex: 1, height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <input value={invoiceForm.invoiceDistrict} onChange={e => setInvoiceForm(p => ({ ...p, invoiceDistrict: e.target.value }))} placeholder="İlçe"
                      style={{ flex: 1, height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
            <button onClick={handleInvoiceSubmit} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '12px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
              Devam Et →
            </button>
          </div>
        </>
      )}

      {/* Step: Confirm */}
      {checkoutStep === 'confirm' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>TESLİMAT ADRESİ</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{addressForm.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{addressForm.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{addressForm.city} / {addressForm.district}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{addressForm.address}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>ÜRÜNLER</div>
              {cartItems.map(item => (
                <div key={`${item.productId}-${item.variantId ?? 0}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text)' }}>{item.name} {item.variantLabel ? `(${item.variantLabel})` : ''} × {item.quantity}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₺{(item.basePrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 15, fontWeight: 800 }}>
                <span>Toplam</span>
                <span style={{ color: 'var(--primary)' }}>₺{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>ÖDEME YÖNTEMİ</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['COD', 'CREDIT_CARD'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    style={{ flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 700, border: `2px solid ${paymentMethod === m ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: paymentMethod === m ? 'var(--primary-bg)' : 'var(--bg3)', color: paymentMethod === m ? 'var(--primary)' : 'var(--text2)', cursor: 'pointer' }}>
                    {m === 'COD' ? '💵 Kapıda Ödeme' : '💳 Kredi Kartı'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
            <button onClick={paymentMethod === 'COD' ? handleConfirmOrder : handleCreditCardOrder} disabled={orderLoading}
              style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.7 : 1 }}>
              {orderLoading ? 'İşleniyor...' : paymentMethod === 'COD' ? '✓ Siparişi Onayla' : '💳 Ödemeye Geç →'}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  )
}
