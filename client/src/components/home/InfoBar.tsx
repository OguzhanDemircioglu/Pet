'use client'
import { useEffect, useState } from 'react'

const slides = [
  { icon: '✉️', text: 'Bize ulaşın:', link: { href: 'mailto:info@pettoptan.com.tr', label: 'info@pettoptan.com.tr' } },
  { icon: '💬', text: 'WhatsApp:', link: { href: 'https://wa.me/905000000000', label: '+90 500 000 00 00' }, suffix: ' · Haftaiçi 09:00–18:00' },
  { icon: '🚚', text: '500₺ ve üzeri siparişlere ücretsiz kargo' },
  { icon: '🔒', text: 'KVKK uyumlu güvenli alışveriş — iyzico ile ödeme' },
]

export default function InfoBar() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 5000)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div className="pt-info-bar" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="pt-info-bar-inner" aria-live="polite">
        {slides.map((s, i) => (
          <div key={i} className={`pt-info-bar-slide${i === active ? ' active' : ''}`}>
            <span aria-hidden="true">{s.icon}</span>
            <span>
              {s.text}
              {s.link && (
                <>
                  {' '}
                  <a href={s.link.href} target={s.link.href.startsWith('http') ? '_blank' : undefined} rel="noopener">
                    {s.link.label}
                  </a>
                </>
              )}
              {s.suffix}
            </span>
          </div>
        ))}
        <div className="pt-info-bar-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pt-info-bar-dot${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Bilgi ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
