import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import type { FeaturedProduct } from '../types'
import type { RootState, AppDispatch } from '../store'
import { fetchHomepageThunk } from '../store/campaignSlice'
import { addToCart } from '../store/cartSlice'
import { imgUrl } from '../api/productApi'
import toast from 'react-hot-toast'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSiteSettings } from '../hooks/useSiteSettings'

const WHY_CARDS = [
  { icon: '🏷️', title: 'Toptan Fiyat Garantisi', desc: 'Tüm ürünlerde en düşük toptan fiyat garantisi. Fiyat farkı varsa iade ederiz.' },
  { icon: '🚚', title: 'Hızlı Kargo', desc: 'Siparişleriniz 1-3 iş günü içinde kapınızda. 750 ₺ üzeri ücretsiz kargo.' },
  { icon: '🔒', title: 'Güvenli Ödeme', desc: 'SSL sertifikası ile şifreli ödeme. iyzico ve PayTR altyapısı.' },
  { icon: '📞', title: '7/24 Destek', desc: 'WhatsApp ve e-posta ile 7/24 müşteri desteği. Hızlı yanıt garantisi.' },
]

function ProductCard({ p }: { p: FeaturedProduct }) {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const cartItems = useSelector((s: RootState) => s.cart.items)
  const BG_COLORS = [
    'linear-gradient(135deg,#fce7f3,#fdf2f8)',
    'linear-gradient(135deg,#dbeafe,#eff6ff)',
    'linear-gradient(135deg,#dcfce7,#f0fdf4)',
    'linear-gradient(135deg,#fef3c7,#fffbeb)',
    'linear-gradient(135deg,#f3e8ff,#faf5ff)',
    'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
  ]
  const bg = BG_COLORS[p.name.charCodeAt(0) % BG_COLORS.length]
  const activeVariants = (p.variants ?? []).filter(v => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder)
  const hasVariants = activeVariants.length >= 2
  const [selectedId, setSelectedId] = useState<number | null>(hasVariants ? activeVariants[0].id : null)
  const selectedVariant = hasVariants ? (activeVariants.find(v => v.id === selectedId) ?? activeVariants[0]) : null

  const effectivePrice = selectedVariant ? selectedVariant.price : p.basePrice
  const effectiveStock = selectedVariant ? selectedVariant.availableStock : p.availableStock

  return (
    <div onClick={() => navigate(`/urun/${p.slug}`)} className="prod-card" style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', overflow: 'hidden', transition: '0.22s',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 165, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative', flexShrink: 0, background: bg }}>
        {p.primaryImageUrl
          ? <img src={imgUrl(p.primaryImageUrl)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
          : <span>🐾</span>
        }
        {p.activeDiscount && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'var(--primary)', color: '#fff',
            fontSize: 12, fontWeight: 900, padding: '3px 9px',
            borderRadius: 20, boxShadow: '0 2px 8px rgba(220,38,38,.4)',
            letterSpacing: 0.3,
          }}>
            {p.activeDiscount.label} İndirim
          </div>
        )}
      </div>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{p.brandName}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8, flex: 1 }}>{p.name}</div>

        <div style={{ marginBottom: 10 }}>
          {p.activeDiscount && !hasVariants ? (() => {
            const disc = p.activeDiscount!
            const newPrice = disc.discountType === 'PERCENT'
              ? p.basePrice * (1 - disc.discountValue / 100)
              : p.basePrice - disc.discountValue
            return (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'line-through' }}>₺{p.basePrice.toFixed(2)}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>₺{newPrice.toFixed(2)}</div>
              </div>
            )
          })() : (
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>₺{effectivePrice.toFixed(2)}</div>
          )}
        </div>

        {/* Variant listesi — sadece 2+ varyant varsa göster */}
        {hasVariants && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {activeVariants.map(v => {
              const isSel = selectedVariant?.id === v.id
              const outOfStock = v.availableStock <= 0
              return (
                <button
                  key={v.id}
                  onClick={e => { e.stopPropagation(); if (!outOfStock) setSelectedId(v.id) }}
                  disabled={outOfStock}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    border: isSel ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--primary-bg)' : 'var(--bg)',
                    cursor: outOfStock ? 'not-allowed' : 'pointer',
                    opacity: outOfStock ? 0.5 : 1,
                    transition: '0.15s',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: isSel ? 'var(--primary)' : 'var(--text2)' }}>
                    {v.label}{outOfStock && ' · Tükendi'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: isSel ? 'var(--primary)' : 'var(--text)' }}>
                    ₺{v.price.toFixed(2)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        <button
          disabled={effectiveStock <= 0}
          onClick={effectiveStock > 0 ? e => {
            e.stopPropagation(); e.preventDefault()
            const inCart = cartItems.find(i => i.productId === p.id && (i.variantId ?? undefined) === (selectedVariant?.id ?? undefined))?.quantity ?? 0
            if (inCart >= effectiveStock) { toast.error('Stokta yeterli ürün yok'); return }
            dispatch(addToCart({
              productId: p.id, name: p.name, slug: p.slug, brandName: p.brandName,
              basePrice: effectivePrice, unit: p.unit,
              availableStock: effectiveStock, primaryImageUrl: p.primaryImageUrl,
              ...(selectedVariant ? { variantId: selectedVariant.id, variantLabel: selectedVariant.label } : {}),
            }))
            toast.success('Sepete eklendi')
          } : undefined}
          style={{
            width: '100%',
            background: effectiveStock <= 0 ? '#e5e7eb' : 'var(--primary)',
            color: effectiveStock <= 0 ? '#111' : '#fff',
            fontSize: 13, fontWeight: 700, padding: '9px 0',
            borderRadius: 'var(--r)', border: 'none',
            cursor: effectiveStock <= 0 ? 'not-allowed' : 'pointer',
            transition: '0.2s',
          }}>
          {effectiveStock <= 0 ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [slideIdx, setSlideIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const productsRaw = useSelector((s: RootState) => s.products.featured)
  const bestSellersRaw = useSelector((s: RootState) => s.products.bestSellers)
  const newArrivalsRaw = useSelector((s: RootState) => s.products.newArrivals)
  const dealsRaw = useSelector((s: RootState) => s.products.deals)
  const siteSettings = useSiteSettings()

  // Stokta olmayan ürünler en sona (varyantlı ürünlerde en az bir varyantta stok varsa "stokta" sayılır)
  const hasStock = (p: FeaturedProduct) => {
    const actives = (p.variants ?? []).filter(v => v.isActive)
    if (actives.length >= 2) return actives.some(v => v.availableStock > 0)
    return p.availableStock > 0
  }
  const sortByStock = (list: FeaturedProduct[]) =>
    [...list].sort((a, b) => Number(hasStock(b)) - Number(hasStock(a)))

  const products = sortByStock(productsRaw)
  const bestSellers = sortByStock(bestSellersRaw)
  const newArrivals = sortByStock(newArrivalsRaw)
  const deals = sortByStock(dealsRaw)
  const loading = useSelector((s: RootState) => !s.campaigns.loaded || s.campaigns.loading)
  const slides = useSelector((s: RootState) => s.campaigns.slides)
  const isMobile = useIsMobile()

  useEffect(() => {
    dispatch(fetchHomepageThunk())
  }, [dispatch])

  // /#kampanyalar ile gelinirse carousel'e scroll et
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
  }, [])

  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [slides.length])

  const goSlide = (i: number) => {
    setSlideIdx(i)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlideIdx(x => (x + 1) % slides.length), 4500)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      {/* Campaign Carousel */}
      {slides.length > 0 && <div id="kampanyalar" style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 12px 0' : '16px 24px 0', scrollMarginTop: 80 }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, width: '100%' }}>
        <div style={{ display: 'flex', width: '100%', transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)', transform: `translateX(-${slideIdx * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} style={{
              flex: '0 0 100%', width: '100%', minWidth: 0, height: isMobile ? 200 : 320,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0 20px' : '0 80px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
              background: s.bg,
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
                {s.sourceType !== 'discount' && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.95)', marginBottom: 16 }}>{s.badge}</div>}
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.3, whiteSpace: 'pre-line' }}>{s.title}</h2>
                {s.sourceType === 'info' && s.sub && (
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', lineHeight: 1.55, marginBottom: 22 }}>{s.sub}</p>
                )}
              </div>
              <div style={{ position: 'relative', zIndex: 1, fontSize: isMobile ? 64 : 110, lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.2))', flexShrink: 0, userSelect: 'none' }}>{s.emoji}</div>
              {s.sticker && (
                <div style={{ position: 'absolute', top: 20, right: 80, background: '#fbbf24', color: '#000', fontSize: 13, fontWeight: 900, padding: '6px 14px', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,.2)', zIndex: 2, transform: 'rotate(3deg)' }}>{s.sticker}</div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => goSlide((slideIdx - 1 + slides.length) % slides.length)} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>‹</button>
        <button onClick={() => goSlide((slideIdx + 1) % slides.length)} style={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>›</button>

        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7, zIndex: 10 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goSlide(i)} style={{ width: i === slideIdx ? 24 : 8, height: 8, borderRadius: i === slideIdx ? 4 : '50%', background: i === slideIdx ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: '0.2s' }} />
          ))}
        </div>
      </div>
      </div>}

      {/* Page Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>

        {/* Fırsat Ürünleri — indirimde olan ürünler */}
        {deals.length >= 1 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="🔥 Fırsat Ürünleri" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {deals.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Featured Products */}
        <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
          <SectionHead title="Öne Çıkan Ürünler" link="/urunler" />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>Yükleniyor...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>

        {/* Best Sellers */}
        {bestSellers.length >= 2 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="En Çok Satan Ürünler" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {bestSellers.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* New Arrivals */}
        {newArrivals.length >= 2 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="Yeni Eklenen Ürünler" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {newArrivals.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Why Section */}
        <div style={{ padding: isMobile ? '32px 0 36px' : '48px 0 52px' }}>
          <SectionHead title={`Neden ${siteSettings.brandPart1}${siteSettings.brandPart2}?`} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 18 }}>
            {WHY_CARDS.map(w => (
              <div key={w.title} className="why-card" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '26px 20px', textAlign: 'center', transition: '0.2s' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>{w.icon}</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 7 }}>{w.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .cat-card:hover { transform: translateY(-4px) !important; box-shadow: var(--shadow) !important; border-color: rgba(220,38,38,.25) !important; }
        .why-card:hover { border-color: var(--primary) !important; box-shadow: var(--shadow) !important; }
        .prod-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.11) !important; transform: translateY(-3px) !important; border-color: var(--primary) !important; }
      `}</style>
    </div>
  )
}

function SectionHead({ title, link }: { title: string; link?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
      <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', position: 'relative', paddingLeft: 14 }}>
        <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 4, height: 22, background: 'var(--primary)', borderRadius: 2 }} />
        {title}
      </h2>
      {link && <Link to={link} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--primary)' }}>Tümünü Gör →</Link>}
    </div>
  )
}
