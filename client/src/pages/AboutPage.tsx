import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSiteSettings } from '../hooks/useSiteSettings'

const VALUES = [
  { icon: '🏷️', title: 'Toptan Fiyat', desc: 'Üreticiden doğrudan tedarik — aracı yok, en uygun fiyat garantisi.' },
  { icon: '🎯', title: '%100 Orijinal', desc: 'Her ürün yetkili tedarikçi kanalıyla temin edilir, orijinallik garantilidir.' },
  { icon: '🚚', title: 'Hızlı Kargo', desc: 'Sipariş aynı gün hazırlanır, 1–3 iş gününde kapınızda.' },
  { icon: '💬', title: 'Canlı Destek', desc: 'WhatsApp ve e-posta üzerinden 7/24 müşteri desteği.' },
]

export default function AboutPage() {
  const isMobile = useIsMobile()
  const s = useSiteSettings()
  const BRAND = `${s.brandPart1}${s.brandPart2}`
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 40px' : '36px 24px 56px' }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: -0.5 }}>
          Hakkımızda
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
          <strong>{BRAND}</strong>, Türkiye genelinde evcil hayvan sahiplerine ve pet shop'lara toptan fiyat avantajıyla
          kaliteli ürünler ulaştırmak için kurulmuş bir platformdur. Mama, aksesuar, bakım ve oyuncak kategorilerinde
          binlerce ürünü, yetkili tedarikçilerden doğrudan temin ederek kullanıcılarımıza hızlı ve güvenli şekilde sunuyoruz.
        </p>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
          Amacımız, dostlarımızın sağlıklı ve mutlu bir yaşam sürmesi için ihtiyaç duyulan her ürünü tek bir adresten,
          şeffaf fiyat ve güvenli ödeme altyapısıyla ulaşılabilir kılmaktır. Siparişleriniz iyzico ve PayTR güvencesiyle
          işlenir, tüm ürünler orijinallik garantisi ile gönderilir.
        </p>

        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--text)', marginBottom: 16, marginTop: 8 }}>
          Değerlerimiz
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 14, marginBottom: 28 }}>
          {VALUES.map(v => (
            <div key={v.title} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r2)', padding: '18px 20px',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{v.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
          Vizyonumuz
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>
          Evcil hayvanlarımızın ihtiyaçlarını karşılarken sahiplerini de düşünüyoruz. Uygun fiyat, hızlı teslimat ve
          güvenilir müşteri deneyimini bir arada sunarak Türkiye'nin en çok tercih edilen toptan pet platformu olmayı
          hedefliyoruz.
        </p>
      </div>

      <Footer />
    </div>
  )
}
