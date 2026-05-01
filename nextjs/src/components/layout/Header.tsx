'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore'
import { openCart, closeCart, toggleCart } from '@/store/uiSlice'
import { markRead, markAllRead, setNotifications } from '@/store/notificationSlice'
import { notificationClientApi } from '@/lib/api'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Category, SiteSettings } from '@/types'

const MobileMenu = dynamic(() => import('./MobileMenu'), { ssr: false })
const CheckoutDrawer = dynamic(() => import('@/components/checkout/CheckoutDrawer'), { ssr: false })

interface Props {
  settings: SiteSettings
  categories: Category[]
  showSearch?: boolean
}

export default function Header({ settings, categories, showSearch = true }: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session } = useSession()
  const user = session?.user ?? null
  const { theme, setTheme } = useTheme()
  const cartItems = useAppSelector(s => s.cart.items)
  const cartHydrated = useAppSelector(s => s.cart.hydrated)
  const cartOpen = useAppSelector(s => s.ui.cartOpen)
  const notifications = useAppSelector(s => s.notifications.items)
  const unreadCount = notifications.filter(n => !n.isRead).length
  const isMobile = useIsMobile()

  const [searchVal, setSearchVal] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifLoaded, setNotifLoaded] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)

  const cartTotal = cartItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Bildirimler ilk kez açılınca yükle
  useEffect(() => {
    if (notifOpen && user && !notifLoaded) {
      notificationClientApi.listMy().then(items => {
        dispatch(setNotifications(items))
        setNotifLoaded(true)
      }).catch(() => {})
    }
  }, [notifOpen, user, notifLoaded, dispatch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) router.push(`/urunler?q=${encodeURIComponent(searchVal.trim())}`)
  }

  const isDark = theme === 'dark'

  return (
    <header style={{ background: isDark ? '#1a2333' : 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 8px rgba(0,0,0,.07)' }}>
      {mobileMenuOpen && <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={categories} />}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px', height: isMobile ? 58 : 68, display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Hamburger (mobile) */}
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Menü"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px 8px 0', display: 'flex', alignItems: 'center', color: 'var(--text)', fontSize: 24, lineHeight: 1 }}>
            ☰
          </button>
        )}

        {/* Logo + Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: isMobile ? 8 : 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 9 }}>
            <Image src="/logo.svg" alt="Logo" width={isMobile ? 36 : 44} height={isMobile ? 36 : 44} style={{ objectFit: 'contain', flexShrink: 0 }} priority />
            <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 900, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--primary)' }}>{settings.brandPart1}</span>
              <span style={{ color: 'var(--accent)' }}>{settings.brandPart2}</span>
            </div>
          </Link>
          {!isMobile && (
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} title="Tema değiştir"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', marginLeft: 4, fontSize: 24, lineHeight: 1 }}>
              {isDark ? '🌙' : '☀️'}
            </button>
          )}
        </div>

        {/* Search */}
        {showSearch && !isMobile && (
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 0, position: 'relative', margin: '0 16px' }}>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Ürün, kategori veya marka ara..." autoComplete="off"
              style={{ width: '100%', height: 42, border: '2px solid var(--border)', borderRadius: 'var(--r)', background: isDark ? '#1f2937' : 'var(--bg3)', color: 'var(--text)', fontSize: 14, padding: '0 48px 0 16px', outline: 'none', transition: '0.2s', fontFamily: 'inherit' }} />
            <button type="submit" style={{ position: 'absolute', right: 0, top: 0, width: 44, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', borderRadius: '0 var(--r) var(--r) 0', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>
          </form>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 'auto' }}>

          {/* Notifications */}
          {user && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setNotifOpen(o => !o) }}
                style={{ position: 'relative', background: 'none', height: 42, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 20, padding: '0 10px', border: 'none', cursor: 'pointer' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', background: 'var(--primary)', color: '#fff' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 320, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow-lg)', zIndex: 600, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px 9px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Bildirimler {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--primary)' }}>({unreadCount})</span>}</span>
                    {unreadCount > 0 && (
                      <span onClick={() => { notificationClientApi.markAllRead().catch(() => {}); dispatch(markAllRead()) }} style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }}>Tümünü okundu işaretle</span>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Bildirim yok</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.id} onClick={() => { if (!n.isRead) { notificationClientApi.markRead(n.id).catch(() => {}); dispatch(markRead(n.id)) } }}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 15px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : 'rgba(220,38,38,.04)', cursor: n.isRead ? 'default' : 'pointer' }}>
                        <span style={{ fontSize: 18, width: 34, height: 34, background: 'var(--bg3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.type === 'ORDER_ACTION' ? '🛒' : n.type === 'ORDER' ? '📦' : '🔔'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, marginBottom: 2, fontWeight: n.isRead ? 400 : 600 }}>{n.message}</p>
                          <small style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                        {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    ))}
                  </div>
                  {notifications.length > 10 && (
                    <div style={{ padding: '9px 15px', textAlign: 'center', fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
                      <Link href="/profil" onClick={() => setNotifOpen(false)} style={{ color: 'var(--primary)', fontWeight: 600 }}>Tümünü profilde gör</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Login / Profile */}
          {!isMobile && (user ? (
            <Link href="/profil" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: 'var(--primary)', padding: '0 10px', height: 42, borderRadius: 'var(--r)' }}>👤 <span>{user.firstName}</span></Link>
          ) : (
            <Link href="/giris" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'var(--text2)', padding: '0 10px', height: 42, borderRadius: 'var(--r)' }}>👤 <span>Üye Girişi</span></Link>
          ))}

          {/* Cart Button */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => dispatch(cartOpen ? closeCart() : openCart())}
              style={{ position: 'relative', background: cartOpen ? 'var(--primary)' : 'none', height: 42, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cartOpen ? '#fff' : 'var(--text)', padding: isMobile ? '0 10px' : '0 12px', gap: 6, border: '2px solid var(--border)', cursor: 'pointer', transition: '0.2s' }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              {!isMobile && <span style={{ fontSize: 13.5, fontWeight: 700 }}>₺{cartTotal.toFixed(2)}</span>}
              {cartHydrated && cartCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{cartCount}</span>
              )}
            </button>
            {cartOpen && <CheckoutDrawer isMobile={isMobile} onClose={() => dispatch(closeCart())} />}
          </div>
        </div>
      </div>
    </header>
  )
}
