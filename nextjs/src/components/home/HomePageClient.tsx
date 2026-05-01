'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import ProductCard from '@/components/product/ProductCard'
import type { FeaturedProduct, CampaignResponse, SiteSettings } from '@/types'

interface Props {
  featured: FeaturedProduct[]
  deals: FeaturedProduct[]
  bestSellers: FeaturedProduct[]
  newArrivals: FeaturedProduct[]
  slides: CampaignResponse[]
  settings: SiteSettings
}

const WHY_CARDS = [
  { icon: '🏷️', title: 'Toptan Fiyat Garantisi', desc: 'Tüm ürünlerde en düşük toptan fiyat garantisi. Fiyat farkı varsa iade ederiz.' },
  { icon: '🚚', title: 'Hızlı Kargo', desc: 'Siparişleriniz 1-3 iş günü içinde kapınızda. 750 ₺ üzeri ücretsiz kargo.' },
  { icon: '🔒', title: 'Güvenli Ödeme', desc: 'SSL sertifikası ile şifreli ödeme. iyzico ve PayTR altyapısı.' },
  { icon: '📞', title: '7/24 Destek', desc: 'WhatsApp ve e-posta ile 7/24 müşteri desteği. Hızlı yanıt garantisi.' },
]

function hasStock(p: FeaturedProduct): boolean {
  const actives = (p.variants ?? []).filter(v => v.isActive)
  if (actives.length >= 2) return actives.some(v => v.availableStock > 0)
  return p.availableStock > 0
}

function sortByStock(list: FeaturedProduct[]): FeaturedProduct[] {
  return [...list].sort((a, b) => Number(hasStock(b)) - Number(hasStock(a)))
}

function SectionHead({ title, link }: { title: string; link?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.3 }}>{title}</h2>
      {link && <Link href={link} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>Tümünü Gör →</Link>}
    </div>
  )
}

export default function HomePageClient({ featured, deals, bestSellers, newArrivals, slides, settings }: Props) {
  const isMobile = useIsMobile()
  const [slideIdx, setSlideIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const products = sortByStock(featured)
  const dealsList = sortByStock(deals)
  const bsList = sortByStock(bestSellers)
  const newList = sortByStock(newArrivals)

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
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

      {/* Campaign Carousel */}
      {slides.length > 0 && (
        <div id="kampanyalar" style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 12px 0' : '16px 24px 0', scrollMarginTop: 80 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, width: '100%' }}>
            <div style={{ display: 'flex', width: '100%', transition: 'transform 0.45s cubic-bezier(.4,0,.2,1)', transform: `translateX(-${slideIdx * 100}%)` }}>
              {slides.map((s, i) => (
                <div key={i} style={{
                  flex: '0 0 100%', width: '100%', minWidth: 0, height: isMobile ? 200 : 320,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '0 20px' : '0 80px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
                  background: s.bgColor || 'var(--secondary)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle at 20% 50%,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                  <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.95)', marginBottom: 16 }}>{s.badge}</div>
                    <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: -0.3 }}>{s.title}</h2>
                    {s.description && <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', lineHeight: 1.55, marginBottom: 22 }}>{s.description}</p>}
                  </div>
                  <div style={{ position: 'relative', zIndex: 1, fontSize: isMobile ? 64 : 110, lineHeight: 1, flexShrink: 0 }}>{s.emoji}</div>
                  {s.sticker && (
                    <div style={{ position: 'absolute', top: 20, right: 80, background: '#fbbf24', color: '#000', fontSize: 13, fontWeight: 900, padding: '6px 14px', borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,.2)', zIndex: 2, transform: 'rotate(3deg)' }}>{s.sticker}</div>
                  )}
                </div>
              ))}
            </div>

            {slides.length > 1 && <>
              <button onClick={() => goSlide((slideIdx - 1 + slides.length) % slides.length)} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>‹</button>
              <button onClick={() => goSlide((slideIdx + 1) % slides.length)} style={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>›</button>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7, zIndex: 10 }}>
                {slides.map((_, i) => <div key={i} onClick={() => goSlide(i)} style={{ width: i === slideIdx ? 24 : 8, height: 8, borderRadius: i === slideIdx ? 4 : '50%', background: i === slideIdx ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer', transition: '0.2s' }} />)}
              </div>
            </>}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>

        {dealsList.length >= 1 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="🔥 Fırsat Ürünleri" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {dealsList.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
          <SectionHead title="⭐ Öne Çıkan Ürünler" link="/urunler" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
            {products.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

        {bsList.length >= 2 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="📈 En Çok Satan Ürünler" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {bsList.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {newList.length >= 2 && (
          <div style={{ padding: isMobile ? '28px 0 0' : '44px 0 0' }}>
            <SectionHead title="🆕 Yeni Eklenen Ürünler" link="/urunler" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16 }}>
              {newList.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* Why Section */}
        <div style={{ padding: isMobile ? '32px 0 36px' : '48px 0 52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: -0.3 }}>
              Neden {settings.brandPart1}{settings.brandPart2}?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 18 }}>
            {WHY_CARDS.map(w => (
              <div key={w.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '26px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>{w.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{w.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
