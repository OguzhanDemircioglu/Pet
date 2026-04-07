import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import type { RootState, AppDispatch } from '../store'
import { logout } from '../store/authSlice'
import { fetchProductsThunk } from '../store/productSlice'
import { productApi, brandApi, categoryApi, userApi, productImageApi, imgUrl, type ProductForm } from '../api/productApi'
import { campaignApi, discountApi, type CampaignResponse, type DiscountResponse, type DiscountScope, type CampaignRequest } from '../api/campaignApi'
import { fetchCategoriesThunk } from '../store/categorySlice'
import type { Product, ProductImage as ProductImageType, Brand, Category, AdminUser } from '../types'

// ─── Nav items ────────────────────────────────────────────────────────────────
type Section = 'orders' | 'addresses' | 'info' | 'notifications' | 'products' | 'brands' | 'campaigns' | 'categories' | 'users'

const NAV_CUSTOMER: { id: Section; label: string; icon: string }[] = [
  { id: 'orders', label: 'Siparişlerim', icon: '📦' },
  { id: 'addresses', label: 'Adreslerim', icon: '📍' },
  { id: 'info', label: 'Bilgilerim', icon: '👤' },
  { id: 'notifications', label: 'Bildirimler', icon: '🔔' },
]
const NAV_ADMIN: { id: Section; label: string; icon: string }[] = [
  { id: 'products', label: 'Ürün Yönetimi', icon: '🛍️' },
  { id: 'brands', label: 'Markalar', icon: '🏷️' },
  { id: 'categories', label: 'Kategoriler', icon: '🗂️' },
  { id: 'campaigns', label: 'Kampanyalar', icon: '📢' },
  { id: 'users', label: 'Kullanıcılar', icon: '👥' },
]

const UNITS = ['adet', 'kg', 'lt', 'kutu', 'paket', 'çift']

const EMPTY_FORM: ProductForm = {
  name: '', sku: '', categoryId: 0, brandId: 0,
  basePrice: 0, vatRate: 20, moq: 1, stockQuantity: 0,
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

  const [section, setSection] = useState<Section>(isAdmin ? 'products' : 'orders')
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (isAdmin) brandApi.adminList().then(setBrands).catch(() => {})
  }, [isAdmin])

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
          {section === 'addresses' && <AddressesSection />}
          {section === 'info' && <InfoSection user={user} />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'products' && isAdmin && <AdminProductsSection products={allProducts} onRefresh={() => dispatch(fetchProductsThunk(true))} categories={categories} categoriesLoading={categoriesLoading} brands={brands} />}
          {section === 'brands' && isAdmin && <AdminBrandsSection brands={brands} onRefresh={() => brandApi.adminList().then(setBrands).catch(() => {})} />}
          {section === 'categories' && isAdmin && <AdminCategoriesSection categories={categories} onRefresh={() => dispatch(fetchCategoriesThunk(true))} />}
          {section === 'campaigns' && isAdmin && <AdminCampaignsSection brands={brands} />}
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
const MOCK_ORDERS = [
  { id: '#OFC-2024-0042', date: '8 Mart 2026', items: 'Royal Canin Adult 10kg × 3, Pedigree × 5', total: '₺2.840', status: 'Hazırlanıyor' },
  { id: '#OFC-2024-0038', date: '28 Şubat 2026', items: 'Hill\'s Science Plan × 2, Royal Canin × 4', total: '₺4.210', status: 'Teslim Edildi' },
  { id: '#OFC-2024-0031', date: '15 Şubat 2026', items: 'Brit Premium Kedi × 10', total: '₺1.650', status: 'Teslim Edildi' },
]
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Hazırlanıyor': { bg: '#fffbeb', color: '#d97706' },
  'Kargoda': { bg: '#eff6ff', color: '#2563eb' },
  'Teslim Edildi': { bg: '#f0fdf4', color: '#16a34a' },
  'İptal': { bg: 'var(--primary-bg)', color: 'var(--primary)' },
}

function OrdersSection() {
  return (
    <div>
      <SectionHead title="Siparişlerim" sub="Tüm sipariş geçmişiniz" />
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {MOCK_ORDERS.map((o, i) => {
          const st = STATUS_STYLE[o.status] || STATUS_STYLE['Hazırlanıyor']
          return (
            <div key={o.id} style={{ padding: '16px 20px', borderBottom: i < MOCK_ORDERS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{o.id}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>{o.date}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{o.items}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{o.total}</div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{o.status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Addresses Section ─────────────────────────────────────────────────────────
const MOCK_ADDR = [
  { type: 'İş Adresi', name: 'Pet Mağazası', text: 'Atatürk Cad. No:42 Kat:2, Kadıköy / İstanbul', isDefault: true },
  { type: 'Depo Adresi', name: 'Merkez Depo', text: 'OSB Mah. 3. Cadde No:17, Gebze / Kocaeli', isDefault: false },
]

function AddressesSection() {
  return (
    <div>
      <SectionHead title="Adreslerim" sub="Teslimat adresleriniz" action={
        <button style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Yeni Adres</button>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {MOCK_ADDR.map((a, i) => (
          <div key={i} style={{ border: `1.5px solid ${a.isDefault ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--r)', padding: '14px 16px', background: a.isDefault ? 'var(--primary-bg)' : 'var(--bg2)', position: 'relative' }}>
            {a.isDefault && <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>Varsayılan</span>}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{a.type}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{a.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10 }}>{a.text}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 9px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', cursor: 'pointer' }}>Düzenle</button>
              {!a.isDefault && <button style={{ fontSize: 12, color: 'var(--primary)', padding: '3px 9px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', cursor: 'pointer' }}>Sil</button>}
            </div>
          </div>
        ))}
        <div style={{ border: '1.5px dashed var(--border2)', borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--text3)', fontSize: 13, minHeight: 120 }}>
          <span style={{ fontSize: 24 }}>＋</span>
          Yeni adres ekle
        </div>
      </div>
    </div>
  )
}

// ─── Info Section ──────────────────────────────────────────────────────────────
function InfoSection({ user }: { user: { firstName: string; lastName: string; email: string; phone: string | null } }) {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '' })

  return (
    <div>
      <SectionHead title="Bilgilerim" sub="Kişisel bilgilerinizi güncelleyin" />
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 20 }}>
          {[
            { label: 'Ad', key: 'firstName' },
            { label: 'Soyad', key: 'lastName' },
            { label: 'E-posta', key: 'email' },
            { label: 'Telefon', key: 'phone' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          ))}
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={() => toast.success('Bilgiler güncellendi')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
          <button onClick={() => setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '' })}
            style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>İptal</button>
        </div>
      </div>
    </div>
  )
}

// ─── Notifications Section ─────────────────────────────────────────────────────
const NOTIF_PREFS = [
  { label: 'Yeni sipariş bildirimleri', desc: 'Sipariş oluşturulduğunda bildirim al' },
  { label: 'Kargo güncelleme', desc: 'Siparişin kargoya verildiğinde bildirim al' },
  { label: 'Kampanya ve indirimler', desc: 'Özel teklifler ve kampanyalardan haberdar ol' },
  { label: 'Sistem bildirimleri', desc: 'Hesap ve güvenlik bildirimleri' },
]

function NotificationsSection() {
  const [prefs, setPrefs] = useState([true, true, false, true])
  return (
    <div>
      <SectionHead title="Bildirim Tercihleri" sub="Hangi bildirimleri almak istediğinizi seçin" />
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '4px 0' }}>
        {NOTIF_PREFS.map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: i < NOTIF_PREFS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{n.desc}</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0 }}>
              <input type="checkbox" checked={prefs[i]} onChange={() => setPrefs(p => p.map((v, j) => j === i ? !v : v))} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: prefs[i] ? 'var(--primary)' : 'var(--border2)', cursor: 'pointer', transition: '0.3s' }}>
                <span style={{ position: 'absolute', width: 18, height: 18, left: prefs[i] ? 21 : 3, bottom: 3, background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
              </span>
            </label>
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

function AdminProductsSection({ products, onRefresh, categories, categoriesLoading, brands }: {
  products: Product[]
  onRefresh: () => void
  categories: Category[]
  categoriesLoading: boolean
  brands: Brand[]
}) {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [step, setStep] = useState<'details' | 'images'>('details')
  const [editing, setEditing] = useState<Product | null>(null)
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

  const loadImages = async (productId: number) => {
    try { setProductImages(await productImageApi.list(productId)) } catch {}
  }

  const openAdd = () => {
    setForm({ ...EMPTY_FORM }); setParentCatId(0); setSubmitted(false); setImgSubmitted(false)
    setEditing(null); setSavedProductId(null); setProductImages([]); setStep('details'); setModal('add')
  }
  const openEdit = (p: Product) => {
    const pid = findParentForEdit(p.categoryId, categories)
    setParentCatId(pid > 0 ? pid : p.categoryId)
    setForm({
      name: p.name, sku: p.sku, categoryId: p.categoryId, brandId: p.brandId ?? 0,
      basePrice: p.basePrice, vatRate: p.vatRate, moq: p.moq, stockQuantity: p.availableStock,
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
                      <input type="number" value={form.moq} onChange={e => setForm(p => ({ ...p, moq: Number(e.target.value) }))} style={inputStyle} min={1} />
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
interface DiscForm {
  name: string; emoji: string; scope: DiscountScope
  discountType: 'PERCENT' | 'FIXED'; discountValue: string
  categoryId: string; productId: string; brandId: string
  couponCode: string; minOrderAmount: string; usageLimit: string
  startDate: string; endDate: string; isActive: boolean
}

const DISC_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  CATEGORY: { label: 'KATEGORİ', color: '#0369a1', bg: '#e0f2fe' },
  PRODUCT:  { label: 'ÜRÜN',     color: '#16a34a', bg: '#dcfce7' },
  BRAND:    { label: 'MARKA',    color: '#7c3aed', bg: '#ede9fe' },
  GENERAL:  { label: 'KUPON',    color: '#b45309', bg: '#fef3c7' },
}

function AdminCampaignsSection({ brands }: { brands: Brand[] }) {
  const categories = useSelector((s: RootState) => s.categories.categories)
  const allProducts = useSelector((s: RootState) => s.products.products)

  const [tab, setTab] = useState<'info' | 'discount'>('info')
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([])
  const [discounts, setDiscounts] = useState<DiscountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeEmojis, setActiveEmojis] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<null | 'camp-add' | 'camp-edit' | 'disc-add'>(null)
  const [editCamp, setEditCamp] = useState<CampaignResponse | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'campaign' | 'discount'; id: number; dtype?: string } | null>(null)
  const [campForm, setCampForm] = useState<CampForm>({ title: '', badge: '', description: '', emoji: '', sticker: '', bgColor: CAMP_COLORS[0], startDate: '', endDate: '', isActive: true })
  const [discForm, setDiscForm] = useState<DiscForm>({ name: '', emoji: '', scope: 'category', discountType: 'PERCENT', discountValue: '', categoryId: '', productId: '', brandId: '', couponCode: '', minOrderAmount: '', usageLimit: '', startDate: '', endDate: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [c, d, ce, de] = await Promise.all([campaignApi.list(), discountApi.list(), campaignApi.getActiveEmojis(), discountApi.getActiveEmojis()])
      setCampaigns(c); setDiscounts(d); setActiveEmojis(new Set([...ce, ...de]))
    } catch { toast.error('Veriler yüklenemedi') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const openCampAdd = () => { setCampForm({ title: '', badge: '', description: '', emoji: '', sticker: '', bgColor: CAMP_COLORS[0], startDate: '', endDate: '', isActive: true }); setSubmitted(false); setEditCamp(null); setModal('camp-add') }
  const openCampEdit = (c: CampaignResponse) => {
    setCampForm({ title: c.title, badge: c.badge, description: c.description || '', emoji: c.emoji || '', sticker: c.sticker || '', bgColor: c.bgColor, startDate: c.startDate ? c.startDate.slice(0, 16) : '', endDate: c.endDate ? c.endDate.slice(0, 16) : '', isActive: c.isActive })
    setSubmitted(false); setEditCamp(c); setModal('camp-edit')
  }
  const openDiscAdd = () => { setDiscForm({ name: '', emoji: '', scope: 'category', discountType: 'PERCENT', discountValue: '', categoryId: '', productId: '', brandId: '', couponCode: '', minOrderAmount: '', usageLimit: '', startDate: '', endDate: '', isActive: true }); setSubmitted(false); setProductSearch(''); setModal('disc-add') }

  const handleSaveCampaign = async () => {
    setSubmitted(true)
    if (!campForm.badge.trim() || !campForm.title.trim()) { toast.error('Badge ve başlık zorunlu'); return }
    setSaving(true)
    try {
      const payload: CampaignRequest = { ...campForm, description: campForm.description || null, emoji: campForm.emoji || null, sticker: campForm.sticker || null, startDate: campForm.startDate || null, endDate: campForm.endDate || null }
      if (modal === 'camp-add') { await campaignApi.create(payload); toast.success('Kampanya eklendi') }
      else if (editCamp) { await campaignApi.update(editCamp.id, payload); toast.success('Kampanya güncellendi') }
      setModal(null); loadData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleSaveDiscount = async () => {
    setSubmitted(true)
    if (!discForm.name.trim()) { toast.error('Kampanya adı zorunlu'); return }
    if (!discForm.discountValue || isNaN(+discForm.discountValue)) { toast.error('İndirim değeri zorunlu'); return }
    if (!discForm.startDate || !discForm.endDate) { toast.error('Tarih aralığı zorunlu'); return }
    if (discForm.scope === 'category' && !discForm.categoryId) { toast.error('Kategori seçin'); return }
    if (discForm.scope === 'product' && !discForm.productId) { toast.error('Ürün seçin'); return }
    if (discForm.scope === 'brand' && !discForm.brandId) { toast.error('Marka seçin'); return }
    if (discForm.scope === 'general' && !discForm.couponCode.trim()) { toast.error('Kupon kodu zorunlu'); return }
    setSaving(true)
    try {
      const base = { name: discForm.name, emoji: discForm.emoji || null, discountType: discForm.discountType as 'PERCENT' | 'FIXED', discountValue: +discForm.discountValue, startDate: discForm.startDate, endDate: discForm.endDate, isActive: discForm.isActive }
      if (discForm.scope === 'category') await discountApi.create('category', { ...base, categoryId: +discForm.categoryId })
      else if (discForm.scope === 'product') await discountApi.create('product', { ...base, productId: +discForm.productId })
      else if (discForm.scope === 'brand') await discountApi.create('brand', { ...base, brandId: +discForm.brandId })
      else await discountApi.create('general', { ...base, couponCode: discForm.couponCode, minOrderAmount: discForm.minOrderAmount ? +discForm.minOrderAmount : null, usageLimit: discForm.usageLimit ? +discForm.usageLimit : null })
      toast.success('İndirim kampanyası eklendi'); setModal(null); loadData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Bir hata oluştu') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.kind === 'campaign') { await campaignApi.delete(deleteConfirm.id); toast.success('Kampanya silindi') }
      else { await discountApi.delete(deleteConfirm.dtype!, deleteConfirm.id); toast.success('İndirim silindi') }
      setDeleteConfirm(null); loadData()
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Silinemedi'); setDeleteConfirm(null) }
  }

  const filteredProducts = useMemo(() => productSearch.length < 2 ? [] : allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 8), [allProducts, productSearch])
  const leafCategories = useMemo(() => categories.filter(c => c.parent_id !== null), [categories])

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
              {campaigns.map((c, i) => (
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
                        <button onClick={() => setDeleteConfirm({ kind: 'campaign', id: c.id })} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
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
                {['Tip', 'Adı', 'Hedef', 'İndirim', 'Kupon', 'Durum', ''].map(h => (
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
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace' }}>{d.couponCode || '—'}</td>
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
                        <button onClick={() => setDeleteConfirm({ kind: 'discount', id: d.id, dtype: d.type })} style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {discounts.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>İndirim kampanyası yok</td></tr>}
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
      {modal === 'disc-add' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r2)', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>İndirim Kampanyası</h3>
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
              <FormField label="Kapsam">
                <select value={discForm.scope} onChange={e => setDiscForm(p => ({ ...p, scope: e.target.value as DiscountScope, categoryId: '', productId: '', brandId: '', couponCode: '' }))} style={inputStyle}>
                  <option value="category">Kategoriye Göre</option>
                  <option value="product">Ürüne Göre</option>
                  <option value="brand">Markaya Göre</option>
                  <option value="general">Genel Kupon</option>
                </select>
              </FormField>
              {discForm.scope === 'category' && (
                <FormField label="Kategori *">
                  <select value={discForm.categoryId} onChange={e => setDiscForm(p => ({ ...p, categoryId: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.categoryId ? 'var(--primary)' : undefined }}>
                    <option value="">Kategori seçin...</option>
                    {leafCategories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </FormField>
              )}
              {discForm.scope === 'product' && (
                <FormField label="Ürün *">
                  <input value={productSearch} onChange={e => { setProductSearch(e.target.value); setDiscForm(p => ({ ...p, productId: '' })) }} style={{ ...inputStyle, borderColor: submitted && !discForm.productId ? 'var(--primary)' : undefined }} placeholder="Ürün adı ile ara..." />
                  {filteredProducts.length > 0 && !discForm.productId && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', marginTop: 4, overflow: 'hidden', background: 'var(--bg2)' }}>
                      {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => { setDiscForm(fp => ({ ...fp, productId: String(p.id) })); setProductSearch(p.name) }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--text)' }} className="admin-row">{p.name}</div>
                      ))}
                    </div>
                  )}
                  {discForm.productId && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>✓ Seçildi</div>}
                </FormField>
              )}
              {discForm.scope === 'brand' && (
                <FormField label="Marka *">
                  <select value={discForm.brandId} onChange={e => setDiscForm(p => ({ ...p, brandId: e.target.value }))} style={{ ...inputStyle, borderColor: submitted && !discForm.brandId ? 'var(--primary)' : undefined }}>
                    <option value="">Marka seçin...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </FormField>
              )}
              {discForm.scope === 'general' && (
                <>
                  <FormField label="Kupon Kodu *">
                    <input value={discForm.couponCode} onChange={e => setDiscForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))} style={{ ...inputStyle, borderColor: submitted && !discForm.couponCode.trim() ? 'var(--primary)' : undefined, fontFamily: 'monospace', letterSpacing: 1 }} placeholder="YAZI50" />
                  </FormField>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Min. Sipariş Tutarı (₺)">
                      <input type="number" value={discForm.minOrderAmount} onChange={e => setDiscForm(p => ({ ...p, minOrderAmount: e.target.value }))} style={inputStyle} placeholder="0" min={0} />
                    </FormField>
                    <FormField label="Kullanım Limiti">
                      <input type="number" value={discForm.usageLimit} onChange={e => setDiscForm(p => ({ ...p, usageLimit: e.target.value }))} style={inputStyle} placeholder="Sınırsız" min={1} />
                    </FormField>
                  </div>
                </>
              )}
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
                {saving ? 'Kaydediliyor...' : 'Ekle'}
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
function AdminBrandsSection({ brands, onRefresh }: { brands: Brand[]; onRefresh: () => void }) {
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
      setModal(null); onRefresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bir hata oluştu')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await brandApi.adminDelete(id); toast.success('Marka silindi'); onRefresh() }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Silinemedi — markada ürün mevcut olabilir') }
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
      toast.error(err?.response?.data?.message || 'Silinemedi — kategoride ürün mevcut olabilir')
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
