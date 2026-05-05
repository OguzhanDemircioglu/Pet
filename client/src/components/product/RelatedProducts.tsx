import Link from 'next/link'
import type { FeaturedProduct } from '@/types'
import ProductCard from '@/components/home/ProductCard'

interface Props {
  products: FeaturedProduct[]
  title?: string
}

export default function RelatedProducts({ products, title = '🔗 Benzer Ürünler' }: Props) {
  if (products.length === 0) return null
  return (
    <section className="pd-related">
      <div className="pd-section-head">
        <h2 className="pd-section-title">{title}</h2>
        <Link href="/cok-satanlar" className="pt-section-link">
          Tümünü Gör →
        </Link>
      </div>
      <div className="pt-prod-grid">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} emojiFallback="📦" />
        ))}
      </div>
    </section>
  )
}
