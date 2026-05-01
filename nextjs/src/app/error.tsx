'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>Bir hata oluştu</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
          Beklenmeyen bir sorun oluştu. Lütfen sayfayı yenilemeyi deneyin.
        </p>
        {error.digest && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16, fontFamily: 'monospace' }}>Hata kodu: {error.digest}</div>}
        <button onClick={reset} style={{ padding: '10px 22px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
