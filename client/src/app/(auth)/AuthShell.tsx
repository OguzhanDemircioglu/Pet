'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import './auth-mockup.css'

interface Slide {
  icon: React.ReactNode
  body: React.ReactNode
}

const MailSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const SLIDES: Slide[] = [
  {
    icon: <MailSvg />,
    body: (
      <>
        Bize ulaşın: <a href="mailto:info@pettoptan.com.tr">info@pettoptan.com.tr</a>
      </>
    ),
  },
  {
    icon: <span aria-hidden="true">💬</span>,
    body: (
      <>
        <strong>WhatsApp:</strong> +90 500 000 00 00 · Haftaiçi 09:00–18:00
      </>
    ),
  },
  {
    icon: <span aria-hidden="true">🚚</span>,
    body: 'Toptan B2B fiyatları, hızlı sevkiyat, KVKK uyumlu',
  },
]

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000)
    return () => window.clearInterval(id)
  }, [])

  const isDark = mounted && (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <div className="mlogin">
      {/* INFO BAR */}
      <div className="info-bar">
        <div className="info-bar-inner" aria-live="polite">
          {SLIDES.map((s, i) => (
            <div key={i} className={'info-bar-slide' + (slide === i ? ' active' : '')}>
              {s.icon}
              <span>{s.body}</span>
            </div>
          ))}
          <div className="info-bar-dot-wrap">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slayt ${i + 1}`}
                onClick={() => setSlide(i)}
                className={'info-bar-dot' + (slide === i ? ' active' : '')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-wrap">
            <Link href="/" className="logo" aria-label="PetToptan anasayfa">
              <span className="logo-icon-fallback" aria-hidden="true">🐾</span>
              <span className="logo-text">
                <span className="pet-text">Pet</span>
                <span className="toptan-text">Toptan</span>
              </span>
            </Link>
            <button
              type="button"
              className="theme-toggle"
              title="Tema değiştir"
              aria-label="Tema değiştir"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              suppressHydrationWarning
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN — split layout */}
      <main className="page-wrap">
        <div className="auth-split">
          {/* SOL PANEL — sadece desktop */}
          <aside className="auth-side" aria-hidden="true">
            <div className="auth-floats">
              <span className="auth-float auth-float-1">🐾</span>
              <span className="auth-float auth-float-2">🐱</span>
              <span className="auth-float auth-float-3">🐶</span>
              <span className="auth-float auth-float-4">🐾</span>
              <span className="auth-float auth-float-5">🐦</span>
            </div>

            <div className="auth-brand">
              <div className="auth-brand-mark">🐾</div>
              <div className="auth-brand-text">
                <span className="auth-pet">Pet</span>
                <span className="auth-toptan">Toptan</span>
              </div>
            </div>

            <h1 className="auth-headline">
              Türkiye’nin <em>toptan</em> pet ürünleri ağına hoş geldin.
            </h1>
            <p className="auth-sublede">
              Pet shop, klinik ve bayilere özel B2B fiyatlar. Tek hesaptan
              binlerce SKU’ya ulaş, sipariş geçmişini ve bayi ıskontonu yönet.
            </p>

            <div className="auth-perks">
              <div className="auth-perk">
                <span className="auth-perk-icon">⚡</span>
                <span>24-48 saatte Türkiye geneli sevkiyat</span>
              </div>
              <div className="auth-perk">
                <span className="auth-perk-icon">🏷️</span>
                <span>Kademeli toptan iskontolar, KDV dahil net fiyat</span>
              </div>
              <div className="auth-perk">
                <span className="auth-perk-icon">🛡️</span>
                <span>iyzico altyapısı, 3D Secure, KVKK uyumlu</span>
              </div>
            </div>

            <div className="auth-stats">
              <div className="auth-stat">
                <span className="auth-stat-num">5.000+</span>
                <span className="auth-stat-label">SKU</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-num">300+</span>
                <span className="auth-stat-label">Bayi</span>
              </div>
              <div className="auth-stat">
                <span className="auth-stat-num">%30</span>
                <span className="auth-stat-label">İskonto</span>
              </div>
            </div>
          </aside>

          {/* SAĞ — form alanı (children) */}
          <section className="auth-form-wrap">
            <div className="login-wrap">{children}</div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-text">
          © {new Date().getFullYear()} PetToptan ·{' '}
          <a href="#">Gizlilik Politikası</a> ·{' '}
          <a href="#">Kullanım Koşulları</a>
        </div>
      </footer>
    </div>
  )
}
