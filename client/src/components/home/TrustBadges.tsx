const ITEMS = [
  { icon: '🚚', title: 'Hızlı Kargo', desc: 'Türkiye geneli 24-48 saatte teslim, anlaşmalı kargo şirketleri' },
  { icon: '💬', title: '7/24 Destek', desc: 'WhatsApp ve e-posta üzerinden hızlı geri dönüş, gerçek satıcı' },
  { icon: '🔒', title: 'Güvenli Ödeme', desc: 'iyzico altyapısı, 3D Secure desteği, kredi kartı / havale' },
  { icon: '✅', title: 'KVKK Uyumlu', desc: 'Verileriniz şifreli saklanır, üçüncü taraflarla paylaşılmaz' },
]

export default function TrustBadges() {
  return (
    <section className="pt-trust pt-page">
      <div className="pt-trust-grid">
        {ITEMS.map((item) => (
          <div key={item.title} className="pt-trust-card">
            <span className="pt-trust-icon" aria-hidden="true">{item.icon}</span>
            <div className="pt-trust-title">{item.title}</div>
            <div className="pt-trust-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
