'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore'
import { addToCart } from '@/store/cartSlice'
import { imgUrl } from '@/lib/utils'
import type { FeaturedProduct, CatalogProduct } from '@/types'

const BG_COLORS = [
  'linear-gradient(135deg,#fce7f3,#fdf2f8)',
  'linear-gradient(135deg,#dbeafe,#eff6ff)',
  'linear-gradient(135deg,#dcfce7,#f0fdf4)',
  'linear-gradient(135deg,#fef3c7,#fffbeb)',
  'linear-gradient(135deg,#f3e8ff,#faf5ff)',
  'linear-gradient(135deg,#e0f2fe,#f0f9ff)',
]

type Props = { p: FeaturedProduct | CatalogProduct }

export default function ProductCard({ p }: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(s => s.cart.items)
  const bg = BG_COLORS[p.name.charCodeAt(0) % BG_COLORS.length]
  const activeVariants = (p.variants ?? []).filter(v => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder)
  const hasVariants = activeVariants.length >= 2
  const [selectedId, setSelectedId] = useState<number | null>(hasVariants ? activeVariants[0].id : null)
  const selectedVariant = hasVariants ? (activeVariants.find(v => v.id === selectedId) ?? activeVariants[0]) : null

  const effectivePrice = selectedVariant ? selectedVariant.price : p.basePrice
  const effectiveStock = selectedVariant ? selectedVariant.availableStock : p.availableStock

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (effectiveStock <= 0) return
    const inCart = cartItems.find(i => i.productId === p.id && (i.variantId ?? undefined) === (selectedVariant?.id ?? undefined))?.quantity ?? 0
    if (inCart >= effectiveStock) { toast.error('Stokta yeterli ürün yok'); return }
    dispatch(addToCart({
      productId: p.id, name: p.name, slug: p.slug, brandName: p.brandName,
      basePrice: effectivePrice, unit: p.unit,
      availableStock: effectiveStock, primaryImageUrl: p.primaryImageUrl,
      ...(selectedVariant ? { variantId: selectedVariant.id, variantLabel: selectedVariant.label } : {}),
    }))
    toast.success('Sepete eklendi')
  }

  const imgSrc = imgUrl(p.primaryImageUrl)

  return (
    <div onClick={() => router.push(`/urun/${p.slug}`)} className="prod-card" style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', overflow: 'hidden', transition: '0.22s',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 165, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative', flexShrink: 0, background: bg }}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: 'contain', padding: 8 }}
          />
        ) : <span>🐾</span>}
        {p.activeDiscount && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 900, padding: '3px 9px', borderRadius: 20, boxShadow: '0 2px 8px rgba(220,38,38,.4)', zIndex: 1 }}>
            {p.activeDiscount.label} İndirim
          </div>
        )}
      </div>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{p.brandName}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8, flex: 1 }}>{p.name}</div>

        <div style={{ marginBottom: 10 }}>
          {p.activeDiscount && !hasVariants ? (() => {
            const disc = p.activeDiscount!
            const newPrice = disc.discountType === 'PERCENT' ? p.basePrice * (1 - disc.discountValue / 100) : p.basePrice - disc.discountValue
            return (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 14, color: 'var(--text3)', textDecoration: 'line-through' }}>₺{p.basePrice.toFixed(2)}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>₺{newPrice.toFixed(2)}</div>
              </div>
            )
          })() : (
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>₺{effectivePrice.toFixed(2)}</div>
          )}
        </div>

        {hasVariants && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {activeVariants.map(v => {
              const isSel = selectedVariant?.id === v.id
              const oos = v.availableStock <= 0
              return (
                <button key={v.id} onClick={e => { e.stopPropagation(); if (!oos) setSelectedId(v.id) }} disabled={oos}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: isSel ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', background: isSel ? 'var(--primary-bg)' : 'var(--bg)', cursor: oos ? 'not-allowed' : 'pointer', opacity: oos ? 0.5 : 1, transition: '0.15s' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isSel ? 'var(--primary)' : 'var(--text2)' }}>{v.label}{oos && ' · Tükendi'}</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: isSel ? 'var(--primary)' : 'var(--text)' }}>₺{v.price.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        )}

        <button disabled={effectiveStock <= 0} onClick={handleAddToCart}
          style={{ width: '100%', background: effectiveStock <= 0 ? '#e5e7eb' : 'var(--primary)', color: effectiveStock <= 0 ? '#111' : '#fff', fontSize: 13, fontWeight: 700, padding: '9px 0', borderRadius: 'var(--r)', border: 'none', cursor: effectiveStock <= 0 ? 'not-allowed' : 'pointer', transition: '0.2s' }}>
          {effectiveStock <= 0 ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
      </div>

      <style>{`
        .prod-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
      `}</style>
    </div>
  )
}
