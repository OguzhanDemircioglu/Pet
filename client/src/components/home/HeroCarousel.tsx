'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Slide {
  className: string
  badge: string
  title: string
  sub: string
  cta: { label: string; href: string }
  visual: string
  sticker?: string
}

const SLIDES: Slide[] = [
  {
    className: 'pt-slide-1',
    badge: '🔥 Sınırlı Süreli',
    title: 'Toptan Pet Ürünlerinde %30’a Varan İndirim',
    sub: 'Mama, kum, oyuncak, aksesuar — tek noktadan tedarik. KDV dahil net fiyat.',
    cta: { label: 'Kampanyalı Ürünler', href: '/kampanya' },
    visual: '🐶',
    sticker: 'YENİ',
  },
  {
    className: 'pt-slide-2',
    badge: '📦 B2B Dostu',
    title: 'Bayi & Pet Shop’lara Özel Toptan Fiyat',
    sub: 'Tek bir hesaptan binlerce SKU’ya erişin. Hızlı kargo, esnek ödeme.',
    cta: { label: 'Üye Ol', href: '/kayit' },
    visual: '📦',
  },
  {
    className: 'pt-slide-3',
    badge: '⭐ Premium Markalar',
    title: 'Royal Canin, Hill’s, Pro Plan ve daha fazlası',
    sub: 'Orijinal ürün garantisi. Doğrudan distribütörden sevkiyat.',
    cta: { label: 'Markaları Gör', href: '/markalar' },
    visual: '🏆',
  },
  {
    className: 'pt-slide-4',
    badge: '🚚 Hızlı Kargo',
    title: 'Türkiye Geneli 24-48 Saatte Kapınızda',
    sub: '500₺ üzeri siparişlere ücretsiz kargo. Anlaşmalı kargo şirketleri.',
    cta: { label: 'Kargo Detayları', href: '/kargo' },
    visual: '🚚',
  },
]

export default function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 6000)
    return () => window.clearInterval(id)
  }, [paused])

  const next = () => setActive((i) => (i + 1) % SLIDES.length)
  const prev = () => setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length)

  return (
    <section
      className="pt-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
      tabIndex={0}
      aria-label="Kampanya banner'ları"
      aria-roledescription="carousel"
    >
      <div
        ref={trackRef}
        className="pt-hero-track"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`pt-hero-slide ${s.className}${i === active ? ' active' : ''}`}
            aria-hidden={i !== active}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${SLIDES.length}`}
          >
            <div className="pt-hero-pattern" aria-hidden="true" />
            {s.sticker && <div className="pt-hero-sticker" aria-hidden="true">{s.sticker}</div>}
            <div className="pt-hero-content">
              <span className="pt-hero-badge">{s.badge}</span>
              <h2 className="pt-hero-title">{s.title}</h2>
              <p className="pt-hero-sub">{s.sub}</p>
              <Link href={s.cta.href} className="pt-hero-btn">
                {s.cta.label} →
              </Link>
            </div>
            <div className="pt-hero-visual" aria-hidden="true">{s.visual}</div>
          </div>
        ))}
      </div>

      <button type="button" className="pt-hero-btn-nav pt-hero-prev" onClick={prev} aria-label="Önceki slayt">
        ‹
      </button>
      <button type="button" className="pt-hero-btn-nav pt-hero-next" onClick={next} aria-label="Sonraki slayt">
        ›
      </button>
      <div className="pt-hero-dots" role="tablist">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`pt-hero-dot${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slayt ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
