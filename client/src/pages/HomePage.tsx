import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import type { Product } from '../types'
import type { RootState, AppDispatch } from '../store'
import { fetchFeaturedProductsThunk } from '../store/productSlice'
import { fetchCategoriesThunk } from '../store/categorySlice'
import { fetchCampaignsThunk, fetchActiveDiscountsThunk } from '../store/campaignSlice'
import { addToCart } from '../store/cartSlice'
import { imgUrl } from '../api/productApi'
import toast from 'react-hot-toast'

const WHY_CARDS = [
  { icon: '🏷️', title: 'Toptan Fiyat Garantisi', desc: 'Tüm ürünlerde en düşük toptan fiyat garantisi. Fiyat farkı varsa iade ederiz.' },
  { icon: '🚚', title: 'Hızlı Kargo', desc: 'Siparişleriniz 1-3 iş günü içinde kapınızda. 750 ₺ üzeri ücretsiz kargo.' },
  { icon: '🔒', title: 'Güvenli Ödeme', desc: 'SSL sertifikası ile şifreli ödeme. iyzico ve PayTR altyapısı.' },
  { icon: '📞', title: '7/24 Destek', desc: 'WhatsApp ve e-posta ile 7/24 müşteri desteği. Hızlı yanıt garantisi.' },
]

function ProductCard({ p }: { p: Product }) {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const BG_COLORS = [
    'linear-gradient(135deg,#fce7f3,#fdf2f8)',
    'linear-gradient(135deg,#dbeafe,#eff6ff)',
    'linear-gradient(135deg,#dcfce7,#f0fdf4)',
    'linear-gradient(135deg,#fef3c7,#fffbeb)',
    'linear-gradient(135deg,#f3e8ff,#faf5ff)',
    'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
  ]
  const idx = p.name.charCodeAt(0) % BG_COLORS.length
  const bg = BG_COLORS[idx]
  const EMOJIS: Record<string, string> = { kedi: '🐱', kopek: '🐶', kus: '🐦', akvaryum: '🐟', kemirgen: '🐹', surungenler: '🦎' }
  const emoji = (p.categoryName && EMOJIS[p.categoryName.toLowerCase()]) || '🐾'

  return (
    <div onClick={() => navigate(`/urun/${p.slug}`)} className="prod-card" style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', overflow: 'hidden', transition: '0.22s',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 165, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative', flexShrink: 0, background: bg }}>
        {p.primaryImageUrl
          ? <img src={imgUrl(p.primaryImageUrl)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
          : <span>{emoji}</span>
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
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Min. {p.moq} {p.unit}</div>
          {p.activeDiscount ? (() => {
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
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>₺{p.basePrice.toFixed(2)}</div>
          )}
        </div>
        <button onClick={e => {
          e.stopPropagation(); e.preventDefault()
          dispatch(addToCart({ productId: p.id, name: p.name, slug: p.slug, brandName: p.brandName, basePrice: p.basePrice, unit: p.unit, moq: p.moq, primaryImageUrl: p.primaryImageUrl }))
          toast.success('Sepete eklendi')
        }} style={{
          width: '100%', background: 'var(--primary)', color: '#fff',
          fontSize: 13, fontWeight: 700, padding: '9px 0',
          borderRadius: 'var(--r)', border: 'none', cursor: 'pointer', transition: '0.2s',
        }}>Sepete Ekle</button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [slideIdx, setSlideIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const products = useSelector((s: RootState) => s.products.featured)
  const loading = useSelector((s: RootState) => s.products.loading)
  const slides = useSelector((s: RootState) => s.campaigns.slides)

  useEffect(() => {
    dispatch(fetchFeaturedProductsThunk())
    dispatch(fetchCategoriesThunk(false))
    dispatch(fetchCampaignsThunk())
    dispatch(fetchActiveDiscountsThunk())
  }, [dispatch])

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
      {slides.length > 0 && <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px 0' }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
        <div style={{ display: 'flex', transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)', transform: `translateX(-${slideIdx * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} style={{
              minWidth: '100%', height: 320,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 80px', position: 'relative', overflow: 'hidden', flexShrink: 0,
              background: s.bg,
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.95)', marginBottom: 16 }}>{s.badge}</div>
                <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.3, whiteSpace: 'pre-line' }}>{s.title}</h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', lineHeight: 1.55, marginBottom: 22 }}>{s.sub}</p>
                <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: s.btnColor, fontSize: 14, fontWeight: 700, padding: '11px 26px', borderRadius: 'var(--r)', boxShadow: '0 4px 14px rgba(0,0,0,.15)' }}>Hemen İncele →</a>
              </div>
              <div style={{ position: 'relative', zIndex: 1, fontSize: 110, lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.2))', flexShrink: 0, userSelect: 'none' }}>{s.emoji}</div>
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Category Cards */}
    {/*    <div style={{ padding: '44px 0 0' }}>
          <SectionHead title="Kategoriler" link="/urunler" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {CAT_CARDS.map(c => (
              <div key={c.slug} onClick={() => navigate(`/urunler?kategori=${c.slug}`)} className="cat-card" style={{ borderRadius: 'var(--r2)', padding: '24px 12px 18px', textAlign: 'center', cursor: 'pointer', transition: '0.22s', border: '2px solid transparent', background: c.bg }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 10, lineHeight: 1 }}>{c.emoji}</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{c.count}</div>
              </div>
            ))}
          </div>
        </div>*/}

        {/* Featured Products */}
        <div style={{ padding: '44px 0 0' }}>
          <SectionHead title="Öne Çıkan Ürünler" link="/urunler" />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>Yükleniyor...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>

        {/* Why Section */}
        <div style={{ padding: '48px 0 52px' }}>
          <SectionHead title={`Neden ${import.meta.env.VITE_BRAND_PART1}${import.meta.env.VITE_BRAND_PART2}?`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
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
