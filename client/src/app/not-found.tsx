import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 84, marginBottom: 12 }}>🐾</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>404</h1>
        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
          Aradığınız sayfa bulunamadı. Ürün taşınmış veya kaldırılmış olabilir.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '10px 22px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Ana Sayfa</Link>
          <Link href="/urunler" style={{ padding: '10px 22px', background: 'var(--bg3)', color: 'var(--text)', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid var(--border)' }}>Tüm Ürünler</Link>
        </div>
      </div>
    </div>
  )
}
