import Link from 'next/link'
import type { FeaturedProduct } from '@/types'
import ProductCard from './ProductCard'

interface Props {
  title: string
  href: string
  products: FeaturedProduct[]
  badge?: 'new' | 'sale' | null
  emptyMessage?: string
  emojiFallback?: string
}

export default function ProductSection({
  title,
  href,
  products,
  badge = null,
  emptyMessage = 'Bu bölümde şu an ürün yok.',
  emojiFallback,
}: Props) {
  return (
    <section className="pt-section">
      <div className="pt-section-head">
        <h2 className="pt-section-title">{title}</h2>
        <Link href={href} className="pt-section-link">
          Tümünü Gör →
        </Link>
      </div>
      {products.length === 0 ? (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            background: 'var(--bg2)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r2)',
            color: 'var(--text2)',
            fontSize: 14,
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="pt-prod-grid">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} badge={badge} emojiFallback={emojiFallback} />
          ))}
        </div>
      )}
    </section>
  )
}
