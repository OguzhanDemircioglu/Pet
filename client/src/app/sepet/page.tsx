'use client'
import Link from 'next/link'
import { useState } from 'react'
import InfoBar from '@/components/home/InfoBar'
import SiteHeader from '@/components/home/SiteHeader'
import SiteFooter from '@/components/home/SiteFooter'
import '@/app/home.css'
import './sepet.css'

interface CartItem {
  id: number
  name: string
  brand: string
  variant: string
  price: number
  qty: number
  emoji: string
  imageUrl?: string
}

const DEMO_CART: CartItem[] = [
  { id: 1, name: 'Royal Canin Adult Yetişkin Kedi Maması', brand: 'Royal Canin', variant: '10 kg', price: 1499, qty: 2, emoji: '🐱' },
  { id: 2, name: 'Hill\'s Science Plan Köpek Maması', brand: 'Hill\'s', variant: '14 kg', price: 1899, qty: 1, emoji: '🐶' },
  { id: 3, name: 'Whiskas Pouch Yaş Mama Karma Paket', brand: 'Whiskas', variant: '12x85g', price: 245, qty: 4, emoji: '🥫' },
]

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(DEMO_CART)
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0
  const shipping = subtotal >= 500 ? 0 : 49
  const total = subtotal - discount + shipping

  const updateQty = (id: number, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)))
  }
  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id))
  const applyCoupon = () => {
    if (coupon.trim().toLowerCase() === 'hosgeldin') setCouponApplied(true)
  }

  return (
    <>
      <InfoBar />
      <SiteHeader />
      <main className="cart-page">
        <div className="cart-head">
          <h1 className="cart-title">
            🛒 Sepetim<span className="cart-title-count">({items.length} ürün)</span>
          </h1>
          {items.length > 0 && (
            <button type="button" className="pf-btn-sm" onClick={() => setItems([])}>Sepeti Temizle</button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon" aria-hidden="true">🛒</div>
            <div className="cart-empty-title">Sepetin boş</div>
            <div className="cart-empty-sub">Hadi alışverişe başla — kategori veya kampanyalı ürünlerden seçim yapabilirsin.</div>
            <Link href="/" className="cart-empty-btn">🛍️ Alışverişe Başla</Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-list">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-img" aria-hidden="true">{item.emoji}</div>
                  <div>
                    <div className="cart-info-brand">{item.brand}</div>
                    <div className="cart-info-title">{item.name}</div>
                    <div className="cart-info-variant">Seçenek: {item.variant}</div>
                  </div>
                  <div className="cart-controls">
                    <div className="cart-price">{formatTL(item.price * item.qty)}</div>
                    <div className="cart-qty">
                      <button type="button" onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1} aria-label="Azalt">−</button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)} aria-label="Arttır">+</button>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => remove(item.id)}>✕ Kaldır</button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="cart-summary">
              <h3>📋 Sipariş Özeti</h3>
              <div className="cart-summary-row">
                <span>Ara Toplam ({items.reduce((s, i) => s + i.qty, 0)} adet)</span>
                <span className="cart-summary-val">{formatTL(subtotal)}</span>
              </div>
              {couponApplied && (
                <div className="cart-summary-row cart-summary-discount">
                  <span>Kupon İndirimi (HOSGELDIN)</span>
                  <span className="cart-summary-val">−{formatTL(discount)}</span>
                </div>
              )}
              <div className="cart-summary-row">
                <span>Kargo</span>
                <span className="cart-summary-val">
                  {shipping === 0 ? <span style={{ color: '#16a34a' }}>Ücretsiz 🎉</span> : formatTL(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  💡 {formatTL(500 - subtotal)} daha ekle, kargo ücretsiz!
                </div>
              )}

              <div className="cart-coupon">
                <input
                  type="text"
                  placeholder="İndirim kodu"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  disabled={couponApplied}
                />
                <button type="button" onClick={applyCoupon} disabled={couponApplied}>
                  {couponApplied ? '✓' : 'Uygula'}
                </button>
              </div>

              <div className="cart-summary-row total">
                <span>Toplam</span>
                <span className="cart-summary-val">{formatTL(total)}</span>
              </div>

              <button type="button" className="cart-checkout">
                Ödemeye Geç →
              </button>

              <div className="cart-trust">
                <span className="cart-trust-item">🔒 SSL</span>
                <span className="cart-trust-item">💳 iyzico</span>
                <span className="cart-trust-item">↩️ 14 gün iade</span>
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
