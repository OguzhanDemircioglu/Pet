import { useEffect, useState } from 'react'
import { authApi } from '../api/authApi'
import type { AdminInfo } from '../types'

const WA_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
  }
  return raw
}

export default function InfoBar() {
  const [cur, setCur] = useState(0)
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)

  useEffect(() => {
    authApi.adminInfo().then(setAdminInfo).catch(() => {})
  }, [])

  const adminEmail = adminInfo?.email ?? 'info@offcats.com.tr'
  const adminPhone = adminInfo?.phone

  const slides = [
    {
      content: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Bize ulaşın:{' '}
          <a href={`mailto:${adminEmail}`} style={{ color: 'rgba(255,255,255,.95)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
            {adminEmail}
          </a>
        </span>
      ),
    },
    {
      content: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {WA_SVG}
          {adminPhone ? (
            <>
              <a href={`https://wa.me/90${adminPhone.replace(/\D/g, '').slice(1)}`}
                target="_blank" rel="noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.95)', textDecoration: 'none' }}>
                <strong>WhatsApp:</strong> +90 {formatPhone(adminPhone).slice(1)}
              </a>
              <span style={{ color: 'rgba(255,255,255,.6)' }}>&nbsp;·&nbsp; Haftaiçi 09:00–18:00</span>
            </>
          ) : (
            <span>WhatsApp desteği · Haftaiçi 09:00–18:00</span>
          )}
        </span>
      ),
    },
    {
      content: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {WA_SVG}
          <strong>Satıcıya Sor</strong> — Her ürün sayfasında WhatsApp ile direkt satıcıya ulaşın
        </span>
      ),
    },
  ]

  useEffect(() => {
    const id = setInterval(() => setCur(c => (c + 1) % slides.length), 3500)
    return () => clearInterval(id)
  }, [slides.length])

  return (
    <div style={{ background: 'var(--secondary)', color: 'rgba(255,255,255,.9)', fontSize: 13, fontWeight: 500, height: 34, overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {slides.map((s, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: i === cur ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: i === cur ? 'auto' : 'none' }}>
            {s.content}
          </div>
        ))}
        <div style={{ position: 'absolute', right: 24, display: 'flex', gap: 5, alignItems: 'center' }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setCur(i)} style={{ width: i === cur ? 14 : 5, height: 5, borderRadius: i === cur ? 3 : '50%', background: i === cur ? '#fff' : 'rgba(255,255,255,.35)', cursor: 'pointer', transition: '0.2s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
