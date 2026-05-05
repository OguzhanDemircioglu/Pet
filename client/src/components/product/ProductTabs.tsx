'use client'
import { useState } from 'react'
import type { Product } from '@/types'

type Tab = 'desc' | 'specs' | 'reviews'

interface Props {
  product: Product
}

const SAMPLE_REVIEWS = [
  { name: 'Mehmet K.', rating: 5, date: '2 gün önce', body: 'Mama kalitesi gerçekten iyi, kedim çok sevdi. Hızlı kargo ile elime ulaştı, ambalaj sağlamdı. Tekrar sipariş vereceğim.', initial: 'M' },
  { name: 'Ayşe T.', rating: 4, date: '1 hafta önce', body: 'Toptan fiyatları gayet uygun. Ürünün son kullanma tarihi de uzun. Tek eksi kargo süresi biraz uzun sürdü ama iletişim çok iyiydi.', initial: 'A' },
  { name: 'Burak S.', rating: 5, date: '2 hafta önce', body: 'Pet shop\'um için sürekli buradan tedarik ediyorum. Müşterilerim de memnun. B2B fiyat avantajı tam istediğim gibi.', initial: 'B' },
]

export default function ProductTabs({ product }: Props) {
  const [tab, setTab] = useState<Tab>('desc')

  const specs: Array<[string, string]> = [
    ['Marka', product.brandName ?? '-'],
    ['Kategori', product.categoryName ?? '-'],
    ['SKU', product.sku],
    ['Birim', product.unit],
    ['Stok', `${product.availableStock} ${product.unit}`],
    ['Tip', product.isFeatured ? 'Öne çıkarılan' : 'Standart'],
  ]

  const ratingDistribution = [
    { star: 5, count: 32 },
    { star: 4, count: 12 },
    { star: 3, count: 4 },
    { star: 2, count: 1 },
    { star: 1, count: 0 },
  ]
  const totalReviews = ratingDistribution.reduce((s, r) => s + r.count, 0)

  return (
    <section className="pd-tabs-section">
      <div className="pd-tab-nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'desc'}
          className={`pd-tab-btn${tab === 'desc' ? ' active' : ''}`}
          onClick={() => setTab('desc')}
        >
          📝 Açıklama
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'specs'}
          className={`pd-tab-btn${tab === 'specs' ? ' active' : ''}`}
          onClick={() => setTab('specs')}
        >
          📋 Özellikler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'reviews'}
          className={`pd-tab-btn${tab === 'reviews' ? ' active' : ''}`}
          onClick={() => setTab('reviews')}
        >
          ⭐ Yorumlar ({product.reviewCount ?? totalReviews})
        </button>
      </div>

      <div className={`pd-tab-panel${tab === 'desc' ? ' active' : ''}`}>
        <div className="pd-desc">
          {product.shortDescription ? (
            <p>{product.shortDescription}</p>
          ) : (
            <p>
              Bu ürün, kalite ve uygun fiyatı bir araya getiren <strong>{product.brandName ?? 'PetToptan'}</strong> markasının
              özenle seçilmiş bir ürünüdür. Toptan tedarik için ideal birim fiyatı, yüksek stok kapasitesi ve hızlı sevkiyat
              ile pet shop, klinik ve bayilere özel olarak sunulur.
            </p>
          )}
          <p>
            <strong>Neden bu ürün?</strong> Premium içerik, dengeli besin değerleri, raf ömrü uzun ambalaj.
            Yıllardır pet sektörünün vazgeçilmezi olan bu ürün, müşteri memnuniyeti açısından ortalamanın üstünde performans gösteriyor.
          </p>
          <div className="pd-desc-highlight">
            💡 <strong>Toptan avantaj:</strong> 100+ adet siparişlerde %15’e varan iskonto, ücretsiz kargo ve özel ödeme koşulları.
            Detaylı bilgi için WhatsApp’tan satıcıya ulaşın.
          </div>
          <p>Fatura, KDV dahil net fiyat ve e-arşiv olarak Paraşüt entegrasyonu ile 24 saat içinde mail adresinize ulaşır.</p>
        </div>
      </div>

      <div className={`pd-tab-panel${tab === 'specs' ? ' active' : ''}`}>
        <div className="pd-specs-grid">
          {specs.map(([k, v]) => (
            <div key={k} className="pd-spec-item">
              <span className="pd-spec-key">{k}</span>
              <span className="pd-spec-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`pd-tab-panel${tab === 'reviews' ? ' active' : ''}`}>
        <div className="pd-reviews-summary">
          <div className="pd-review-score">
            <div className="pd-review-num">{(product.averageRating ?? 4.6).toFixed(1)}</div>
            <div className="pd-review-stars" aria-hidden="true">★★★★★</div>
            <div className="pd-review-count">{totalReviews} değerlendirme</div>
          </div>
          <div className="pd-review-bars">
            {ratingDistribution.map((r) => (
              <div key={r.star} className="pd-bar-row">
                <span className="pd-bar-label">{r.star} ★</span>
                <div className="pd-bar-track">
                  <div className="pd-bar-fill" style={{ width: `${(r.count / totalReviews) * 100}%` }} />
                </div>
                <span className="pd-bar-count">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pd-review-list">
          {SAMPLE_REVIEWS.map((r, i) => (
            <article key={i} className="pd-review-card">
              <div className="pd-review-top">
                <div className="pd-review-user">
                  <div className="pd-review-avatar">{r.initial}</div>
                  <div>
                    <div className="pd-review-name">{r.name}</div>
                    <div className="pd-review-date">{r.date}</div>
                  </div>
                </div>
                <span className="pd-review-stars-sm" aria-label={`${r.rating} yıldız`}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </span>
              </div>
              <p className="pd-review-body">{r.body}</p>
              <span className="pd-review-verify">✓ Onaylı satın alma</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
