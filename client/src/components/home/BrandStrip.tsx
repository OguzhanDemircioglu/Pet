import Link from 'next/link'
import type { Brand } from '@/types'

const FALLBACK = ['Royal Canin', 'Hill\'s', 'Pro Plan', 'Whiskas', 'Friskies', 'Felix', 'Pedigree', 'Acana', 'Orijen', 'Iams', 'Eukanuba', 'Brit']

interface Props {
  brands: Brand[]
}

export default function BrandStrip({ brands }: Props) {
  const names = brands.length > 0 ? brands.map((b) => b.name) : FALLBACK
  // Marquee için listeyi 2x kopyalıyoruz — sürekli akan görünüm
  const doubled = [...names, ...names]

  return (
    <section className="pt-section" aria-label="Markalar">
      <div className="pt-section-head">
        <h2 className="pt-section-title">Anlaşmalı Markalar</h2>
        <Link href="/markalar" className="pt-section-link">
          Tümünü Gör →
        </Link>
      </div>
      <div className="pt-brands">
        <div className="pt-brand-marquee">
          {doubled.map((name, i) => (
            <Link key={i} href={`/marka/${encodeURIComponent(name.toLowerCase())}`} className="pt-brand-pill">
              {name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
