'use client'
import { useEffect, useState } from 'react'

export default function PetMascot() {
  const [open, setOpen] = useState(false)
  const [hinted, setHinted] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setHinted(true), 4000)
    const t2 = window.setTimeout(() => setHinted(false), 9000)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [])

  const showBubble = open || hinted

  return (
    <div className="pt-mascot" aria-live="polite">
      <div
        className={`pt-mascot-bubble${showBubble ? ' visible' : ''}`}
        role={open ? 'dialog' : undefined}
        aria-hidden={!showBubble}
      >
        {open ? (
          <>
            <div style={{ marginBottom: 6 }}>Yardıma ihtiyacın var mı? 🐾</div>
            <a
              href="https://wa.me/905000000000"
              target="_blank"
              rel="noopener"
              style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}
            >
              WhatsApp ile sor →
            </a>
          </>
        ) : (
          'Selam! 🐾 Bir şey lazım mı?'
        )}
      </div>
      <button
        type="button"
        className="pt-mascot-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Yardım"
        aria-expanded={open}
      >
        🐾
      </button>
    </div>
  )
}
