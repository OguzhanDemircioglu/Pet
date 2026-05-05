import Link from 'next/link'
import type { Category } from '@/types'

interface Tile {
  slug: string
  name: string
  emoji: string
  className: string
  fallbackCount: string
}

const TILES: Tile[] = [
  { slug: 'kedi', name: 'Kedi', emoji: '🐱', className: 'pt-cat-c1', fallbackCount: '500+ ürün' },
  { slug: 'kopek', name: 'Köpek', emoji: '🐶', className: 'pt-cat-c2', fallbackCount: '450+ ürün' },
  { slug: 'kus', name: 'Kuş', emoji: '🦜', className: 'pt-cat-c3', fallbackCount: '120+ ürün' },
  { slug: 'balik', name: 'Balık', emoji: '🐠', className: 'pt-cat-c4', fallbackCount: '180+ ürün' },
  { slug: 'kemirgen', name: 'Kemirgen', emoji: '🐹', className: 'pt-cat-c5', fallbackCount: '90+ ürün' },
  { slug: 'surungen', name: 'Sürüngen', emoji: '🦎', className: 'pt-cat-c6', fallbackCount: '40+ ürün' },
]

interface Props {
  categories: Category[]
}

export default function CategoryGrid({ categories }: Props) {
  const countOf = (slug: string) => {
    const match = categories.find((c) => c.category_slug === slug)
    if (!match) return null
    const childCount = categories.filter((c) => c.parent_id === match.category_id).length
    return childCount > 0 ? `${childCount} alt kategori` : null
  }

  return (
    <section className="pt-section">
      <div className="pt-section-head">
        <h2 className="pt-section-title">Popüler Kategoriler</h2>
        <Link href="/kategoriler" className="pt-section-link">
          Tümünü Gör →
        </Link>
      </div>
      <div className="pt-cat-grid">
        {TILES.map((tile) => (
          <Link
            key={tile.slug}
            href={`/kategori/${tile.slug}`}
            className={`pt-cat-card ${tile.className}`}
            aria-label={`${tile.name} kategorisi`}
          >
            <span className="pt-cat-emoji" aria-hidden="true">{tile.emoji}</span>
            <span className="pt-cat-name">{tile.name}</span>
            <span className="pt-cat-count">{countOf(tile.slug) ?? tile.fallbackCount}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
