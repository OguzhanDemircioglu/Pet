import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'

interface FooterLink {
  label: string
  to?: string
  anchor?: string   // aynı sayfadaki id; HomePage'de scroll, başka sayfada /{#id} navigate
}

const LINKS: FooterLink[] = [
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'SSS', to: '/sss' },
  { label: 'İletişim', to: '/iletisim' },
  { label: 'Gizlilik Politikası', to: '/gizlilik-politikasi' },
]

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()
  const settings = useSiteSettings()

  const onAnchor = (e: React.MouseEvent, anchor: string) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(`/#${anchor}`)
    }
  }

  return (
    <footer style={{
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      padding: 'clamp(24px, 4vw, 36px) clamp(12px, 3vw, 24px) clamp(16px, 3vw, 24px)',
      marginTop: 24,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 16,
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo.svg" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: 'var(--primary)' }}>{settings.brandPart1}</span>
              <span style={{ color: 'var(--accent)' }}>{settings.brandPart2}</span>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {LINKS.map(l => l.anchor ? (
              <a key={l.label} href={`#${l.anchor}`} onClick={e => onAnchor(e, l.anchor!)}
                 style={{ fontSize: 13, color: 'var(--text2)', transition: '0.2s', cursor: 'pointer' }}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.to!}
                 style={{ fontSize: 13, color: 'var(--text2)', transition: '0.2s', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            © {new Date().getFullYear()} {settings.brandPart1}{settings.brandPart2}. Tüm hakları saklıdır. Türkiye'nin toptan pet ürünleri platformu.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['iyzico', 'PayTR', 'SSL Güvenli'].map(b => (
              <span key={b} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text2)',
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
