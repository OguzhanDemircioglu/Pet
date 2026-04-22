import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

// Ana kategoriler — DB'den bağımsız, sayfa açılır açılmaz görünür
const ROOT_CATEGORIES = [
  { category_name: 'Kedi',        emoji: '🐱', category_slug: 'kedi' },
  { category_name: 'Köpek',       emoji: '🐶', category_slug: 'kopek' },
  { category_name: 'Kuş',         emoji: '🐦', category_slug: 'kus' },
  { category_name: 'Akvaryum',    emoji: '🐟', category_slug: 'akvaryum' },
  { category_name: 'Kemirgen',    emoji: '🐹', category_slug: 'kemirgen' },
  { category_name: 'Sürüngenler', emoji: '🦎', category_slug: 'surungenler' },
]

export default function CategoryBar() {
  const navigate = useNavigate()
  const allCategories = useSelector((s: RootState) => s.categories.categories)
  const catalogLoaded = useSelector((s: RootState) => s.products.catalogLoaded)

  // Alt kategoriler catalog yüklendikten sonra parent_slug ile eşleştiriliyor
  const getSubs = (rootSlug: string) =>
    catalogLoaded
      ? allCategories.filter(c => c.parent_slug === rootSlug)
      : []

  return (
    <div className="mobile-hidden" style={{
      background: 'var(--secondary)',
      position: 'sticky',
      top: 68,
      zIndex: 190,
      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      overflow: 'visible',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: 46,
        overflow: 'visible',
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, flex: 1, overflow: 'visible' }}>
          {ROOT_CATEGORIES.map((cat) => {
            const subs = getSubs(cat.category_slug)
            return (
              <div key={cat.category_slug} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                className="cat-nav-item">
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '0 16px', height: '100%',
                    fontSize: 14, fontWeight: 600,
                    color: 'rgba(255,255,255,.88)',
                    background: 'none', border: 'none', cursor: 'default',
                    transition: '0.15s', whiteSpace: 'nowrap',
                  }}
                  className="cat-nav-btn">
                  {cat.emoji} {cat.category_name} {subs.length > 0 && <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>}
                </button>

                {subs.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0,
                    minWidth: 220,
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '0 0 var(--r2) var(--r2)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 500,
                    padding: '10px 0',
                  }} className="cat-dropdown">
                    {subs.map((sub) => (
                      <div key={sub.category_id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px',
                        fontSize: 13.5, fontWeight: 500,
                        color: 'var(--text)',
                        cursor: 'pointer', transition: '0.15s',
                      }} className="drop-item"
                        onClick={() => navigate(`/urunler?slug=${sub.category_slug}`)}>
                        {sub.emoji} {sub.category_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <style>{`
        .cat-nav-item .cat-dropdown { display: none; }
        .cat-nav-item:hover .cat-dropdown { display: block; animation: dropIn 0.15s ease; }
        .cat-nav-item:hover .cat-nav-btn { color: #fff !important; background: rgba(255,255,255,.1) !important; }
        .drop-item:hover { background: var(--primary-bg) !important; color: var(--primary) !important; padding-left: 22px !important; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
