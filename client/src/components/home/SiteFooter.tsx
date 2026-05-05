import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="pt-footer">
      <div className="pt-footer-inner">
        <div className="pt-footer-top">
          <Link href="/" className="pt-logo" aria-label="PetToptan">
            <span className="pt-logo-icon">
              <span style={{ fontSize: 22 }} aria-hidden="true">🐾</span>
            </span>
            <span className="pt-logo-text">
              <span className="pt-pet">Pet</span>
              <span className="pt-toptan">Toptan</span>
            </span>
          </Link>
          <nav className="pt-footer-links" aria-label="Alt menü">
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/iletisim">İletişim</Link>
            <Link href="/kvkk">KVKK</Link>
            <Link href="/gizlilik">Gizlilik</Link>
            <Link href="/kargo">Kargo & Teslimat</Link>
            <Link href="/iade">İade & Değişim</Link>
          </nav>
        </div>
        <div className="pt-footer-bottom">
          <span className="pt-footer-copy">© 2026 PetToptan — Tüm hakları saklıdır.</span>
          <div className="pt-footer-badges">
            <span className="pt-footer-badge">iyzico</span>
            <span className="pt-footer-badge">3D Secure</span>
            <span className="pt-footer-badge">SSL</span>
            <span className="pt-footer-badge">KVKK</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
