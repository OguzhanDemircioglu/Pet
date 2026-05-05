import Link from 'next/link'

export default function PromoBanner() {
  return (
    <section className="pt-section">
      <div className="pt-promo-grid">
        <Link href="/kampanya/kedi" className="pt-promo-card pt-promo-1">
          <div className="pt-promo-content">
            <h3>Kedi Maması<br />Şenliği</h3>
            <p>Tüm kedi mamalarında %25’e varan toptan fiyat avantajı</p>
            <span className="pt-promo-btn">İncele →</span>
          </div>
          <div className="pt-promo-emoji" aria-hidden="true">🐱</div>
        </Link>
        <Link href="/kampanya/kopek" className="pt-promo-card pt-promo-2">
          <div className="pt-promo-content">
            <h3>Köpek Bakım<br />Ürünleri</h3>
            <p>Şampuan, fırça ve aksesuarda toplu alıma özel indirim</p>
            <span className="pt-promo-btn">İncele →</span>
          </div>
          <div className="pt-promo-emoji" aria-hidden="true">🐶</div>
        </Link>
      </div>
    </section>
  )
}
