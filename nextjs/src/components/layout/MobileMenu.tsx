'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import type { Category } from '@/types'

const ROOT_CATEGORIES = [
  { category_name: 'Kedi',        emoji: '🐱', category_slug: 'kedi' },
  { category_name: 'Köpek',       emoji: '🐶', category_slug: 'kopek' },
  { category_name: 'Kuş',         emoji: '🐦', category_slug: 'kus' },
  { category_name: 'Akvaryum',    emoji: '🐟', category_slug: 'akvaryum' },
  { category_name: 'Kemirgen',    emoji: '🐹', category_slug: 'kemirgen' },
  { category_name: 'Sürüngenler', emoji: '🦎', category_slug: 'surungenler' },
]

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
}

export default function MobileMenu({ open, onClose, categories }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const getSubs = (rootSlug: string) =>
    categories.filter(c => c.parent_slug === rootSlug)

  const go = (path: string) => { router.push(path); onClose() }

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

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900, animation: 'fadeIn 0.18s ease' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: 340, background: 'var(--bg2)', zIndex: 901, display: 'flex', flexDirection: 'column', animation: 'slideInLeft 0.22s ease', boxShadow: '8px 0 32px rgba(0,0,0,.2)' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 900 }}>
            <span style={{ color: 'var(--primary)' }}>Pet</span>
            <span style={{ color: 'var(--accent)' }}>Toptan</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 26, color: 'var(--text2)', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {user ? (
            <div onClick={() => go('/profil')} style={menuItem}>
              👤 <span>Profilim ({user.firstName})</span>
            </div>
          ) : (
            <div onClick={() => go('/giris')} style={menuItem}>
              👤 <span>Üye Girişi</span>
            </div>
          )}

          <div onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={menuItem}>
            {theme === 'dark' ? '🌙' : '☀️'} <span>Tema: {theme === 'dark' ? 'Koyu' : 'Açık'}</span>
          </div>

          <div style={sectionTitle}>KATEGORİLER</div>
          {ROOT_CATEGORIES.map(cat => {
            const subs = getSubs(cat.category_slug)
            return (
              <div key={cat.category_slug}>
                <div onClick={() => go(`/urunler?slug=${cat.category_slug}`)} style={{ ...menuItem, fontWeight: 700 }}>
                  {cat.emoji} <span>{cat.category_name}</span>
                </div>
                {subs.map(sub => (
                  <div key={sub.category_id} onClick={() => go(`/urunler?slug=${sub.category_slug}`)}
                    style={{ ...menuItem, paddingLeft: 38, fontSize: 13, color: 'var(--text2)' }}>
                    {sub.emoji} <span>{sub.category_name}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {user && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/profil" onClick={onClose} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
              Siparişlerim, Adreslerim →
            </Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              Çıkış Yap
            </button>
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
