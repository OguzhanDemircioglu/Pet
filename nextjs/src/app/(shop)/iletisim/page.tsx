import type { Metadata } from 'next'
import { fetchSiteSettings } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'PetToptan ile iletişime geçin. WhatsApp, e-posta ve adres bilgilerimiz.',
}

export default async function ContactPage() {
  const s = (await fetchSiteSettings()) ?? FALLBACK_SITE_SETTINGS
  const BRAND = `${s.brandPart1}${s.brandPart2}`
  const MAP_COORDS = (s.mapCoords || '').trim()
  const mapHref = MAP_COORDS
    ? `https://www.google.com/maps?q=${encodeURIComponent(MAP_COORDS)}`
    : s.companyAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.companyAddress)}`
      : undefined
  const phoneDisplay = '+90 ' + s.contactPhone.replace(/^90/, '').replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px 56px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 12, letterSpacing: -0.5 }}>İletişim</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28 }}>
          {BRAND} ekibi olarak soru, öneri ve şikayetleriniz için size en hızlı şekilde dönüş yapmaya çalışıyoruz.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          <a href={`https://wa.me/${s.contactPhone}`} target="_blank" rel="noopener noreferrer"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 26 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>WhatsApp</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{phoneDisplay}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>{s.contactHours || 'Haftaiçi 09:00–18:00'}</div>
          </a>

          <a href={`mailto:${s.contactEmail}`}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 26 }}>✉️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>E-posta</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{s.contactEmail}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>24 saat içinde yanıt</div>
          </a>

          <a href={mapHref} target="_blank" rel="noopener noreferrer"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6, cursor: mapHref ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 26 }}>📍</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Adres</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{s.companyAddress || 'Adres bilgisi henüz eklenmedi'}</div>
            {mapHref && <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>Haritada göster</div>}
          </a>
        </div>
      </div>
    </div>
  )
}
