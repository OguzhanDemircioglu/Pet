import {useEffect, useRef, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {useTheme} from '../context/ThemeContext'
import {useSelector} from 'react-redux'
import type {RootState} from '../store'

interface HeaderProps {
  showSearch?: boolean
}

export default function Header({ showSearch = true }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const [searchVal, setSearchVal] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/urunler?q=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  const isDark = theme === 'dark'

  return (
    <header style={{
      background: isDark ? '#1a2333' : 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      boxShadow: '0 2px 8px rgba(0,0,0,.07)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}>

        {/* Logo + Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo.svg" alt="OffCats" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--primary)' }}>OFF</span>
              <span style={{ color: 'var(--accent)' }}>Cats</span>
            </div>
          </Link>
          <button onClick={toggleTheme} title="Tema değiştir" style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 5px',
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            transition: '0.2s',
            marginLeft: 4,
            lineHeight: 1,
          }}>
            <span style={{ fontSize: 12, lineHeight: 1.15 }}>{isDark ? '🌙' : '☀️'}</span>
            <span style={{ fontSize: 16, lineHeight: 1.1 }}>{isDark ? '😴' : '🐱'}</span>
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 0, position: 'relative', margin: '0 16px' }}>
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Ürün, kategori veya marka ara..."
              autoComplete="off"
              style={{
                width: '100%',
                height: 42,
                border: '2px solid var(--border)',
                borderRadius: 'var(--r)',
                background: isDark ? '#1f2937' : 'var(--bg3)',
                color: 'var(--text)',
                fontSize: 14,
                padding: '0 48px 0 16px',
                outline: 'none',
                transition: '0.2s',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" style={{
              position: 'absolute',
              right: 0, top: 0,
              width: 44, height: 42,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--primary)',
              borderRadius: '0 var(--r) var(--r) 0',
              color: '#fff',
              fontSize: 17,
              border: 'none',
              cursor: 'pointer',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: showSearch ? 8 : 'auto' }}>

          {/* Notifications (only if logged in) */}
          {user && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={(e) => { e.stopPropagation(); setNotifOpen(o => !o) }}
                style={{
                  position: 'relative', background: 'none', height: 42,
                  borderRadius: 'var(--r)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text2)', fontSize: 20,
                  padding: '0 10px', border: 'none', cursor: 'pointer',
                }}>
                🔔
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  fontSize: 10, fontWeight: 700, minWidth: 17, height: 17,
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 3px',
                  background: 'var(--primary)', color: '#fff',
                }}>3</span>
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 320, background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r2)', boxShadow: 'var(--shadow-lg)', zIndex: 600,
                  overflow: 'hidden',
                  animation: 'dropIn 0.18s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px 9px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Bildirimler</span>
                    <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }}>Tümünü okundu işaretle</span>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {[
                      { emoji: '📦', text: 'Siparişiniz hazırlanıyor — #PET20240042', time: '2 saat önce', unread: true },
                      { emoji: '🏷️', text: 'Yeni indirim! — Royal Canin ürünlerinde %15 indirim', time: '5 saat önce', unread: true },
                      { emoji: '✅', text: 'Siparişiniz teslim edildi — #PET20240038', time: '2 gün önce', unread: false },
                    ].map((n, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        padding: '11px 15px', borderBottom: '1px solid var(--border)',
                        background: n.unread ? 'rgba(220,38,38,.04)' : 'transparent',
                      }}>
                        <span style={{
                          fontSize: 20, width: 34, height: 34, background: 'var(--bg3)',
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>{n.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, marginBottom: 2 }}>{n.text}</p>
                          <small style={{ fontSize: 11, color: 'var(--text3)' }}>{n.time}</small>
                        </div>
                        {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '9px 15px', textAlign: 'center', fontSize: 12, color: 'var(--text2)', background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
                    Son 30 günün bildirimleri gösteriliyor
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login / Profile */}
          {user ? (
            <Link to="/profil" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13.5, fontWeight: 700, color: 'var(--primary)',
              padding: '0 10px', height: 42, borderRadius: 'var(--r)',
              transition: '0.2s',
            }}>
              👤 <span>{user.firstName}</span>
            </Link>
          ) : (
            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13.5, fontWeight: 600, color: 'var(--text2)',
              padding: '0 10px', height: 42, borderRadius: 'var(--r)',
              transition: '0.2s',
            }}>
              👤 <span>Üye Girişi</span>
            </Link>
          )}


          {/* Cart */}
          <button style={{
            position: 'relative', background: 'none', height: 42,
            borderRadius: 'var(--r)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text)',
            padding: '0 12px', gap: 6, fontSize: 15,
            border: '2px solid var(--border)', cursor: 'pointer', transition: '0.2s',
          }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>₺0,00</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  )
}
