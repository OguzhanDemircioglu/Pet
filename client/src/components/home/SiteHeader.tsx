'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

export default function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [shrunk, setShrunk] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setShrunk(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  const isDark = mounted && theme === 'dark'

  return (
    <header className={`pt-header${shrunk ? ' shrunk' : ''}`}>
      <div className="pt-header-inner">
        <div className="pt-logo-wrap">
          <Link href="/" className="pt-logo" aria-label="PetToptan anasayfa">
            <span className="pt-logo-icon">
              <Image src="/logo.svg" alt="" width={44} height={44} priority />
            </span>
            <span className="pt-logo-text">
              <span className="pt-pet">Pet</span>
              <span className="pt-toptan">Toptan</span>
            </span>
            <span className="pt-logo-paw" aria-hidden="true">🐾</span>
          </Link>
          <button
            type="button"
            className="pt-theme-toggle"
            onClick={toggleTheme}
            title="Tema değiştir"
            aria-label="Tema değiştir"
            suppressHydrationWarning
          >
            <span className="pt-theme-w">{isDark ? '🌙' : '☀️'}</span>
            <span className="pt-theme-c">{isDark ? '🐈‍⬛' : '🐱'}</span>
          </button>
        </div>

        <form
          className="pt-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) {
              window.location.href = `/arama?q=${encodeURIComponent(query.trim())}`
            }
          }}
        >
          <input
            type="search"
            placeholder="Ürün, kategori veya marka ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Site içi arama"
          />
          <button type="submit" className="pt-search-btn" aria-label="Ara">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <div className="pt-header-actions">
          <button type="button" className="pt-icon-btn" aria-label="Bildirimler">
            <span aria-hidden="true">🔔</span>
            <span className="pt-icon-btn-label">Bildirim</span>
          </button>
          <Link href={session ? '/profil' : '/giris'} className="pt-icon-btn">
            <span aria-hidden="true">👤</span>
            <span className="pt-icon-btn-label">{session?.user ? 'Hesabım' : 'Giriş'}</span>
          </Link>
          <Link href="/sepet" className="pt-icon-btn pt-cart-btn" aria-label="Sepetim">
            <span aria-hidden="true">🛒</span>
            <span className="pt-cart-total">Sepet</span>
            <span className="pt-badge">0</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
