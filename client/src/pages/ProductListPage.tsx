import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { Product, CatalogProduct } from '../types'
import type { RootState, AppDispatch } from '../store'
import { fetchCategoriesThunk } from '../store/categorySlice'
import { addToCart } from '../store/cartSlice'
import { productApi, imgUrl } from '../api/productApi'
import toast from 'react-hot-toast'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'

const BG_COLORS = [
  'linear-gradient(135deg,#fce7f3,#fdf2f8)',
  'linear-gradient(135deg,#dbeafe,#eff6ff)',
  'linear-gradient(135deg,#dcfce7,#f0fdf4)',
  'linear-gradient(135deg,#fef3c7,#fffbeb)',
  'linear-gradient(135deg,#f3e8ff,#faf5ff)',
  'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
]
const EMOJIS: Record<string, string> = { kedi: '🐱', kopek: '🐶', kus: '🐦', akvaryum: '🐟', kemirgen: '🐹', surungenler: '🦎' }

export default function ProductListPage() {
  const [searchParams] = useSearchParams()
  const slugParam = searchParams.get('slug') || searchParams.get('kategori') || ''
  const query = searchParams.get('q') || ''
  const [sort, setSort] = useState('default')

  const dispatch = useDispatch<AppDispatch>()
  const categories = useSelector((s: RootState) => s.categories.categories)
  const catalogProducts = useSelector((s: RootState) => s.products.products)
  const catalogLoaded = useSelector((s: RootState) => s.products.catalogLoaded)

  // Kategori bazlı ürün cache (component ömrü boyunca, fallback için)
  const cacheRef = useRef<Map<number, Product[]>>(new Map())
  const [catProducts, setCatProducts] = useState<(Product | CatalogProduct)[]>([])
  const [loading, setLoading] = useState(false)
  const [noStock, setNoStock] = useState(false)

  useEffect(() => {
    dispatch(fetchCategoriesThunk(false))
  }, [dispatch])

  // Seçili kategori ve hiyerarşi
  const currentCat = useMemo(
    () => categories.find(c => c.category_slug === slugParam) ?? null,
    [categories, slugParam]
  )
  const parentCat = useMemo(
    () => (currentCat?.parent_id != null ? categories.find(c => c.category_id === currentCat!.parent_id) ?? null : null),
    [categories, currentCat]
  )

  // Kategori değişince fetch
  useEffect(() => {
    if (!currentCat) {
      if (catalogLoaded) {
        setCatProducts(catalogProducts)
        setNoStock(false)
      } else {
        setCatProducts([])
        setNoStock(false)
      }
      return
    }

    // Üst kategori — tıklanamaz, buraya gelinen yol olmamalı ama yine de guard
    if (currentCat.parent_id === null) { setCatProducts([]); setNoStock(false); return }

    // has_product false → stok yok, API çağırma
    if (!currentCat.has_product) { setCatProducts([]); setNoStock(true); return }

    setNoStock(false)

    // Catalog Redux'ta yüklüyse — API çağrısı yok
    if (catalogLoaded) {
      setCatProducts(catalogProducts.filter(p => p.categoryId === currentCat.category_id))
      return
    }

    // Cache'den al
    if (cacheRef.current.has(currentCat.category_id)) {
      setCatProducts(cacheRef.current.get(currentCat.category_id)!)
      return
    }

    // Fallback: per-category API
    setLoading(true)
    productApi.list({ categoryId: currentCat.category_id, size: 500 })
      .then(page => {
        cacheRef.current.set(currentCat.category_id, page.content)
        setCatProducts(page.content)
      })
      .catch(() => setCatProducts([]))
      .finally(() => setLoading(false))
  }, [currentCat, catalogLoaded, catalogProducts])

  const products = useMemo(() => {
    let list = catProducts

    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false) ||
        (('shortDescription' in p && p.shortDescription?.toLowerCase().includes(q)) ?? false)
      )
    }

    if (sort === 'price_asc') list = [...list].sort((a, b) => a.basePrice - b.basePrice)
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.basePrice - a.basePrice)
    else if (sort === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    return list
  }, [catProducts, query, sort])

  const pageTitle = query
    ? `"${query}" için sonuçlar`
    : currentCat ? currentCat.category_name
    : 'Tüm Ürünler'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Breadcrumb */}
        <nav style={{ padding: '16px 0 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text2)' }}>Ana Sayfa</Link>
          {parentCat && (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <Link to={`/urunler?slug=${parentCat.category_slug}`} style={{ fontSize: 13, color: 'var(--text2)' }}>
                {parentCat.category_name}
              </Link>
            </>
          )}
          {currentCat && (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{currentCat.category_name}</span>
            </>
          )}
          {!currentCat && (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{pageTitle}</span>
            </>
          )}
        </nav>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {currentCat?.emoji ? `${currentCat.emoji} ` : ''}{pageTitle}
            </h1>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{products.length} ürün bulundu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Sırala:</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              height: 36, border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
              background: 'var(--bg2)', color: 'var(--text)', fontSize: 13,
              padding: '0 10px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <option value="default">Önerilen</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
              <option value="name_asc">İsim A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)', fontSize: 16 }}>Yükleniyor...</div>
        ) : noStock ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Bu kategoride stok bulunmuyor</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Yakında yeni ürünler eklenecek.</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ürün bulunamadı</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Farklı bir arama deneyin veya filtreleri temizleyin.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, paddingBottom: 40 }}>
            {products.map(p => (
              <ProductCard key={p.id} p={p as CatalogProduct} />
            ))}
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        .prod-card-list:hover { box-shadow: 0 8px 28px rgba(0,0,0,.11) !important; transform: translateY(-3px) !important; border-color: var(--primary) !important; }
      `}</style>
    </div>
  )
}

function ProductCard({ p }: { p: CatalogProduct }) {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const cartItems = useSelector((s: RootState) => s.cart.items)
  const bg = BG_COLORS[p.name.charCodeAt(0) % BG_COLORS.length]
  const emoji = (p.categoryName && EMOJIS[p.categoryName.toLowerCase()]) || '🐾'

  return (
    <div
      onClick={() => navigate(`/urun/${p.slug}`)}
      className="prod-card-list"
      style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r2)', overflow: 'hidden',
        transition: '0.22s', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, background: bg, position: 'relative', flexShrink: 0 }}>
        {p.primaryImageUrl
          ? <img src={imgUrl(p.primaryImageUrl)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
          : <span>{emoji}</span>
        }
      </div>
      <div style={{ padding: 13, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{p.brandName}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 7, flex: 1 }}>{p.name}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>₺{p.basePrice.toFixed(2)}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Min. {p.minSellingQuantity} {p.unit}</div>
        <button
          disabled={p.availableStock <= 0}
          onClick={p.availableStock > 0 ? e => {
            e.stopPropagation(); e.preventDefault()
            const inCart = cartItems.find(i => i.productId === p.id)?.quantity ?? 0
            if (inCart >= p.availableStock) { toast.error('Stokta yeterli ürün yok'); return }
            dispatch(addToCart({ productId: p.id, name: p.name, slug: p.slug, brandName: p.brandName, basePrice: p.basePrice, unit: p.unit, minSellingQuantity: p.minSellingQuantity, availableStock: p.availableStock, primaryImageUrl: p.primaryImageUrl }))
            toast.success('Sepete eklendi')
          } : undefined}
          style={{
            width: '100%',
            background: p.availableStock <= 0 ? '#e5e7eb' : 'var(--primary)',
            color: p.availableStock <= 0 ? '#111' : '#fff',
            fontSize: 12, fontWeight: 700, padding: '8px 0',
            borderRadius: 'var(--r)', border: 'none',
            cursor: p.availableStock <= 0 ? 'not-allowed' : 'pointer',
            transition: '0.2s',
          }}>
          {p.availableStock <= 0 ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
      </div>
    </div>
  )
}
