import {useNavigate} from 'react-router-dom'

const STATIC_CATS = [
  {
    name: 'Kedi', emoji: '🐱', slug: 'kedi',
    subs: ['🥩 Kuru Mamalar', '🥫 Yaş Mamalar', '🍬 Ödüller', '🍽️ Mama ve Su Kapları', '🪣 Kumlar', '🎾 Oyuncaklar', '📿 Tasmalar', '🛏️ Yatak ve Yuvalar', '🚿 Bakım Ürünleri', '💊 Vitamin ve Katkıları'],
  },
  {
    name: 'Köpek', emoji: '🐶', slug: 'kopek',
    subs: ['🥩 Kuru Mamalar', '🥫 Yaş Mamalar', '🍬 Ödüller', '🍽️ Mama ve Su Kapları', '🎾 Oyuncaklar', '📿 Tasmalar', '🚶 Gezdirme Ürünleri', '🛏️ Yataklar', '🎒 Aksesuarlar', '💊 Vitaminler', '🚿 Bakım Ürünleri'],
  },
  {
    name: 'Kuş', emoji: '🐦', slug: 'kus',
    subs: ['🌾 Yemler', '🍘 Krakerler', '🪣 Kumlar', '🏠 Kafesler', '🎾 Oyuncaklar', '🎒 Aksesuarlar'],
  },
  {
    name: 'Akvaryum', emoji: '🐟', slug: 'akvaryum',
    subs: ['🍱 Balık Yemi', '💊 Balık Vitamin & Mineral', '🏺 Akvaryum ve Fanus', '🧪 Su Düzenleyiciler', '🧹 Bakım & Temizlik', '💡 Aydınlatma', '⚙️ Ekipman & Aksesuarlar', '🔄 Filtreler', '🌡️ Isıtma & Soğutma'],
  },
  {
    name: 'Kemirgen', emoji: '🐹', slug: 'kemirgen',
    subs: ['🌾 Yemler', '🏠 Kafesler', '🎾 Oyuncaklar', '🚿 Bakım & Sağlık'],
  },
  {
    name: 'Sürüngen', emoji: '🦎', slug: 'surungenler',
    subs: ['🍃 Sürüngen Yemi', '🎒 Aksesuarlar', '🪵 Taban Malzemeleri'],
  },
]

export default function CategoryBar() {
  const navigate = useNavigate()

  return (
    <div style={{
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
          {STATIC_CATS.map((cat) => (
            <div key={cat.slug} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
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
                {cat.emoji} {cat.name} <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
              </button>

              {/* Dropdown */}
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
                {cat.subs.map((sub, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px',
                    fontSize: 13.5, fontWeight: 500,
                    color: 'var(--text)',
                    cursor: 'pointer', transition: '0.15s',
                  }} className="drop-item"
                    onClick={() => navigate(`/urunler?kategori=${cat.slug}`)}>
                    {sub}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
