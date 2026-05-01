'use client'
import { useState } from 'react'

interface Faq { q: string; a: string }

function Item({ item, open, onToggle }: { item: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', marginBottom: 10, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
        <span>{item.q}</span>
        <span style={{ fontSize: 20, color: 'var(--primary)', fontWeight: 900, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{item.a}</div>
      )}
    </div>
  )
}

export default function FAQClient({ faqs }: { faqs: Faq[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 56px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: -0.5 }}>Sıkça Sorulan Sorular</h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
          Müşterilerimizin en çok sorduğu soruları aşağıda bir araya getirdik. Aradığınızı bulamazsanız bize iletişim sayfasından ulaşabilirsiniz.
        </p>
        {faqs.map((f, i) => (
          <Item key={i} item={f} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
      </div>
    </div>
  )
}
