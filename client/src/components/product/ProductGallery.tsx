'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { ProductImage } from '@/types'

interface Props {
  images: ProductImage[]
  productName: string
  emojiFallback?: string
  badge?: string | null
}

export default function ProductGallery({ images, productName, emojiFallback = '📦', badge }: Props) {
  const [active, setActive] = useState(0)
  const [fav, setFav] = useState(false)

  const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder)
  const mainImage = sorted[active] ?? sorted[0]
  const bgClasses = ['pd-thumb-bg1', 'pd-thumb-bg2', 'pd-thumb-bg3', 'pd-thumb-bg4']

  return (
    <div className="pd-gallery">
      <div className="pd-main-img">
        {badge && <span className="pd-main-img-badge">{badge}</span>}
        <button
          type="button"
          className={`pd-main-img-fav${fav ? ' active' : ''}`}
          onClick={() => setFav((v) => !v)}
          aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          {fav ? '❤️' : '🤍'}
        </button>
        {mainImage?.imageUrl ? (
          <Image
            src={mainImage.imageUrl}
            alt={productName}
            width={520}
            height={460}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <span aria-hidden="true">{emojiFallback}</span>
        )}
        <span className="pd-main-img-zoom" aria-hidden="true">🔍 Yakınlaştır</span>
      </div>

      {sorted.length > 1 && (
        <div className="pd-thumb-row">
          {sorted.slice(0, 4).map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`pd-thumb ${bgClasses[i % 4]}${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Resim ${i + 1}`}
            >
              {img.imageUrl ? (
                <Image src={img.imageUrl} alt="" width={90} height={90} sizes="90px" />
              ) : (
                <span aria-hidden="true">{emojiFallback}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
