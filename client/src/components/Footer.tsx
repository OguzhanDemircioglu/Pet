import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      padding: '36px 24px 24px',
      marginTop: 24,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 16,
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg,var(--primary),#ef4444)',
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>🐾</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: 'var(--primary)' }}>Pet</span>
              <span style={{ color: 'var(--accent)' }}>Toptan</span>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {['Hakkımızda', 'Nasıl Çalışır', 'Bayilik', 'Kampanyalar', 'Blog', 'İletişim', 'Gizlilik Politikası'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'var(--text2)', transition: '0.2s' }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            © 2024 PetToptan. Tüm hakları saklıdır. Türkiye'nin toptan pet ürünleri platformu.
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
