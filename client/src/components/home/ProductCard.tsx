'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { FeaturedProduct } from '@/types'

interface Props {
  product: FeaturedProduct
  badge?: 'new' | 'sale' | null
  emojiFallback?: string
}

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export default function ProductCard({ product, badge, emojiFallback = '📦' }: Props) {
  const [fav, setFav] = useState(false)
  const discount = product.activeDiscount
  const oldPrice = discount?.discountType === 'PERCENT'
    ? Math.round(product.basePrice / (1 - discount.discountValue / 100))
    : discount?.discountType === 'FIXED'
      ? product.basePrice + discount.discountValue
      : null
  const stock = product.availableStock
  const lowStock = stock > 0 && stock <= 10

  return (
    <Link href={`/urun/${product.slug}`} className="pt-prod-card" aria-label={product.name}>
      <div className="pt-prod-img-wrap">
        {badge === 'new' && <span className="pt-prod-badge pt-prod-badge-new">YENİ</span>}
        {badge === 'sale' && <span className="pt-prod-badge">İNDİRİM</span>}
        <button
          type="button"
          className={`pt-prod-fav${fav ? ' active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setFav((v) => !v)
          }}
          aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          {fav ? '❤️' : '🤍'}
        </button>
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            width={240}
            height={180}
            sizes="(max-width: 768px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <span className="pt-prod-emoji" aria-hidden="true">{emojiFallback}</span>
        )}
      </div>
      <div className="pt-prod-body">
        {product.brandName && <div className="pt-prod-brand">{product.brandName}</div>}
        <div className="pt-prod-title">{product.name}</div>
        <div className={`pt-prod-stock${lowStock ? ' pt-prod-stock-low' : ''}`}>
          {stock > 0 ? (lowStock ? `Son ${stock} adet` : 'Stokta') : 'Tükendi'}
        </div>
        <div className="pt-prod-price-row">
          <div>
            <div className="pt-prod-price">{formatTL(product.basePrice)}</div>
            {oldPrice && <div className="pt-prod-price-old">{formatTL(oldPrice)}</div>}
          </div>
          <span className="pt-icon-btn-label" style={{ fontSize: 11, color: 'var(--text3)' }}>
            /{product.unit}
          </span>
        </div>
        <button
          type="button"
          className="pt-add-to-cart"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          disabled={stock === 0}
        >
          🛒 Sepete Ekle
        </button>
      </div>
    </Link>
  )
}
