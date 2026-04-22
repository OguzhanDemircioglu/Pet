import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { useTheme } from '../context/ThemeContext'

const ROOT_CATEGORIES = [
  { category_name: 'Kedi', emoji: '🐱', category_slug: 'kedi' },
  { category_name: 'Köpek', emoji: '🐶', category_slug: 'kopek' },
  { category_name: 'Kuş', emoji: '🐦', category_slug: 'kus' },
  { category_name: 'Akvaryum', emoji: '🐟', category_slug: 'akvaryum' },
  { category_name: 'Kemirgen', emoji: '🐹', category_slug: 'kemirgen' },
  { category_name: 'Sürüngenler', emoji: '🦎', category_slug: 'surungenler' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: Props) {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const allCategories = useSelector((s: RootState) => s.categories.categories)
  const catalogLoaded = useSelector((s: RootState) => s.products.catalogLoaded)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const getSubs = (rootSlug: string) =>
    catalogLoaded ? allCategories.filter(c => c.parent_slug === rootSlug) : []

  const go = (path: string) => { navigate(path); onClose() }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          zIndex: 900, animation: 'fadeIn 0.18s ease',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '85%', maxWidth: 340,
        background: 'var(--bg2)', zIndex: 901,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInLeft 0.22s ease',
        boxShadow: '8px 0 32px rgba(0,0,0,.2)',
      }}>
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>
            <span style={{ color: 'var(--primary)' }}>Pet</span>
            <span style={{ color: 'var(--accent)' }}>Toptan</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 26, color: 'var(--text2)',
            cursor: 'pointer', lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {user ? (
            <div onClick={() => go('/profil')} style={menuItem}>
              👤 <span>Profilim ({user.firstName})</span>
            </div>
          ) : (
            <div onClick={() => go('/login')} style={menuItem}>
              👤 <span>Üye Girişi</span>
            </div>
          )}

          <div onClick={toggleTheme} style={menuItem}>
            {theme === 'dark' ? '🌙' : '☀️'} <span>Tema: {theme === 'dark' ? 'Koyu' : 'Açık'}</span>
          </div>

          <div style={sectionTitle}>KATEGORİLER</div>
          {ROOT_CATEGORIES.map(cat => {
            const subs = getSubs(cat.category_slug)
            return (
              <div key={cat.category_slug}>
                <div
                  onClick={() => go(`/urunler?slug=${cat.category_slug}`)}
                  style={{ ...menuItem, fontWeight: 700 }}
                >
                  {cat.emoji} <span>{cat.category_name}</span>
                </div>
                {subs.map(sub => (
                  <div
                    key={sub.category_id}
                    onClick={() => go(`/urunler?slug=${sub.category_slug}`)}
                    style={{ ...menuItem, paddingLeft: 38, fontSize: 13, color: 'var(--text2)' }}
                  >
                    {sub.emoji} <span>{sub.category_name}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {user && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <Link to="/profil" onClick={onClose} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
              Siparişlerim, Adreslerim →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}

const menuItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 18px', fontSize: 14,
  color: 'var(--text)', cursor: 'pointer',
  borderBottom: '1px solid var(--border)',
}

const sectionTitle: React.CSSProperties = {
  padding: '14px 18px 6px', fontSize: 11, fontWeight: 800,
  color: 'var(--text3)', letterSpacing: 0.8,
}
