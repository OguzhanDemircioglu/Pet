'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { Product, ProductVariant } from '@/types'

interface Props {
  product: Product
}

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

// Toptan kademe örneği — gerçek backend'den gelmiyorsa görsel referans için
const TIERS = [
  { min: 1, max: 9, mult: 1, badge: null as string | null },
  { min: 10, max: 49, mult: 0.95, badge: '%5' },
  { min: 50, max: 99, mult: 0.90, badge: '%10' },
  { min: 100, max: Infinity, mult: 0.85, badge: '%15' },
]

export default function ProductInfo({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [variantId, setVariantId] = useState<number | null>(product.variants[0]?.id ?? null)
  const [adding, setAdding] = useState(false)

  const variant: ProductVariant | undefined = product.variants.find((v) => v.id === variantId)
  const stock = variant?.availableStock ?? product.availableStock
  const basePrice = variant?.price ?? product.basePrice
  const discount = product.activeDiscount

  const oldPrice = discount?.discountType === 'PERCENT'
    ? Math.round(basePrice / (1 - discount.discountValue / 100))
    : discount?.discountType === 'FIXED'
      ? basePrice + discount.discountValue
      : null

  const currentTier = TIERS.find((t) => qty >= t.min && qty <= t.max) ?? TIERS[0]

  const handleAdd = () => {
    setAdding(true)
    window.setTimeout(() => setAdding(false), 800)
    // TODO: gerçek sepet entegrasyonu
  }

  return (
    <div className="pd-info">
      {product.brandName && <div className="pd-brand-badge">⭐ {product.brandName}</div>}
      <h1 className="pd-title">{product.name}</h1>

      {(product.averageRating ?? 0) > 0 && (
        <div className="pd-rating-row">
          <span className="pd-stars" aria-hidden="true">
            {'★'.repeat(Math.round(product.averageRating ?? 0))}
            {'☆'.repeat(5 - Math.round(product.averageRating ?? 0))}
          </span>
          <span className="pd-rating-val">{(product.averageRating ?? 0).toFixed(1)}</span>
          <span className="pd-rating-count">({product.reviewCount ?? 0} değerlendirme)</span>
          <span className="pd-rating-sep">·</span>
          <span className="pd-rating-count">SKU: <strong style={{ color: 'var(--text)' }}>{product.sku}</strong></span>
        </div>
      )}

      <div className="pd-chips">
        {stock > 10 && <span className="pd-chip pd-chip-green">✓ Stokta</span>}
        {stock > 0 && stock <= 10 && <span className="pd-chip pd-chip-orange">⚠️ Son {stock} adet</span>}
        {stock === 0 && <span className="pd-chip pd-chip-orange">Tükendi</span>}
        <span className="pd-chip pd-chip-blue">🚚 24-48 saat sevkiyat</span>
        {discount && <span className="pd-chip pd-chip-orange">🏷️ {discount.label}</span>}
      </div>

      {product.shortDescription && (
        <p style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 22 }}>
          {product.shortDescription}
        </p>
      )}

      {/* Variants */}
      {product.variants.length > 1 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
            Seçenek
          </div>
          <div className="pd-variants">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`pd-variant${variantId === v.id ? ' active' : ''}`}
                onClick={() => setVariantId(v.id)}
              >
                {v.label}
                <span style={{ marginLeft: 6, fontWeight: 800 }}>{formatTL(v.price)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Toptan fiyat tablosu */}
      <div className="pd-price-card">
        <div className="pd-price-head">
          <span>📊 Kademeli Toptan Fiyat</span>
          <span className="pd-price-head-icon">🔥</span>
        </div>
        <table className="pd-price-table">
          <thead>
            <tr>
              <th>Adet</th>
              <th>Birim Fiyat</th>
              <th>İndirim</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => {
              const tierPrice = Math.round(basePrice * t.mult)
              const isCurrent = currentTier === t
              return (
                <tr key={t.min} className={isCurrent ? 'pd-highlighted' : ''}>
                  <td>
                    {t.max === Infinity ? `${t.min}+` : `${t.min}-${t.max}`} {variant?.label ? variant.label : product.unit}
                  </td>
                  <td className={isCurrent ? 'pd-price-big' : ''}>{formatTL(tierPrice)}</td>
                  <td>
                    {t.badge ? <span className="pd-discount-pill">{t.badge}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {oldPrice && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{formatTL(basePrice)}</span>
          <span style={{ fontSize: 16, color: 'var(--text3)', textDecoration: 'line-through' }}>{formatTL(oldPrice)}</span>
        </div>
      )}

      {/* Qty */}
      <div className="pd-qty-row">
        <span className="pd-qty-label">Adet</span>
        <div className="pd-qty-ctrl">
          <button type="button" className="pd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Azalt">−</button>
          <input
            type="number"
            className="pd-qty-val"
            value={qty}
            min={1}
            max={stock}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (!Number.isNaN(n)) setQty(Math.max(1, Math.min(stock, n)))
            }}
            aria-label="Adet"
          />
          <button type="button" className="pd-qty-btn" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={qty >= stock} aria-label="Arttır">+</button>
        </div>
        <span className="pd-qty-info">Toplam: <strong style={{ color: 'var(--primary)' }}>{formatTL(basePrice * currentTier.mult * qty)}</strong></span>
      </div>

      <div className="pd-action-btns">
        <button type="button" className="pd-btn-cart" onClick={handleAdd} disabled={stock === 0 || adding}>
          {adding ? '✓ Sepete Eklendi' : '🛒 Sepete Ekle'}
        </button>
        <Link href="https://wa.me/905000000000" target="_blank" rel="noopener" className="pd-btn-wp">
          💬 WhatsApp ile Satıcıya Sor
        </Link>
      </div>

      <div className="pd-info-row">
        <span className="pd-info-item"><span className="pd-info-emoji">🚚</span>500₺ üzeri ücretsiz kargo</span>
        <span className="pd-info-item"><span className="pd-info-emoji">🔒</span>iyzico güvencesi</span>
        <span className="pd-info-item"><span className="pd-info-emoji">↩️</span>14 gün iade hakkı</span>
      </div>
    </div>
  )
}
