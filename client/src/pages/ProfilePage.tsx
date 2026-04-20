import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import type { RootState, AppDispatch } from '../store'
import { logout, updateUserProfile } from '../store/authSlice'
import { resetCatalog, fetchCatalogThunk } from '../store/productSlice'
import { fetchBrandsThunk, resetBrands } from '../store/brandSlice'
import { fetchAdminCampaignsThunk, resetAdminCampaigns } from '../store/adminCampaignSlice'
import { resetCampaigns, FREE_SHIPPING_TITLE } from '../store/campaignSlice'
import { productApi, brandApi, categoryApi, userApi, productImageApi, imgUrl, type ProductForm } from '../api/productApi'
import { campaignApi, discountApi, type CampaignResponse, type CampaignRequest, type DiscountResponse } from '../api/campaignApi'
import { fetchOrdersThunk } from '../store/orderSlice'
import { adminOrderApi, type OrderResponse as AdminOrderResponse } from '../api/orderApi'
import { markAllReadThunk, markReadThunk } from '../store/notificationSlice'
import { fetchCategoriesThunk } from '../store/categorySlice'
import type { CatalogProduct, ProductImage as ProductImageType, Brand, Category, AdminUser, Address, AddressRequest } from '../types'
import { addressApi } from '../api/addressApi'
import { authApi } from '../api/authApi'
import { TURKEY_DISTRICTS } from '../data/turkeyDistricts'
import { PHONE_RE, NON_DIGIT_RE, WHITESPACE_RE } from '../constants/regex'

// ─── Nav items ────────────────────────────────────────────────────────────────
type Section = 'orders' | 'info' | 'addresses' | 'notifications' | 'products' | 'brands' | 'campaigns' | 'categories' | 'users' | 'adminorders'

const NAV_CUSTOMER: { id: Section; label: string; icon: string }[] = [
  { id: 'orders', label: 'Siparişlerim', icon: '📦' },
  { id: 'info', label: 'Bilgilerim', icon: '👤' },
  { id: 'addresses', label: 'Adreslerim', icon: '📍' },
  { id: 'notifications', label: 'Bildirimler', icon: '🔔' },
]
const NAV_ADMIN: { id: Section; label: string; icon: string }[] = [
  { id: 'adminorders', label: 'Sipariş Yönetimi', icon: '📋' },
  { id: 'products', label: 'Ürün Yönetimi', icon: '🛍️' },
  { id: 'brands', label: 'Markalar', icon: '🏷️' },
  { id: 'categories', label: 'Kategoriler', icon: '🗂️' },
  { id: 'campaigns', label: 'Kampanyalar', icon: '📢' },
  { id: 'users', label: 'Kullanıcılar', icon: '👥' },
]

const UNITS = ['adet', 'kg', 'lt', 'kutu', 'paket', 'çift']

const EMPTY_FORM: ProductForm = {
  name: '', sku: '', categoryId: 0, brandId: 0,
  basePrice: 0, vatRate: 20, minSellingQuantity: 1, stockQuantity: 0,
  unit: 'adet', shortDescription: '', isActive: true, isFeatured: false,
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const allProducts = useSelector((s: RootState) => s.products.products)
  const categories = useSelector((s: RootState) => s.categories.categories)
  const categoriesLoading = useSelector((s: RootState) => s.categories.loading)
  const isAdmin = user?.role === 'ADMIN'

  const [section, setSection] = useState<Section>(isAdmin ? 'adminorders' : 'orders')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (searchParams.get('emailError')) {
      toast.error(searchParams.get('emailError') || 'E-posta değiştirilemedi.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  if (!user) return null

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '248px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <aside style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', position: 'sticky', top: 120 }}>
          {/* Avatar */}
          <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 auto 12px', boxShadow: '0 0 0 3px rgba(220,38,38,.2)' }}>{initials}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{user.email}</div>
            {isAdmin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                🛡️ Admin
              </span>
            )}
          </div>

          {/* Nav */}
          <nav style={{ padding: '8px 0' }}>
            {NAV_CUSTOMER.map(n => (
              <NavItem key={n.id} item={n} active={section === n.id} onClick={() => setSection(n.id)} />
            ))}

            {isAdmin && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <div style={{ padding: '6px 20px 2px', fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Admin</div>
                {NAV_ADMIN.map(n => (
                  <NavItem key={n.id} item={n} active={section === n.id} onClick={() => setSection(n.id)} />
                ))}
              </>
            )}

            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button onClick={handleLogout} style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 20px', fontSize: 13.5, fontWeight: 500, color: 'var(--primary)',
              background: 'none', border: 'none', cursor: 'pointer', borderLeft: '3px solid transparent',
            }}>
              <span>🚪</span> Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <div>
          {section === 'orders' && <OrdersSection />}
          {section === 'info' && <InfoSection user={user} />}
          {section === 'addresses' && <AddressesSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'adminorders' && isAdmin && <AdminOrdersSection />}
          {section === 'products' && isAdmin && <AdminProductsSection products={allProducts} onRefresh={() => { dispatch(resetCatalog()); dispatch(fetchCatalogThunk()) }} categories={categories} categoriesLoading={categoriesLoading} />}
          {section === 'brands' && isAdmin && <AdminBrandsSection />}
          {section === 'categories' && isAdmin && <AdminCategoriesSection categories={categories} onRefresh={() => dispatch(fetchCategoriesThunk(true))} />}
          {section === 'campaigns' && isAdmin && <AdminCampaignsSection />}
          {section === 'users' && isAdmin && <AdminUsersSection />}
        </div>
      </div>

      <Footer />
    </div>
  )
}

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }: { item: { id: string; label: string; icon: string }; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 20px', fontSize: 13.5, fontWeight: active ? 700 : 500,
      color: active ? 'var(--primary)' : 'var(--text2)',
      background: active ? 'var(--primary-bg)' : 'none',
      border: 'none', borderLeft: `3px solid ${active ? 'var(--primary)' : 'transparent'}`,
      cursor: 'pointer', transition: '0.15s',
    }}>
      <span style={{ fontSize: 15 }}>{item.icon}</span>
      {item.label}
    </button>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Orders Section ────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PENDING:    'Beklemede',
  PAID:       'Ödendi',
  PROCESSING: 'Onaylandı',
  SHIPPED:    'Kargoda',
  DELIVERED:  'Teslim Edildi',
  CANCELLED:  'İptal',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: '#fffbeb', color: '#d97706' },
  PAID:       { bg: '#f0fdf4', color: '#16a34a' },
  PROCESSING: { bg: '#f0fdf4', color: '#16a34a' },
  SHIPPED:    { bg: '#eff6ff', color: '#2563eb' },
  DELIVERED:  { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:  { bg: 'var(--primary-bg)', color: 'var(--primary)' },
}
const PAYMENT_LABEL: Record<string, string> = {
  CREDIT_CARD: '💳 Kart',
  COD:         '💵 Teslimatta',
}

function OrdersSection() {
  const dispatch = useDispatch<AppDispatch>()
  const orders = useSelector((s: RootState) => s.orders.items)
  const loading = useSelector((s: RootState) => s.orders.loading)
  const error = useSelector((s: RootState) => s.orders.error)

  useEffect(() => {
    dispatch(fetchOrdersThunk())
  }, [dispatch])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--primary)' }}>Siparişler yüklenemedi: {error}</div>

  return (
    <div>
      <SectionHead title="Siparişlerim" sub={`${orders.length} sipariş`} />
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {orders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Henüz sipariş yok</div>
          </div>
        ) : orders.map((o, i) => {
          const st = STATUS_STYLE[o.status] || STATUS_STYLE['PENDING']
          const label = STATUS_LABEL[o.status] || o.status
          const itemSummary = o.items.map(it => `${it.productName} ×${it.quantity}`).join(', ')
          const date = new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
          return (
            <div key={o.id} style={{ padding: '16px 20px', borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>#{String(o.id).padStart(6, '0')}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{date} · {o.city} / {o.district}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>₺{Number(o.totalAmount).toFixed(2)}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--bg3)', color: 'var(--text3)' }}>{PAYMENT_LABEL[o.paymentMethod] || '💵 Teslimatta'}</span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Admin Orders Section ─────────────────────────────────────────────────────
const ADMIN_FILTER_TABS = [
  { key: 'ALL',        label: 'Tümü' },
  { key: 'PENDING',    label: 'Bekleyen' },
  { key: 'PAID',       label: 'Ödendi' },
  { key: 'PROCESSING', label: 'Onaylandı' },
  { key: 'SHIPPED',    label: 'Kargoda' },
  { key: 'DELIVERED',  label: 'Teslim' },
  { key: 'CANCELLED',  label: 'İptal' },
]

function AdminOrdersSection() {
  const [orders, setOrders] = useState<AdminOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try { setOrders(await adminOrderApi.list()) } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActionLoading(id)
    try {
      const updated = action === 'approve'
        ? await adminOrderApi.approve(id)
        : await adminOrderApi.reject(id)
      setOrders(prev => prev.map(o => o.id === id ? updated : o))
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <SectionHead title="Sipariş Yönetimi" sub={`${orders.length} sipariş`}
        action={
          <button onClick={load} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            🔄 Yenile
          </button>
        }
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {ADMIN_FILTER_TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
              borderColor: filter === t.key ? 'var(--primary)' : 'var(--border)',
              background: filter === t.key ? 'var(--primary)' : 'var(--bg2)',
              color: filter === t.key ? '#fff' : 'var(--text2)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sipariş yok</div>
          </div>
        ) : filtered.map((o, i) => {
          const st = STATUS_STYLE[o.status] || STATUS_STYLE['PENDING']
          const label = STATUS_LABEL[o.status] || o.status
          const itemSummary = o.items.map(it => `${it.productName} ×${it.quantity}`).join(', ')
          const date = new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
          const canAct = o.status === 'PENDING' || o.status === 'PAID'
          return (
            <div key={o.id} style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>#{String(o.id).padStart(6, '0')}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--bg3)', color: 'var(--text3)' }}>{PAYMENT_LABEL[o.paymentMethod] || '💵'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 3 }}>
                    {date} · {o.fullName} · {o.phone}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{o.city} / {o.district}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>₺{Number(o.totalAmount).toFixed(2)}</div>
                  {canAct && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        disabled={actionLoading === o.id}
                        onClick={() => handleAction(o.id, 'approve')}
                        style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 'var(--r)', cursor: actionLoading === o.id ? 'not-allowed' : 'pointer', opacity: actionLoading === o.id ? 0.6 : 1 }}>
                        ✓ Onayla
                      </button>
                      <button
                        disabled={actionLoading === o.id}
                        onClick={() => handleAction(o.id, 'reject')}
                        style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', background: 'var(--bg3)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 'var(--r)', cursor: actionLoading === o.id ? 'not-allowed' : 'pointer', opacity: actionLoading === o.id ? 0.6 : 1 }}>
                        ✗ İptal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Info Section ──────────────────────────────────────────────────────────────
function InfoSection({ user }: { user: { firstName: string; lastName: string; email: string; phone: string | null; pendingEmailChange: boolean } }) {
  const dispatch = useDispatch<AppDispatch>()
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const [emailChangeOpen, setEmailChangeOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const validateName = (value: string, label: string) => {
    if (!value.trim()) return `${label} zorunludur`
    if (/\d/.test(value)) return `${label} rakam içeremez`
    if (value.trim().length > 20) return `${label} en fazla 20 karakter olabilir`
    return ''
  }

  const handleFieldChange = (key: keyof typeof form, value: string) => {
    const sanitized = (key === 'firstName' || key === 'lastName')
      ? value.replace(/\d/g, '').slice(0, 20)
      : value
    setForm(p => ({ ...p, [key]: sanitized }))
    if (key === 'firstName' || key === 'lastName') {
      setFormErrors(p => ({ ...p, [key]: validateName(sanitized, key === 'firstName' ? 'Ad' : 'Soyad') }))
    }
  }

  const validatePhone = (v: string) => {
    if (!v) return 'Telefon numarası zorunludur'
    if (!PHONE_RE.test(v)) return '05XX XXX XX XX formatında girin'
    return ''
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cursorPos = e.target.selectionStart ?? raw.length
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(NON_DIGIT_RE, '').length

    let digits = raw.replace(NON_DIGIT_RE, '').slice(0, 11)
    if (digits.length >= 1 && digits[0] !== '0') digits = '0' + digits.slice(0, 10)
    if (digits.length >= 2 && digits[1] !== '5') digits = digits[0] + '5' + digits.slice(2)

    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 4) + ' ' + digits.slice(4)
    if (digits.length > 7) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7)
    if (digits.length > 9) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 9) + ' ' + digits.slice(9)

    setForm(p => ({ ...p, phone: formatted }))
    setFormErrors(p => ({ ...p, phone: '' }))

    requestAnimationFrame(() => {
      if (!phoneInputRef.current) return
      let digitCount = 0, newCursor = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++
          if (digitCount === digitsBeforeCursor) { newCursor = i + 1; break }
        }
      }
      phoneInputRef.current.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setSending(true)
    try {
      await authApi.requestEmailChange(newEmail.trim())
      setSent(true)
      setEmailChangeOpen(false)
      setNewEmail('')
    } catch (err: any) {
      toast.error(err.message || 'E-posta değiştirilemedi')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
    background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5,
    padding: '0 12px', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div>
      <SectionHead title="Bilgilerim" sub="Kişisel bilgilerinizi güncelleyin" />
      {user.pendingEmailChange && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', marginBottom: 16, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 'var(--r)', fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span>E-posta değişikliği talebiniz onay bekliyor. Yeni adresinize gönderilen bağlantıya <strong>24 saat</strong> içinde tıklamazsanız talep otomatik iptal edilir.</span>
        </div>
      )}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 20 }}>
          {([
            { label: 'Ad', key: 'firstName' },
            { label: 'Soyad', key: 'lastName' },
          ] as { label: string; key: keyof typeof form }[]).map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => handleFieldChange(f.key, e.target.value)}
                maxLength={20}
                style={{ ...inputStyle, borderColor: formErrors[f.key] ? '#dc2626' : undefined }}
              />
              {formErrors[f.key] && <span style={{ fontSize: 11, color: '#dc2626' }}>{formErrors[f.key]}</span>}
            </div>
          ))}

          {/* E-posta — read-only + değiştir butonu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>E-posta</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={user.email} readOnly style={{ ...inputStyle, flex: 1, background: 'var(--bg)', color: 'var(--text3)', cursor: 'default' }} />
              <button onClick={() => { setEmailChangeOpen(v => !v); setSent(false) }}
                style={{ height: 40, padding: '0 14px', fontSize: 12, fontWeight: 700, background: 'var(--bg3)', color: 'var(--text2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Değiştir
              </button>
            </div>
          </div>

          {/* Telefon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Telefon</label>
            <input
              ref={phoneInputRef}
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="05XX XXX XX XX"
              inputMode="numeric"
              style={{ ...inputStyle, borderColor: formErrors.phone ? '#dc2626' : undefined }}
            />
            {formErrors.phone && <span style={{ fontSize: 11, color: '#dc2626' }}>{formErrors.phone}</span>}
          </div>
        </div>

        {/* E-posta değiştirme formu */}
        {emailChangeOpen && (
          <div style={{ margin: '0 20px 16px', padding: 16, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              Yeni e-posta adresinize bir doğrulama bağlantısı gönderilecektir.
              Bağlantı <strong>24 saat</strong> geçerlidir.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="Yeni e-posta adresi"
                onKeyDown={e => e.key === 'Enter' && handleEmailChange()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleEmailChange} disabled={sending || !newEmail.trim()}
                style={{ height: 40, padding: '0 16px', fontSize: 13, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Gönderiliyor…' : 'Gönder'}
              </button>
              <button onClick={() => { setEmailChangeOpen(false); setNewEmail('') }}
                style={{ height: 40, padding: '0 14px', fontSize: 13, fontWeight: 600, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer' }}>
                İptal
              </button>
            </div>
          </div>
        )}

        {sent && (
          <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r)', fontSize: 13, color: '#166534' }}>
            ✅ Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin — bağlantı 24 saat geçerlidir.
          </div>
        )}

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={async () => {
            const firstNameErr = validateName(form.firstName, 'Ad')
            const lastNameErr = validateName(form.lastName, 'Soyad')
            const phoneErr = validatePhone(form.phone)
            if (firstNameErr || lastNameErr || phoneErr) {
              setFormErrors({ firstName: firstNameErr, lastName: lastNameErr, phone: phoneErr })
              return
            }
            setSaving(true)
            try {
              await authApi.updateProfile(form.firstName.trim(), form.lastName.trim(), form.phone)
              dispatch(updateUserProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone }))
              toast.success('Bilgiler güncellendi')
            } catch (err: any) {
              toast.error(err.message || 'Güncelleme başarısız')
            } finally {
              setSaving(false)
            }
          }} disabled={saving} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <button onClick={() => { setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' }); setFormErrors({}) }}
            disabled={saving}
            style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>İptal</button>
        </div>
      </div>
    </div>
  )
}

// ─── Addresses Section ────────────────────────────────────────────────────────
const EMPTY_ADDRESS_FORM: AddressRequest = {
  title: '', fullName: '', phone: '', city: '', district: '', addressLine: '', isDefault: false,
}

function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AddressRequest>({ ...EMPTY_ADDRESS_FORM })
  const [saving, setSaving] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setAddresses(await addressApi.list()) } catch { toast.error('Adresler yüklenemedi') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditingId(null)
    setForm({ ...EMPTY_ADDRESS_FORM })
    setFormOpen(true)
  }
  const openEdit = (a: Address) => {
    setEditingId(a.id)
    setForm({ title: a.title, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, addressLine: a.addressLine, isDefault: a.isDefault })
    setFormOpen(true)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cursorPos = e.target.selectionStart ?? raw.length
    const digitsBeforeCursor = raw.slice(0, cursorPos).replace(/\D/g, '').length
    let digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length >= 1 && digits[0] !== '0') digits = '0' + digits.slice(0, 10)
    if (digits.length >= 2 && digits[1] !== '5') digits = digits[0] + '5' + digits.slice(2)
    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 4) + ' ' + digits.slice(4)
    if (digits.length > 7) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7)
    if (digits.length > 9) formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 9) + ' ' + digits.slice(9)
    setForm(p => ({ ...p, phone: formatted }))
    requestAnimationFrame(() => {
      if (!phoneInputRef.current) return
      let digitCount = 0; let newCursor = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) { digitCount++; if (digitCount === digitsBeforeCursor) { newCursor = i + 1; break } }
      }
      phoneInputRef.current.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.fullName.trim() || !form.phone.trim() || !form.city || !form.district || !form.addressLine.trim()) {
      toast.error('Tüm alanları doldurun'); return
    }
    setSaving(true)
    try {
      const payload = { ...form, phone: form.phone.replace(/\s/g, '') }
      if (editingId !== null) await addressApi.update(editingId, payload)
      else await addressApi.create(payload)
      toast.success(editingId !== null ? 'Adres güncellendi' : 'Adres eklendi')
      setFormOpen(false)
      await load()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Kayıt başarısız')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return
    try { await addressApi.remove(id); toast.success('Adres silindi'); await load() }
    catch { toast.error('Silme başarısız') }
  }

  const handleSetDefault = async (id: number) => {
    try { await addressApi.setDefault(id); await load() }
    catch { toast.error('İşlem başarısız') }
  }

  const cities = Object.keys(TURKEY_DISTRICTS).sort()

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>

  return (
    <div>
      <SectionHead title="Adreslerim" sub={`${addresses.length} kayıtlı adres`}
        action={!formOpen && addresses.length < 10 ? (
          <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Yeni Adres
          </button>
        ) : undefined}
      />

      {/* Form */}
      {formOpen && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Adres başlığı */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Adres Başlığı *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Örn: Ev, İş, Depo"
                style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            {/* Ad Soyad */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Ad Soyad *</label>
              <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Ad Soyad"
                style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            {/* Telefon */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Telefon *</label>
              <input ref={phoneInputRef} type="tel" value={form.phone} onChange={handlePhoneChange} placeholder="0532 123 45 67"
                style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            {/* İl */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İl *</label>
              <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value, district: '' }))}
                style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: form.city ? 'var(--text)' : 'var(--text3)', fontSize: 13, padding: '0 10px', outline: 'none', fontFamily: 'inherit' }}>
                <option value="">İl seçin</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* İlçe */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>İlçe *</label>
              <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} disabled={!form.city}
                style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: form.district ? 'var(--text)' : 'var(--text3)', fontSize: 13, padding: '0 10px', outline: 'none', fontFamily: 'inherit', opacity: !form.city ? 0.5 : 1, cursor: !form.city ? 'not-allowed' : 'pointer' }}>
                <option value="">{form.city ? 'İlçe seçin' : 'Önce il seçin'}</option>
                {(TURKEY_DISTRICTS[form.city] ?? []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Adres satırı */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Adres *</label>
              <textarea value={form.addressLine} onChange={e => setForm(p => ({ ...p, addressLine: e.target.value }))}
                placeholder="Mahalle, sokak, bina no, daire..." rows={3}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          {/* Varsayılan toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 12, userSelect: 'none' }} onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: form.isDefault ? 'var(--primary)' : 'var(--border2)', position: 'relative', transition: '0.25s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', top: 3, left: form.isDefault ? 19 : 3, transition: '0.25s' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Varsayılan adresim olarak kaydet</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setFormOpen(false)} style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
          </div>
        </div>
      )}

      {/* Address cards */}
      {addresses.length === 0 && !formOpen ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Henüz kayıtlı adres yok</div>
          <button onClick={openNew} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            İlk Adresi Ekle
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ background: 'var(--bg2)', border: `2px solid ${addr.isDefault ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r2)', padding: '16px 18px', position: 'relative' }}>
              {addr.isDefault && (
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 8px', borderRadius: 10 }}>Varsayılan</span>
              )}
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{addr.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>{addr.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{addr.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{addr.city} / {addr.district}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.4 }}>{addr.addressLine}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(addr)} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>✏️ Düzenle</button>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>⭐ Varsayılan Yap</button>
                )}
                <button onClick={() => handleDelete(addr.id)} style={{ fontSize: 11.5, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>🗑️ Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notifications Section ─────────────────────────────────────────────────────
function NotificationsSection() {
  const dispatch = useDispatch<AppDispatch>()
  const notifications = useSelector((s: RootState) => s.notifications.items)
  const loading = useSelector((s: RootState) => s.notifications.loading)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [marking, setMarking] = useState(false)


  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await dispatch(markAllReadThunk()).unwrap()
      toast.success('Tüm bildirimler okundu işaretlendi')
    } catch {
      toast.error('İşlem başarısız, tekrar deneyin')
    } finally {
      setMarking(false)
    }
  }

  const handleMarkRead = (id: number) => {
    dispatch(markReadThunk(id))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const displayed = onlyUnread ? notifications.filter(n => !n.isRead) : notifications
  const typeIcon: Record<string, string> = { ORDER: '📦', SYSTEM: '⚙️' }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>

  return (
    <div>
      <SectionHead title="Bildirimler" sub={unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tüm bildirimler okundu'} />

      {/* Kontrol barı */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', userSelect: 'none' }} onClick={() => setOnlyUnread(v => !v)}>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: onlyUnread ? 'var(--primary)' : 'var(--border2)', position: 'relative', transition: '0.25s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff', top: 3, left: onlyUnread ? 19 : 3, transition: '0.25s' }} />
          </div>
          Sadece okunmayanları göster
          {unreadCount > 0 && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>{unreadCount}</span>}
        </label>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={marking} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 13px', fontSize: 12, fontWeight: 600, color: 'var(--text2)', cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>
            {marking ? '...' : 'Tümünü Okundu İşaretle'}
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{onlyUnread ? 'Okunmamış bildirim yok' : 'Bildirim yok'}</div>
          </div>
        ) : displayed.map((n, i) => (
          <div key={n.id} onClick={() => { if (!n.isRead) handleMarkRead(n.id) }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none', background: n.isRead ? 'transparent' : 'var(--primary-bg)', transition: '0.2s', cursor: n.isRead ? 'default' : 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {typeIcon[n.type] || '🔔'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: n.isRead ? 400 : 600, lineHeight: 1.45, marginBottom: 4 }}>{n.message}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Admin Products Section ────────────────────────────────────────────────────
function findParentForEdit(catId: number, cats: Category[]): number {
  const cat = cats.find(c => c.category_id === catId)
  if (!cat) return 0
  if (cat.parent_id === null) return catId  // root kategori, kendisi parent
  return cat.parent_id
}

function AdminProductsSection({ products, onRefresh, categories, categoriesLoading }: {
  products: CatalogProduct[]
  onRefresh: () => void
  categories: Category[]
  categoriesLoading: boolean
}) {
  const dispatch = useDispatch<AppDispatch>()
  const brands = useSelector((s: RootState) => s.brands.brands)

  useEffect(() => { dispatch(fetchCatalogThunk()) }, [dispatch])
  useEffect(() => { dispatch(fetchBrandsThunk()) }, [dispatch])

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [step, setStep] = useState<'details' | 'images'>('details')
  const [editing, setEditing] = useState<CatalogProduct | null>(null)
  const [savedProductId, setSavedProductId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM })
  const [parentCatId, setParentCatId] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [imgSubmitted, setImgSubmitted] = useState(false)
  const [productImages, setProductImages] = useState<ProductImageType[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const draggingIdx = useRef<number | null>(null)

  const rootCats = useMemo(() => categories.filter(c => c.parent_id === null), [categories])
  const childCats = useMemo(() => categories.filter(c => c.parent_id === parentCatId), [categories, parentCatId])
  const hasChildren = childCats.length > 0

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.brandName?.toLowerCase().includes(q) ?? false) || p.sku.toLowerCase().includes(q))
  }, [products, search])

  const openAdd = () => {
    setForm({ ...EMPTY_FORM }); setParentCatId(0); setSubmitted(false); setImgSubmitted(false)
    setEditing(null); setSavedProductId(null); setProductImages([]); setStep('details'); setModal('add')
  }
  const openEdit = (p: CatalogProduct) => {
    const pid = findParentForEdit(p.categoryId ?? 0, categories)
    setParentCatId(pid > 0 ? pid : (p.categoryId ?? 0))
    setForm({
      name: p.name, sku: p.sku, categoryId: p.categoryId ?? 0, brandId: p.brandId ?? 0,
      basePrice: p.basePrice, vatRate: p.vatRate, minSellingQuantity: p.minSellingQuantity, stockQuantity: p.availableStock,
      unit: p.unit, shortDescription: p.shortDescription || '', isActive: p.isActive, isFeatured: p.isFeatured,
    })
    setSubmitted(false); setImgSubmitted(false); setEditing(p); setSavedProductId(p.id)
    setProductImages(p.images ?? []); setStep('details'); setModal('edit')
  }

  const closeModal = () => { setModal(null); onRefresh() }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.name.trim()) { toast.error('Ürün adı zorunlu'); return }
    if (!form.sku.trim()) { toast.error('SKU zorunlu'); return }
    if (!parentCatId) { toast.error('Ana kategori seçimi zorunlu'); return }
    if (hasChildren && !form.categoryId) { toast.error('Alt kategori seçimi zorunlu'); return }
    if (!form.brandId) { toast.error('Marka seçimi zorunlu'); return }
    if (!form.basePrice) { toast.error('Fiyat zorunlu'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const created = await productApi.adminCreate(form)
        setSavedProductId(created.id)
        setProductImages([])
        toast.success('Ürün eklendi')
        setStep('images')
      } else if (editing) {
        await productApi.adminUpdate(editing.id, form)
        toast.success('Ürün güncellendi')
        setStep('images')
      }
    } catch { toast.error('Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleFinish = () => {
    setImgSubmitted(true)
    if (productImages.length === 0) { toast.error('En az 1 resim yüklenmeli'); return }
    closeModal()
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !savedProductId) return
    setImageUploading(true)
    try {
      for (const file of Array.from(files)) {
        const img = await productImageApi.upload(savedProductId, file)
        setProductImages(prev => [...prev, img])
      }
    } catch { toast.error('Resim yüklenemedi') }
    finally { setImageUploading(false) }
  }

  const handleSetPrimary = async (imageId: number) => {
    if (!savedProductId) return
    try {
      await productImageApi.setPrimary(savedProductId, imageId)
      setProductImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === imageId })))
    } catch { toast.error('İşlem başarısız') }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!savedProductId) return
    try {
      await productImageApi.delete(savedProductId, imageId)
      setProductImages(prev => {
        const remaining = prev.filter(img => img.id !== imageId)
        const wasLast = prev.find(img => img.id === imageId)?.isPrimary
        if (wasLast && remaining.length > 0) remaining[0] = { ...remaining[0], isPrimary: true }
        return remaining
      })
    } catch { toast.error('Silinemedi') }
  }

  const handleDrop = async (toIdx: number) => {
    const fromIdx = draggingIdx.current
    if (fromIdx === null || fromIdx === toIdx || !savedProductId) return
    const reordered = [...productImages]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setProductImages(reordered)
    draggingIdx.current = null
    setDragOverIdx(null)
    try { await productImageApi.reorder(savedProductId, reordered.map(img => img.id)) }
    catch { toast.error('Sıralama kaydedilemedi') }
  }

  const handleDelete = async (id: number) => {
    try { await productApi.adminDelete(id); toast.success('Ürün silindi'); onRefresh() }
    catch { toast.error('Silme başarısız') }
    setDeleteId(null)
  }

  return (
    <div>
      <SectionHead title="Ürün Yönetimi" sub={`${products.length} ürün`} action={
        <button onClick={openAdd} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Yeni Ürün</button>
      } />

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim, SKU veya marka ara..."
          style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              {['Ürün', 'Kategori', 'Marka', 'Fiyat', 'Stok', 'Durum', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: '0.15s' }} className="admin-row">
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.primaryImageUrl ? (
                      <img src={imgUrl(p.primaryImageUrl)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 6, border: '1px dashed var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📦</div>
                    )}
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>SKU: {p.sku}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{p.categoryName}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{p.brandName || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>₺{Number(p.basePrice).toFixed(2)}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: p.availableStock > 0 ? 'var(--text2)' : 'var(--primary)' }}>{p.availableStock} {p.unit}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: p.isActive ? '#f0fdf4' : 'var(--bg3)', color: p.isActive ? '#16a34a' : 'var(--text3)' }}>
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {deleteId === p.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>Emin misin?</span>
                      <button onClick={() => handleDelete(p.id)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Evet</button>
                      <button onClick={() => setDeleteId(null)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Hayır</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                      <button onClick={() => setDeleteId(p.id)} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>Ürün bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 50 && <div style={{ textAlign: 'center', padding: '12px', fontSize: 13, color: 'var(--text3)' }}>İlk 50 ürün gösteriliyor · Toplamda {filtered.length} ürün</div>}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 660, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{modal === 'add' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h3>
                {/* Step tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setStep('details')} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: step === 'details' ? 'var(--primary)' : 'var(--bg3)', color: step === 'details' ? '#fff' : 'var(--text3)' }}>1 · Detaylar</button>
                  <button onClick={() => { if (savedProductId) setStep('images') }} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: 'none', cursor: savedProductId ? 'pointer' : 'not-allowed', background: step === 'images' ? 'var(--primary)' : 'var(--bg3)', color: step === 'images' ? '#fff' : savedProductId ? 'var(--text2)' : 'var(--text3)', opacity: savedProductId ? 1 : 0.5 }}>2 · Resimler {savedProductId && productImages.length > 0 ? `(${productImages.length})` : ''}</button>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Step 1: Details */}
            {step === 'details' && (
              <>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Ürün Adı *" span2>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !form.name.trim() ? 'var(--primary)' : undefined }} placeholder="Ürün adı" />
                    </FormField>
                    <FormField label="SKU *">
                      <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !form.sku.trim() ? 'var(--primary)' : undefined }} placeholder="Stok kodu" />
                    </FormField>
                    <FormField label="Marka *">
                      <select value={form.brandId} onChange={e => setForm(p => ({ ...p, brandId: Number(e.target.value) }))} style={{ ...inputStyle, color: form.brandId === 0 ? 'var(--text3)' : 'var(--text)', borderColor: submitted && !form.brandId ? 'var(--primary)' : undefined }}>
                        <option value={0}>— Seçiniz —</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Üst Kategori *">
                      <select value={parentCatId} disabled={categoriesLoading} onChange={e => {
                        const pid = Number(e.target.value)
                        setParentCatId(pid)
                        const kids = categories.filter(c => c.parent_id === pid)
                        setForm(p => ({ ...p, categoryId: kids.length > 0 ? 0 : pid }))
                      }} style={{ ...inputStyle, color: parentCatId === 0 ? 'var(--text3)' : 'var(--text)', borderColor: submitted && !parentCatId ? 'var(--primary)' : undefined }}>
                        <option value={0}>{categoriesLoading ? 'Yükleniyor...' : '— Seçiniz —'}</option>
                        {rootCats.map(c => <option key={c.category_id} value={c.category_id}>{c.emoji} {c.category_name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Alt Kategori *">
                      <select disabled={!hasChildren} value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: Number(e.target.value) }))} style={{ ...inputStyle, color: form.categoryId === 0 ? 'var(--text3)' : 'var(--text)', borderColor: submitted && hasChildren && !form.categoryId ? 'var(--primary)' : undefined }}>
                        <option value={0}>— Seçiniz —</option>
                        {childCats.map(c => <option key={c.category_id} value={c.category_id}>{c.emoji} {c.category_name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Birim Fiyat (₺) *">
                      <input type="number" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: Number(e.target.value) }))} style={{ ...inputStyle, borderColor: submitted && !form.basePrice ? 'var(--primary)' : undefined }} min={0} step={0.01} />
                    </FormField>
                    <FormField label="KDV Oranı (%)">
                      <input type="number" value={form.vatRate} onChange={e => setForm(p => ({ ...p, vatRate: Number(e.target.value) }))} style={inputStyle} min={0} max={100} />
                    </FormField>
                    <FormField label="Min. Sipariş Adedi">
                      <input type="number" value={form.minSellingQuantity} onChange={e => setForm(p => ({ ...p, minSellingQuantity: Number(e.target.value) }))} style={inputStyle} min={1} />
                    </FormField>
                    <FormField label="Stok Miktarı">
                      <input type="number" value={form.stockQuantity} onChange={e => setForm(p => ({ ...p, stockQuantity: Number(e.target.value) }))} style={inputStyle} min={0} />
                    </FormField>
                    <FormField label="Birim">
                      <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} style={inputStyle}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Kısa Açıklama" span2>
                      <input value={form.shortDescription} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} style={inputStyle} placeholder="Kısa ürün açıklaması (opsiyonel)" />
                    </FormField>
                    <FormField label="">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Aktif</span>
                      </label>
                    </FormField>
                    <FormField label="">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Öne Çıkan</span>
                      </label>
                    </FormField>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam →'}
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Images */}
            {step === 'images' && savedProductId && (
              <>
                <div style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Ürün Resimleri</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>En az 1 resim zorunlu · ★ ile vitrin resmi seçin · Max 10MB</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: imageUploading ? 'not-allowed' : 'pointer', opacity: imageUploading ? 0.7 : 1 }}>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} disabled={imageUploading} />
                      {imageUploading ? 'Yükleniyor...' : '+ Resim Ekle'}
                    </label>
                  </div>

                  {/* Image Grid */}
                  {productImages.length === 0 ? (
                    <div style={{ border: imgSubmitted ? '2px dashed var(--primary)' : '2px dashed var(--border)', borderRadius: 'var(--r2)', padding: '40px 20px', textAlign: 'center', color: imgSubmitted ? 'var(--primary)' : 'var(--text3)' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{imgSubmitted ? 'En az 1 resim yüklenmeli!' : 'Henüz resim yok'}</div>
                      <div style={{ fontSize: 12 }}>Yukarıdaki butona tıklayarak resim ekleyin</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Sürükleyerek sıralayın · ★ ile vitrin resmi seçin</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {productImages.map((img, idx) => (
                          <div
                            key={img.id}
                            draggable
                            onDragStart={() => { draggingIdx.current = idx }}
                            onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                            onDragLeave={() => setDragOverIdx(null)}
                            onDrop={() => handleDrop(idx)}
                            onDragEnd={() => { draggingIdx.current = null; setDragOverIdx(null) }}
                            style={{
                              position: 'relative', borderRadius: 'var(--r)', overflow: 'hidden',
                              border: img.isPrimary ? '2.5px solid var(--primary)' : dragOverIdx === idx ? '2px dashed #38bdf8' : '1.5px solid var(--border)',
                              background: 'var(--bg3)', cursor: 'grab',
                              opacity: draggingIdx.current === idx ? 0.4 : 1,
                              transition: 'border-color 0.15s, opacity 0.15s',
                            }}
                          >
                            <img src={imgUrl(img.imageUrl)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />

                            {/* Primary badge */}
                            {img.isPrimary && (
                              <div style={{ position: 'absolute', top: 5, left: 5, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, letterSpacing: 0.3, pointerEvents: 'none' }}>VİTRİN</div>
                            )}

                            {/* Action buttons — bottom bar */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }}>
                              <button
                                title={img.isPrimary ? 'Vitrin resmi' : 'Vitrin yap'}
                                onClick={e => { e.stopPropagation(); if (!img.isPrimary) handleSetPrimary(img.id) }}
                                style={{
                                  flex: 1, height: 30, border: 'none', borderRight: '1px solid rgba(255,255,255,.15)',
                                  background: 'none', cursor: img.isPrimary ? 'default' : 'pointer',
                                  color: img.isPrimary ? '#fbbf24' : 'rgba(255,255,255,.6)',
                                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'color 0.15s',
                                }}
                              >★</button>
                              <button
                                title="Sil"
                                onClick={e => { e.stopPropagation(); handleDeleteImage(img.id) }}
                                style={{ flex: 1, height: 30, border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <button onClick={() => setStep('details')} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Detaylar</button>
                  <button onClick={handleFinish} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Tamamla</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`.admin-row:hover { background: var(--bg3) !important; }`}</style>
    </div>
  )
}

// ─── Admin Campaigns Section ───────────────────────────────────────────────────
const CAMP_COLORS = [
  'linear-gradient(130deg,#dc2626 0%,#991b1b 50%,#7f1d1d 100%)',
  'linear-gradient(130deg,#1e3a5f 0%,#0f2035 50%,#0a1628 100%)',
  'linear-gradient(130deg,#0f766e 0%,#0d5c56 50%,#0a4a44 100%)',
  'linear-gradient(130deg,#7c3aed 0%,#6d28d9 50%,#5b21b6 100%)',
  'linear-gradient(130deg,#b45309 0%,#92400e 50%,#78350f 100%)',
  'linear-gradient(130deg,#0369a1 0%,#075985 50%,#0c4a6e 100%)',
]
const EMOJI_OPTS = ['🐱','🐶','🐦','🐟','🐹','🦎','🎁','🔥','🚚','💜','⭐','🏆','💯','🎉','🛍️','💰','🎀','🌟','❤️','🐾','🦴','🐠','🐇','🦜','🌿','🐕','🐈','📣','🎯','🎊']

interface CampForm {
  title: string; badge: string; description: string; emoji: string; sticker: string
  bgColor: string; startDate: string; endDate: string; isActive: boolean
}
type DiscountScope = 'category' | 'product' | 'brand'

interface DiscForm {
  name: string; emoji: string; scope: DiscountScope
  discountType: 'PERCENT' | 'FIXED'; discountValue: string
  categoryId: string; productId: string; brandId: string
  startDate: string; endDate: string; isActive: boolean
}

const DISC_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  CATEGORY: { label: 'KATEGORİ', color: '#0369a1', bg: '#e0f2fe' },
  PRODUCT:  { label: 'ÜRÜN',     color: '#16a34a', bg: '#dcfce7' },
  BRAND:    { label: 'MARKA',    color: '#7c3aed', bg: '#ede9fe' },
  GENERAL:  { label: 'KUPON',    color: '#b45309', bg: '#fef3c7' },
}

function AdminCampaignsSection() {
  const dispatch = useDispatch<AppDispatch>()
  const categories = useSelector((s: RootState) => s.categories.categories)
  const allProducts = useSelector((s: RootState) => s.products.products)
  const brands = useSelector((s: RootState) => s.brands.brands)
  const campaigns = useSelector((s: RootState) => s.adminCampaigns.campaigns)
  const discounts = useSelector((s: RootState) => s.adminCampaigns.discounts)
  const activeEmojisArr = useSelector((s: RootState) => s.adminCampaigns.activeEmojis)
  const loading = useSelector((s: RootState) => s.adminCampaigns.loading)
  const activeEmojis = useMemo(() => new Set(activeEmojisArr), [activeEmojisArr])

  useEffect(() => {
    dispatch(fetchBrandsThunk())
    dispatch(fetchCatalogThunk())
    dispatch(fetchCategoriesThunk(false))
    dispatch(fetchAdminCampaignsThunk())
  }, [dispatch])

  const refreshAll = () => {
    dispatch(resetAdminCampaigns())
    dispatch(resetCampaigns())
    dispatch(resetCatalog())
    dispatch(fetchAdminCampaignsThunk())
    dispatch(fetchCatalogThunk())
  }

  const [tab, setTab] = useState<'info' | 'discount'>('info')
  const [modal, setModal] = useState<null | 'camp-add' | 'camp-edit' | 'disc-add' | 'disc-edit'>(null)
  const [editCamp, setEditCamp] = useState<CampaignResponse | null>(null)
  const [editDisc, setEditDisc] = useState<DiscountResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'campaign' | 'discount'; id: number; dtype?: string } | null>(null)
  const [campForm, setCampForm] = useState<CampForm>({ title: '', badge: '', description: '', emoji: '', sticker: '', bgColor: CAMP_COLORS[0], startDate: '', endDate: '', isActive: true })
  const [discForm, setDiscForm] = useState<DiscForm>({ name: '', emoji: '', scope: 'category', discountType: 'PERCENT', discountValue: '', categoryId: '', productId: '', brandId: '', startDate: '', endDate: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const openCampAdd = () => { setCampForm({ title: '', badge: '', description: '', emoji: '', sticker: '', bgColor: CAMP_COLORS[0], startDate: '', endDate: '', isActive: true }); setSubmitted(false); setEditCamp(null); setModal('camp-add') }
  const openCampEdit = (c: CampaignResponse) => {
    setCampForm({ title: c.title, badge: c.badge, description: c.description || '', emoji: c.emoji || '', sticker: c.sticker || '', bgColor: c.bgColor, startDate: c.startDate ? c.startDate.slice(0, 16) : '', endDate: c.endDate ? c.endDate.slice(0, 16) : '', isActive: c.isActive })
    setSubmitted(false); setEditCamp(c); setModal('camp-edit')
  }
  const openDiscAdd = () => { setDiscForm({ name: '', emoji: '', scope: 'category', discountType: 'PERCENT', discountValue: '', categoryId: '', productId: '', brandId: '', startDate: '', endDate: '', isActive: true }); setSubmitted(false); setEditDisc(null); setModal('disc-add') }
  const openDiscEdit = (d: DiscountResponse) => {
    setDiscForm({ name: d.name, emoji: d.emoji || '', scope: d.type as DiscountScope, discountType: d.discountType || 'PERCENT', discountValue: String(d.discountValue ?? ''), categoryId: '', productId: '', brandId: '', startDate: d.startDate ? d.startDate.slice(0, 16) : '', endDate: d.endDate ? d.endDate.slice(0, 16) : '', isActive: d.isActive })
    setSubmitted(false); setEditDisc(d); setModal('disc-edit')
  }

  const handleSaveCampaign = async () => {
    setSubmitted(true)
    if (!campForm.badge.trim() || !campForm.title.trim()) { toast.error('Badge ve başlık zorunlu'); return }
    setSaving(true)
    try {
      const payload: CampaignRequest = { ...campForm, description: campForm.description || null, emoji: campForm.emoji || null, sticker: campForm.sticker || null, startDate: campForm.startDate || null, endDate: campForm.endDate || null }
      if (modal === 'camp-add') { await campaignApi.create(payload); toast.success('Kampanya eklendi') }
      else if (editCamp) { await campaignApi.update(editCamp.id!, payload); toast.success('Kampanya güncellendi') }
      setModal(null); refreshAll()
    } catch (err: any) { toast.error(err?.message || 'Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleSaveDiscount = async () => {
    setSubmitted(true)
    if (!discForm.name.trim()) { toast.error('Kampanya adı zorunlu'); return }
    if (!discForm.discountValue || isNaN(+discForm.discountValue)) { toast.error('İndirim değeri zorunlu'); return }
    if (modal !== 'disc-edit') {
      if (discForm.scope === 'category' && !discForm.categoryId) { toast.error('Kategori seçin'); return }
      if (discForm.scope === 'product' && !discForm.productId) { toast.error('Ürün seçin'); return }
      if (discForm.scope === 'brand' && !discForm.brandId) { toast.error('Marka seçin'); return }
    }
    setSaving(true)
    try {
      const base = { name: discForm.name, emoji: discForm.emoji || null, discountType: discForm.discountType as 'PERCENT' | 'FIXED', discountValue: +discForm.discountValue, startDate: discForm.startDate || null, endDate: discForm.endDate || null, isActive: discForm.isActive }
      if (modal === 'disc-edit' && editDisc) {
        await discountApi.update(editDisc.type, editDisc.id, base)
        toast.success('İndirim kampanyası güncellendi')
      } else {
        const createBase = { ...base, startDate: discForm.startDate || '', endDate: discForm.endDate || '' }
        if (discForm.scope === 'category') await discountApi.create('category', { ...createBase, categoryId: +discForm.categoryId })
        else if (discForm.scope === 'product') await discountApi.create('product', { ...createBase, productId: +discForm.productId })
        else await discountApi.create('brand', { ...createBase, brandId: +discForm.brandId })
        toast.success('İndirim kampanyası eklendi')
      }
      setModal(null); refreshAll()
    } catch (err: any) { toast.error(err?.message || 'Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.kind === 'campaign') { await campaignApi.delete(deleteConfirm.id); toast.success('Kampanya silindi') }
      else { await discountApi.delete(deleteConfirm.dtype!, deleteConfirm.id); toast.success('İndirim silindi') }
      setDeleteConfirm(null); refreshAll()
    } catch (err: any) { toast.error(err?.message || 'Silinemedi'); setDeleteConfirm(null) }
  }

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.category_id, c.category_name])), [categories])
  const leafCategories = useMemo(() =>
    categories
      .filter(c => c.parent_id !== null)
      .map(c => ({ ...c, displayName: `${categoryMap.get(c.parent_id!) ?? ''} → ${c.category_name}` }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr')),
    [categories, categoryMap])
  const sortedBrands = useMemo(() => [...brands].sort((a, b) => a.name.localeCompare(b.name, 'tr')), [brands])
  const sortedProducts = useMemo(() => [...allProducts].sort((a, b) => a.name.localeCompare(b.name, 'tr')), [allProducts])

  const EmojiPicker = ({ selected, onSelect }: { selected: string; onSelect: (e: string) => void }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {EMOJI_OPTS.map(em => {
        const disabled = activeEmojis.has(em) && em !== selected
        return (
          <button key={em} type="button" onClick={() => !disabled && onSelect(selected === em ? '' : em)} disabled={disabled}
            style={{ width: 36, height: 36, borderRadius: 8, border: selected === em ? '2px solid var(--primary)' : '1px solid var(--border)', background: selected === em ? 'var(--primary-bg)' : 'var(--bg3)', fontSize: 18, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1, transition: '0.15s' }}>
            {em}
          </button>
        )
      })}
    </div>
  )

  return (
    <div>
      <SectionHead title="Kampanya Yönetimi" sub="Bilgilendirme ve indirim kampanyaları" action={
        <button onClick={tab === 'info' ? openCampAdd : openDiscAdd} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Yeni Kampanya</button>
      } />

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 16, border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', width: 'fit-content' }}>
        {(['info', 'discount'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: tab === t ? 700 : 500, background: tab === t ? 'var(--primary)' : 'var(--bg2)', color: tab === t ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer', transition: '0.15s' }}>
            {t === 'info' ? '📢 Bilgilendirme' : '🏷️ İndirimler'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>
      ) : tab === 'info' ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['Önizleme', 'Badge', 'Başlık', 'Açıklama', 'Durum', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── Sistem kampanyası: ücretsiz kargo (silinemez) ── */}
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(30,58,95,0.04)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚚</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text2)' }}>Ücretsiz Kargo</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{FREE_SHIPPING_TITLE}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text2)' }}>Tüm siparişlerde geçerli. Aynı gün kargolama.</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: '#f0fdf4', color: '#16a34a' }}>Aktif</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button disabled style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'not-allowed', opacity: 0.5 }}>Düzenle</button>
                    <button disabled style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'not-allowed', opacity: 0.5 }}>Sil</button>
                  </div>
                </td>
              </tr>
              {campaigns.filter(c =>
                !c.title?.toLowerCase().includes('ücretsiz kargo') &&
                !c.badge?.toLowerCase().includes('ücretsiz kargo')
              ).map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < campaigns.length - 1 ? '1px solid var(--border)' : 'none' }} className="admin-row">
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: c.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.emoji || '📢'}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text2)', maxWidth: 130 }}>{c.badge}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{c.title}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text2)', maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: c.isActive ? '#f0fdf4' : 'var(--bg3)', color: c.isActive ? '#16a34a' : 'var(--text3)' }}>{c.isActive ? 'Aktif' : 'Pasif'}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {deleteConfirm?.kind === 'campaign' && deleteConfirm.id === c.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Emin misin?</span>
                        <button onClick={handleDelete} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Evet</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Hayır</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openCampEdit(c)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                        <button onClick={() => setDeleteConfirm({ kind: 'campaign', id: c.id! })} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>Bilgilendirme kampanyası yok</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                {['Tip', 'Adı', 'Hedef', 'İndirim', 'Durum', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d, i) => {
                const badge = DISC_BADGE[d.type] || { label: d.type, color: 'var(--text2)', bg: 'var(--bg3)' }
                return (
                  <tr key={`${d.type}-${d.id}`} style={{ borderBottom: i < discounts.length - 1 ? '1px solid var(--border)' : 'none' }} className="admin-row">
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color, letterSpacing: 0.3 }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {d.emoji && <span style={{ marginRight: 5 }}>{d.emoji}</span>}{d.name}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text2)' }}>{d.targetName || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      {d.discountValue != null ? `${d.discountType === 'PERCENT' ? '%' : '₺'}${d.discountValue}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: d.isActive ? '#f0fdf4' : 'var(--bg3)', color: d.isActive ? '#16a34a' : 'var(--text3)' }}>{d.isActive ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {deleteConfirm?.kind === 'discount' && deleteConfirm.id === d.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Emin misin?</span>
                          <button onClick={handleDelete} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Evet</button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Hayır</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openDiscEdit(d)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                          <button onClick={() => setDeleteConfirm({ kind: 'discount', id: d.id, dtype: d.type })} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {discounts.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>İndirim kampanyası yok</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Bilgilendirme Kampanyası Modal */}
      {(modal === 'camp-add' || modal === 'camp-edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{modal === 'camp-add' ? 'Bilgilendirme Kampanyası' : 'Kampanyayı Düzenle'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Badge (üst etiket) *">
                <input value={campForm.badge} onChange={e => setCampForm(p => ({ ...p, badge: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !campForm.badge.trim() ? 'var(--primary)' : undefined }} placeholder="🔥 Mart Kampanyası" />
              </FormField>
              <FormField label="Başlık *">
                <input value={campForm.title} onChange={e => setCampForm(p => ({ ...p, title: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !campForm.title.trim() ? 'var(--primary)' : undefined }} placeholder="Ana başlık (\\n ile satır kır)" />
              </FormField>
              <FormField label="Açıklama">
                <textarea value={campForm.description} onChange={e => setCampForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, height: 70, resize: 'vertical' } as React.CSSProperties} placeholder="Alt açıklama metni" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Sticker (opsiyonel)">
                  <input value={campForm.sticker} onChange={e => setCampForm(p => ({ ...p, sticker: e.target.value }))} style={inputStyle} placeholder="%20 İndirim" />
                </FormField>
                <FormField label="Durum">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                    <input type="checkbox" checked={campForm.isActive} onChange={e => setCampForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 15, height: 15 }} /> Aktif
                  </label>
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Başlangıç Tarihi">
                  <input type="datetime-local" value={campForm.startDate} onChange={e => setCampForm(p => ({ ...p, startDate: e.target.value }))} style={inputStyle} />
                </FormField>
                <FormField label="Bitiş Tarihi">
                  <input type="datetime-local" value={campForm.endDate} onChange={e => setCampForm(p => ({ ...p, endDate: e.target.value }))} style={inputStyle} />
                </FormField>
              </div>
              <FormField label="Emoji (opsiyonel)">
                <EmojiPicker selected={campForm.emoji} onSelect={em => setCampForm(p => ({ ...p, emoji: em }))} />
                {campForm.emoji && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 4 }}>Seçili: {campForm.emoji} <button type="button" onClick={() => setCampForm(p => ({ ...p, emoji: '' }))} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Temizle</button></div>}
              </FormField>
              <FormField label="Arka Plan Rengi">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CAMP_COLORS.map((col, i) => (
                    <div key={i} onClick={() => setCampForm(p => ({ ...p, bgColor: col }))} style={{ width: 36, height: 36, borderRadius: 8, background: col, cursor: 'pointer', border: campForm.bgColor === col ? '3px solid #fff' : '3px solid transparent', boxShadow: campForm.bgColor === col ? '0 0 0 2px var(--primary)' : 'none', transition: '0.15s' }} />
                  ))}
                </div>
              </FormField>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSaveCampaign} disabled={saving} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Kaydediliyor...' : modal === 'camp-add' ? 'Ekle' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İndirim Kampanyası Modal */}
      {(modal === 'disc-add' || modal === 'disc-edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{modal === 'disc-edit' ? 'İndirimi Düzenle' : 'İndirim Kampanyası'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Kampanya Adı *">
                <input value={discForm.name} onChange={e => setDiscForm(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.name.trim() ? 'var(--primary)' : undefined }} placeholder="Örn: Kedi Maması %20 İndirim" />
              </FormField>
              <FormField label="Emoji (opsiyonel)">
                <EmojiPicker selected={discForm.emoji} onSelect={em => setDiscForm(p => ({ ...p, emoji: em }))} />
                {discForm.emoji && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 4 }}>Seçili: {discForm.emoji} <button type="button" onClick={() => setDiscForm(p => ({ ...p, emoji: '' }))} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Temizle</button></div>}
              </FormField>
              {modal !== 'disc-edit' && (<>
              <FormField label="Kapsam">
                <select value={discForm.scope} onChange={e => setDiscForm(p => ({ ...p, scope: e.target.value as DiscountScope, categoryId: '', productId: '', brandId: '' }))} style={inputStyle}>
                  <option value="category">Kategoriye Göre</option>
                  <option value="product">Ürüne Göre</option>
                  <option value="brand">Markaya Göre</option>
                </select>
              </FormField>
              {discForm.scope === 'category' && (
                <FormField label="Kategori *">
                  <select value={discForm.categoryId} onChange={e => setDiscForm(p => ({ ...p, categoryId: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.categoryId ? 'var(--primary)' : undefined }}>
                    <option value="">Kategori seçin...</option>
                    {leafCategories.map(c => <option key={c.category_id} value={c.category_id}>{c.displayName}</option>)}
                  </select>
                </FormField>
              )}
              {discForm.scope === 'product' && (
                <FormField label="Ürün *">
                  <select value={discForm.productId} onChange={e => setDiscForm(p => ({ ...p, productId: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.productId ? 'var(--primary)' : undefined }}>
                    <option value="">Ürün seçin...</option>
                    {sortedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FormField>
              )}
              {discForm.scope === 'brand' && (
                <FormField label="Marka *">
                  <select value={discForm.brandId} onChange={e => setDiscForm(p => ({ ...p, brandId: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.brandId ? 'var(--primary)' : undefined }}>
                    <option value="">Marka seçin...</option>
                    {sortedBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </FormField>
              )}
              </>)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="İndirim Tipi">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', height: 40 }}>
                    {(['PERCENT', 'FIXED'] as const).map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
                        <input type="radio" checked={discForm.discountType === t} onChange={() => setDiscForm(p => ({ ...p, discountType: t }))} /> {t === 'PERCENT' ? '% Yüzde' : '₺ Tutar'}
                      </label>
                    ))}
                  </div>
                </FormField>
                <FormField label="İndirim Değeri *">
                  <input type="number" value={discForm.discountValue} onChange={e => setDiscForm(p => ({ ...p, discountValue: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.discountValue ? 'var(--primary)' : undefined }} placeholder={discForm.discountType === 'PERCENT' ? '20' : '50.00'} min={0} step={0.01} />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <FormField label="Başlangıç Tarihi *">
                  <input type="datetime-local" value={discForm.startDate} onChange={e => setDiscForm(p => ({ ...p, startDate: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.startDate ? 'var(--primary)' : undefined }} />
                </FormField>
                <FormField label="Bitiş Tarihi *">
                  <input type="datetime-local" value={discForm.endDate} onChange={e => setDiscForm(p => ({ ...p, endDate: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.endDate ? 'var(--primary)' : undefined }} />
                </FormField>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={discForm.isActive} onChange={e => setDiscForm(p => ({ ...p, isActive: e.target.checked }))} style={{ width: 15, height: 15 }} /> Aktif
              </label>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSaveDiscount} disabled={saving} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Kaydediliyor...' : modal === 'disc-edit' ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.admin-row:hover { background: var(--bg3) !important; }`}</style>
    </div>
  )
}

// ─── Admin Categories Section ──────────────────────────────────────────────────
// ─── Admin Brands Section ──────────────────────────────────────────────────────
function AdminBrandsSection() {
  const dispatch = useDispatch<AppDispatch>()
  const brands = useSelector((s: RootState) => s.brands.brands)

  useEffect(() => { dispatch(fetchBrandsThunk()) }, [dispatch])

  const refresh = () => {
    dispatch(resetBrands())
    dispatch(fetchBrandsThunk())
  }

  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [editBrand, setEditBrand] = useState<Brand | null>(null)
  const [form, setForm] = useState({ name: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const openAdd = () => { setForm({ name: '', isActive: true }); setSubmitted(false); setEditBrand(null); setModal('add') }
  const openEdit = (b: Brand) => { setForm({ name: b.name, isActive: b.isActive }); setSubmitted(false); setEditBrand(b); setModal('edit') }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.name.trim()) { toast.error('Marka adı zorunlu'); return }
    setSaving(true)
    try {
      if (modal === 'add') { await brandApi.adminCreate(form); toast.success('Marka eklendi') }
      else if (editBrand) { await brandApi.adminUpdate(editBrand.id, form); toast.success('Marka güncellendi') }
      setModal(null); refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Bir hata oluştu')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await brandApi.adminDelete(id); toast.success('Marka silindi'); refresh() }
    catch (err: any) { toast.error(err?.message || 'Silinemedi — markada ürün mevcut olabilir') }
    setDeleteId(null)
  }

  return (
    <div>
      <SectionHead title="Marka Yönetimi" sub={`${brands.length} marka`} action={
        <button onClick={openAdd} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Yeni Marka</button>
      } />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              {['Marka Adı', 'Durum', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.map((b, i) => (
              <tr key={b.id} style={{ borderBottom: i < brands.length - 1 ? '1px solid var(--border)' : 'none' }} className="admin-row">
                <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>🏷️ {b.name}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: b.isActive ? '#f0fdf4' : 'var(--bg3)', color: b.isActive ? '#16a34a' : 'var(--text3)' }}>
                    {b.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {deleteId === b.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>Emin misin?</span>
                      <button onClick={() => handleDelete(b.id)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Evet</button>
                      <button onClick={() => setDeleteId(null)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Hayır</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(b)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                      <button onClick={() => setDeleteId(b.id)} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>Henüz marka yok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{modal === 'add' ? 'Yeni Marka' : 'Markayı Düzenle'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Marka Adı *">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !form.name.trim() ? 'var(--primary)' : undefined }} placeholder="Marka adı" autoFocus />
              </FormField>
              <FormField label="">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Aktif</span>
                </label>
              </FormField>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Kaydediliyor...' : modal === 'add' ? 'Ekle' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.admin-row:hover { background: var(--bg3) !important; }`}</style>
    </div>
  )
}

// ─── Admin Categories Section ──────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { label: 'Hayvanlar', emojis: ['🐱','🐶','🐦','🐟','🐹','🦎','🐰','🐾','🐠','🐡','🦜','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🦋','🐢','🦖','🐕','🐩','🐈','🐇','🐿️','🦔','🐓','🦆','🦢','🦩','🦚'] },
  { label: 'Mama & İçecek', emojis: ['🥩','🥫','🍖','🍗','🦴','🥚','🧀','🥕','🌽','🥦','🍎','🍓','🫐','🍇','🥜','🫘','🌾','🍬','🥛','🧃','🫙','🍽️'] },
  { label: 'Bakım & Sağlık', emojis: ['🚿','🛁','🪮','🧴','🧼','💊','🩺','🏥','🌡️','🩹','🧹','✂️','🪥','🧽'] },
  { label: 'Ev & Aksesuarlar', emojis: ['🛏️','🪣','🏠','🪴','🛒','🧺','📿','🎾','🧶','🎁','🎀','🏮','🪃','🚪','🪟','🪑'] },
  { label: 'Diğer', emojis: ['⭐','💫','✨','🎯','🏆','🎖️','🌸','🌺','🌻','💐','🌱','🍃','🌿','💎','❤️','🔔','🎪','🌈'] },
]

type CatFlat = { id: number; name: string; emoji: string; parentId: number | null; childCount: number; displayOrder: number }

function AdminCategoriesSection({ categories, onRefresh }: { categories: Category[]; onRefresh: () => void }) {
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [editCat, setEditCat] = useState<CatFlat | null>(null)
  const [form, setForm] = useState({ name: '', emoji: '', parentId: -1, displayOrder: 1 })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const flat: CatFlat[] = useMemo(() => {
    const roots = categories.filter(c => c.parent_id === null)
      .sort((a, b) => a.display_order - b.display_order)
    const result: CatFlat[] = []
    for (const root of roots) {
      result.push({ id: root.category_id, name: root.category_name, emoji: root.emoji ?? '', parentId: null, childCount: categories.filter(ch => ch.parent_id === root.category_id).length, displayOrder: root.display_order })
      categories.filter(c => c.parent_id === root.category_id)
        .sort((a, b) => a.display_order - b.display_order)
        .forEach(child => result.push({ id: child.category_id, name: child.category_name, emoji: child.emoji ?? '', parentId: child.parent_id, childCount: 0, displayOrder: child.display_order }))
    }
    return result
  }, [categories])

  const rootCats = useMemo(() => categories.filter(c => c.parent_id === null), [categories])

  // Başka kategorilerin kullandığı emojiler (kendi emojisin hariç)
  const usedEmojis = useMemo(() => {
    const ownEmoji = editCat?.emoji ?? ''
    return new Set(categories.map(c => c.emoji).filter((e): e is string => !!e && e !== ownEmoji))
  }, [categories, editCat])

  // Seçilen parent'ın kardeşleri (mevcut edit öğesi hariç)
  const formSiblings = useMemo(() => {
    if (form.parentId === -1) return []
    const pid = form.parentId === 0 ? null : form.parentId
    return categories.filter(c => c.parent_id === pid && c.category_id !== (editCat?.id ?? -1))
      .sort((a, b) => a.display_order - b.display_order)
  }, [categories, form.parentId, editCat])

  const displayOrderOptions = useMemo(() =>
    Array.from({ length: formSiblings.length + 1 }, (_, i) => i + 1)
  , [formSiblings])

  const calcNextOrder = (parentId: number) => {
    if (parentId === -1) return 1
    const pid = parentId === 0 ? null : parentId
    return categories.filter(c => c.parent_id === pid).length + 1
  }

  const openAdd = () => {
    setForm({ name: '', emoji: '', parentId: -1, displayOrder: 1 })
    setEmojiPickerOpen(false); setSubmitted(false)
    setEditCat(null); setModal('add')
  }
  const openEdit = (c: CatFlat) => {
    setForm({ name: c.name, emoji: c.emoji, parentId: c.parentId ?? 0, displayOrder: c.displayOrder })
    setEmojiPickerOpen(false); setSubmitted(false)
    setEditCat(c); setModal('edit')
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.name.trim()) { toast.error('Kategori adı zorunlu'); return }
    if (!form.emoji) { toast.error('Emoji seçimi zorunlu'); return }
    if (form.parentId === -1) { toast.error('Üst kategori seçimi zorunlu'); return }
    setSaving(true)
    try {
      // Seçilen sıraya başka biri oturuyorsa onu sona taşı
      const displaced = formSiblings.find(s => s.display_order === form.displayOrder)
      if (displaced) {
        const endOrder = formSiblings.length + 1
        await categoryApi.adminUpdate(displaced.category_id, {
          name: displaced.category_name, emoji: displaced.emoji || undefined,
          parentId: displaced.parent_id, displayOrder: endOrder,
        })
      }
      const data = { name: form.name.trim(), emoji: form.emoji || undefined, parentId: form.parentId > 0 ? form.parentId : null, displayOrder: form.displayOrder }
      if (modal === 'add') { await categoryApi.adminCreate(data); toast.success('Kategori eklendi') }
      else if (editCat) { await categoryApi.adminUpdate(editCat.id, data); toast.success('Kategori güncellendi') }
      setModal(null); onRefresh()
    } catch { toast.error('Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.adminDelete(id); toast.success('Kategori silindi'); onRefresh()
    } catch (err: any) {
      toast.error(err?.message || 'Silinemedi — kategoride ürün mevcut olabilir')
    }
    setDeleteId(null)
  }

  return (
    <div>
      <SectionHead title="Kategori Yönetimi" sub={`${flat.length} kategori`} action={
        <button onClick={openAdd} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Yeni Kategori</button>
      } />

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Kategori Adı', 'Tür', 'Alt Kategori', 'Ürün', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < flat.length - 1 ? '1px solid var(--border)' : 'none' }} className="admin-row">
                <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text3)', width: 32 }}>{c.displayOrder}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ marginLeft: c.parentId ? 20 : 0, fontSize: 13.5, fontWeight: c.parentId ? 500 : 700, color: 'var(--text)' }}>
                    {c.parentId ? '└ ' : ''}{c.emoji} {c.name}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 700, background: c.parentId ? 'var(--bg3)' : 'var(--primary-bg)', color: c.parentId ? 'var(--text3)' : 'var(--primary)' }}>
                    {c.parentId ? 'Alt' : 'Üst'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text3)' }}>{c.childCount > 0 ? `${c.childCount} alt` : '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  {categories.find(x => x.category_id === c.id)?.has_product
                    ? <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>Var</span>
                    : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {deleteId === c.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {!c.parentId && c.childCount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-bg)', borderRadius: 5, padding: '3px 7px' }}>
                          ⚠️ Bağlı {c.childCount} alt kategori de silinecek
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Onaylıyor musunuz?</span>
                        <button onClick={() => handleDelete(c.id)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--primary)', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Evet</button>
                        <button onClick={() => setDeleteId(null)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>Hayır</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                      <button onClick={() => setDeleteId(c.id)} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {flat.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>Henüz kategori yok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{modal === 'add' ? 'Yeni Kategori' : 'Kategoriyi Düzenle'}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Kategori Adı *">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !form.name.trim() ? 'var(--primary)' : undefined }} placeholder="Kategori adı" autoFocus />
              </FormField>

              <FormField label="Emoji *">
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setEmojiPickerOpen(p => !p)} style={{ width: '100%', height: 40, border: `1.5px solid ${submitted && !form.emoji ? 'var(--primary)' : emojiPickerOpen ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', fontFamily: 'inherit' }}>
                    {form.emoji
                      ? <span style={{ fontSize: 22, lineHeight: 1 }}>{form.emoji}</span>
                      : <span style={{ fontSize: 13, color: 'var(--text3)' }}>Emoji seç...</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>▾</span>
                  </button>
                  {emojiPickerOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setEmojiPickerOpen(false)} />
                      <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', boxShadow: '0 8px 24px rgba(0,0,0,.2)', zIndex: 11, maxHeight: 240, overflowY: 'auto', padding: '6px 10px 10px' }}>
                        {EMOJI_GROUPS.map(g => (
                          <div key={g.label}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '8px 0 4px' }}>{g.label}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {g.emojis.map(em => {
                                const isUsed = usedEmojis.has(em)
                                const isSelected = form.emoji === em
                                return (
                                  <button key={em} type="button" disabled={isUsed} onClick={() => { setForm(p => ({ ...p, emoji: em })); setEmojiPickerOpen(false) }}
                                    title={isUsed ? 'Kullanımda' : em}
                                    style={{ width: 32, height: 32, border: isSelected ? '1.5px solid var(--primary)' : '1px solid transparent', borderRadius: 6, background: isSelected ? 'var(--primary-bg)' : 'transparent', cursor: isUsed ? 'not-allowed' : 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUsed ? 0.25 : 1 }}>
                                    {em}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {form.emoji && (
                          <button type="button" onClick={() => { setForm(p => ({ ...p, emoji: '' })); setEmojiPickerOpen(false) }}
                            style={{ marginTop: 8, width: '100%', padding: '5px', fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Emoji kaldır ×
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </FormField>

              <FormField label="Üst Kategori *">
                <select value={form.parentId} onChange={e => {
                  const pid = Number(e.target.value)
                  setForm(p => ({ ...p, parentId: pid, displayOrder: calcNextOrder(pid) }))
                }} style={{ ...inputStyle, color: form.parentId === -1 ? 'var(--text3)' : 'var(--text)', borderColor: submitted && form.parentId === -1 ? 'var(--primary)' : undefined }}>
                  <option value={-1} disabled>— Seçiniz —</option>
                  <option value={0}>Ana Kategori (Kök Seviye)</option>
                  {rootCats.map(c => <option key={c.category_id} value={c.category_id}>{c.emoji} {c.category_name}</option>)}
                </select>
              </FormField>

              {form.parentId !== -1 && (
                <FormField label={`Sıra (${formSiblings.length + 1} slot mevcut)`}>
                  <select value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} style={inputStyle}>
                    {displayOrderOptions.map(n => {
                      const occupied = formSiblings.find(s => s.display_order === n)
                      return <option key={n} value={n}>{n}{occupied ? ` — (${occupied.emoji} ${occupied.category_name} sona taşınır)` : n === formSiblings.length + 1 ? ' — (sona ekle)' : ''}</option>
                    })}
                  </select>
                </FormField>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 'var(--r)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Kaydediliyor...' : modal === 'add' ? 'Ekle' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.admin-row:hover { background: var(--bg3) !important; }`}</style>
    </div>
  )
}

// ─── Admin Users Section ───────────────────────────────────────────────────────
function AdminUsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    userApi.adminList({ size: 100 })
      .then(p => { setUsers(p.content); setTotal(p.totalElements) })
      .catch(() => toast.error('Kullanıcılar yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone?.includes(q) ?? false)
    )
  }, [users, search])

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div>
      <SectionHead title="Kullanıcılar" sub={`${total} kayıtlı kullanıcı`} />

      <div style={{ marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim, e-posta veya telefon ara..."
          style={{ width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13.5, padding: '0 14px', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
              {['Ad Soyad', 'E-posta', 'Telefon', 'Rol', 'Kayıt Tarihi'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</td></tr>
            )}
            {!loading && filtered.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }} className="admin-row">
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{u.firstName} {u.lastName}</div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{u.phone || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 700, background: u.role === 'ADMIN' ? 'var(--primary-bg)' : 'var(--bg3)', color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text3)' }}>
                    {u.role === 'ADMIN' ? '🛡️ Admin' : 'Müşteri'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text3)' }}>{fmt(u.createdAt)}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>Kullanıcı bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'var(--text3)' }}>İlk 100 kullanıcı gösteriliyor · Toplamda {total} kullanıcı</div>}

      <style>{`.admin-row:hover { background: var(--bg3) !important; }`}</style>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
  background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px',
  outline: 'none', fontFamily: 'inherit',
}

function FormField({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span2 ? '1 / -1' : undefined }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{label}</label>}
      {children}
    </div>
  )
}
