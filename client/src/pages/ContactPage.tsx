import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function ContactPage() {
  const isMobile = useIsMobile()
  const s = useSiteSettings()
  const CONTACT_EMAIL = s.contactEmail
  const CONTACT_PHONE = s.contactPhone
  const COMPANY_ADDRESS = s.companyAddress
  const CONTACT_HOURS = s.contactHours
  const MAP_COORDS = (s.mapCoords || '').trim()
  const mapHref = MAP_COORDS
    ? `https://www.google.com/maps?q=${encodeURIComponent(MAP_COORDS)}`
    : COMPANY_ADDRESS
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS)}`
      : undefined
  const BRAND = `${s.brandPart1}${s.brandPart2}`
  const phoneDisplay = '+90 ' + CONTACT_PHONE.replace(/^90/, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 16px 40px' : '36px 24px 56px' }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: -0.5 }}>
          İletişim
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
          {BRAND} ekibi olarak soru, öneri ve şikayetleriniz için size en hızlı şekilde dönüş yapmaya çalışıyoruz.
          Aşağıdaki kanallardan bize ulaşabilirsiniz.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          <a href={`https://wa.me/${CONTACT_PHONE}`} target="_blank" rel="noopener noreferrer"
             style={{
               background: 'var(--bg2)', border: '1px solid var(--border)',
               borderRadius: 'var(--r2)', padding: '20px', textDecoration: 'none',
               display: 'flex', flexDirection: 'column', gap: 6,
             }}>
            <div style={{ fontSize: 26 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>WhatsApp</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{phoneDisplay}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>{CONTACT_HOURS || 'Haftaiçi 09:00–18:00'}</div>
          </a>

          <a href={`mailto:${CONTACT_EMAIL}`}
             style={{
               background: 'var(--bg2)', border: '1px solid var(--border)',
               borderRadius: 'var(--r2)', padding: '20px', textDecoration: 'none',
               display: 'flex', flexDirection: 'column', gap: 6,
             }}>
            <div style={{ fontSize: 26 }}>✉️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>E-posta</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{CONTACT_EMAIL}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>24 saat içinde yanıt</div>
          </a>

          <a
            href={mapHref}
            target="_blank" rel="noopener noreferrer"
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r2)', padding: '20px', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: 6,
              cursor: mapHref ? 'pointer' : 'default',
            }}>
            <div style={{ fontSize: 26 }}>📍</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Adres</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
              {COMPANY_ADDRESS || 'Adres bilgisi henüz eklenmedi'}
            </div>
            {mapHref && (
              <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>Haritada göster</div>
            )}
          </a>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '20px 22px',
        }}>
          <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
            Müşteri Hizmetleri
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
            Sipariş, iade, kargo veya ürünlerle ilgili tüm sorularınız için tercih ettiğiniz kanaldan bize yazabilirsiniz.
            En hızlı yanıt için WhatsApp'ı öneriyoruz.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
