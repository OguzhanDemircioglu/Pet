import {useEffect, useState} from 'react'
import {Link, useParams} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {imgUrl, productApi} from '../api/productApi'
import {fetchCategoriesThunk} from '../store/categorySlice'
import {addToCart} from '../store/cartSlice'
import {type CanReviewResponse, reviewApi, type ReviewResponse} from '../api/reviewApi'
import toast from 'react-hot-toast'
import type {AppDispatch, RootState} from '../store'
import type {Product, ProductVariant} from '../types'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import {CONTACT_PHONE} from '../constants/app'
import {useIsMobile} from '../hooks/useIsMobile'

const THUMB_BG = [
  'linear-gradient(135deg,#fce7f3,#fdf2f8)',
  'linear-gradient(135deg,#dbeafe,#eff6ff)',
  'linear-gradient(135deg,#dcfce7,#f0fdf4)',
  'linear-gradient(135deg,#fef3c7,#fffbeb)',
]
const THUMB_EMOJIS = ['🐱', '🛍️', '📦', '🏷️']


function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: -1 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  )
}

const STAR_CSS = `
@keyframes petStarRing {
  from, 20% { animation-timing-function: ease-in; opacity: 1; r: 8px; stroke-width: 16px; transform: scale(0); }
  35% { animation-timing-function: ease-out; opacity: .5; r: 8px; stroke-width: 16px; transform: scale(1); }
  50%, to { opacity: 0; r: 16px; stroke-width: 0; transform: scale(1); }
}
@keyframes petStarFill {
  from, 40% { animation-timing-function: ease-out; transform: scale(0); }
  60% { animation-timing-function: ease-in-out; transform: scale(1.2); }
  80% { transform: scale(.9); }
  to { transform: scale(1); }
}
@keyframes petStarStroke {
  from { transform: scale(1); }
  20%, to { transform: scale(0); }
}
@keyframes petStarLine {
  from, 40% { animation-timing-function: ease-out; stroke-dasharray: 1 23; stroke-dashoffset: 1; }
  60%, to { stroke-dasharray: 12 13; stroke-dashoffset: -13; }
}
`

function AnimatedStarRating({ rating, count }: { rating: number; count: number }) {
  const [play, setPlay] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPlay(true), 80)
    return () => clearTimeout(t)
  }, [])

  const filled = Math.round(rating)
  const delays = [0, 0.05, 0.1, 0.15, 0.2]

  return (
    <>
      <style>{STAR_CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 1 }}>
          {[1, 2, 3, 4, 5].map(i => {
            const active = i <= filled
            const delay = `${delays[i - 1]}s`
            const anim = (name: string): React.CSSProperties => play && active ? {
              animationName: name,
              animationDuration: '1s',
              animationTimingFunction: 'ease-in-out',
              animationFillMode: 'forwards',
              animationDelay: delay,
            } : {}
            return (
              <svg key={i} width="19" height="19" viewBox="0 0 32 32" style={{ overflow: 'visible' }}>
                <g transform="translate(16,16)">
                  <circle fill="none" stroke="#f4a825" strokeWidth="16" r="8"
                    style={{ transform: 'scale(0)', ...anim('petStarRing') }} />
                </g>
                <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <g transform="translate(16,16) rotate(180)">
                    <polygon
                      points="0,15 4.41,6.07 14.27,4.64 7.13,-2.32 8.82,-12.14 0,-7.5 -8.82,-12.14 -7.13,-2.32 -14.27,4.64 -4.41,6.07"
                      fill="none" stroke={active ? '#f4a825' : '#c7cad1'}
                      style={play && active ? anim('petStarStroke') : { transform: active ? 'scale(0)' : 'scale(1)' }}
                    />
                    <polygon
                      points="0,15 4.41,6.07 14.27,4.64 7.13,-2.32 8.82,-12.14 0,-7.5 -8.82,-12.14 -7.13,-2.32 -14.27,4.64 -4.41,6.07"
                      fill={active ? '#f4a825' : 'none'} stroke="none"
                      style={{ transform: 'scale(0)', ...anim('petStarFill') }}
                    />
                  </g>
                  {active && (
                    <g transform="translate(16,16)">
                      {[0, 72, 144, 216, 288].map(rot => (
                        <polyline key={rot} transform={`rotate(${rot})`} points="0 4,0 16"
                          stroke="#f4a825"
                          style={{ strokeDasharray: '12 13', strokeDashoffset: '-13', ...anim('petStarLine') }}
                        />
                      ))}
                    </g>
                  )}
                </g>
              </svg>
            )
          })}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{rating.toFixed(1)}</span>
        <span style={{ color: 'var(--border2)', fontSize: 18 }}>·</span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{count} yorum</span>
      </div>
    </>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const categories = useSelector((s: RootState) => s.categories.categories)
  const user = useSelector((s: RootState) => s.auth.user)
  const cartItems = useSelector((s: RootState) => s.cart.items)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [thumbIdx, setThumbIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const isMobile = useIsMobile()

  // Reviews state
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [canReview, setCanReview] = useState<CanReviewResponse | null>(null)
  const [starInput, setStarInput] = useState(0)
  const [commentInput, setCommentInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Edit/delete review state
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [editStar, setEditStar] = useState(0)
  const [editComment, setEditComment] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchCategoriesThunk(false))
  }, [dispatch])

  useEffect(() => {
    if (activeTab !== 'reviews' || !slug || reviewsLoaded) return
    reviewApi.list(slug).then(r => { setReviews(r); setReviewsLoaded(true) }).catch(() => {})
    if (user) reviewApi.canReview(slug).then(setCanReview).catch(() => {})
  }, [activeTab, slug, reviewsLoaded, user])

  useEffect(() => {
    if (!slug) return
    productApi.getBySlug(slug)
      .then(p => {
        setProduct(p); setQty(1)
        const actives = (p.variants ?? []).filter(v => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder)
        // Sadece 2+ varyantta seçim gerekir; tekli varyantta basePrice kullanılır
        setSelectedVariant(actives.length >= 2 ? actives[0] : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar /><Header /><CategoryBar />
      <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 16, color: 'var(--text3)' }}>Yükleniyor...</div>
    </div>
  )

  if (!product) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar /><Header /><CategoryBar />
      <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 18, color: 'var(--text2)' }}>Ürün bulunamadı</div>
    </div>
  )

  const activeVariants = (product?.variants ?? []).filter(v => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder)
  const hasVariants = activeVariants.length >= 2
  const effectivePrice = selectedVariant ? Number(selectedVariant.price) : Number(product?.basePrice ?? 0)
  const effectiveStock = selectedVariant ? selectedVariant.availableStock : (product?.availableStock ?? 0)

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Lütfen bir paket seçin')
      return
    }
    const inCart = cartItems.find(i => i.productId === product.id && i.variantId === (selectedVariant?.id ?? undefined))?.quantity ?? 0
    if (inCart >= effectiveStock) {
      toast.error('Stokta yeterli ürün yok')
      return
    }
    dispatch(addToCart({
      productId: product.id,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      name: product.name,
      slug: product.slug,
      brandName: product.brandName,
      basePrice: effectivePrice,
      unit: product.unit,
      availableStock: effectiveStock,
      primaryImageUrl: product.primaryImageUrl,
      quantity: qty,
    }))
    toast.success('Sepete eklendi')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

  const handleEditReview = (r: ReviewResponse) => {
    setEditingReviewId(r.id)
    setEditStar(r.rating)
    setEditComment(r.comment ?? '')
  }

  const handleEditSubmit = async (r: ReviewResponse) => {
    if (!editStar) { toast.error('Lütfen puan verin'); return }
    setEditSubmitting(true)
    try {
      const updated = await reviewApi.update(slug!, r.id, editStar, editComment)
      setReviews(prev => prev.map(x => x.id === r.id ? updated : x))
      setEditingReviewId(null)
      toast.success('Yorumunuz güncellendi')
    } catch { toast.error('Güncelleme başarısız') }
    finally { setEditSubmitting(false) }
  }

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await reviewApi.delete(slug!, reviewId)
      setReviews(prev => prev.filter(x => x.id !== reviewId))
      // canReview'u yenile — kullanıcı tekrar yorum yapabilir
      if (user) reviewApi.canReview(slug!).then(setCanReview).catch(() => {})
      toast.success('Yorumunuz silindi')
    } catch { toast.error('Silme başarısız') }
  }

  // Reviews tab açılınca gerçek listeden güncelle; açılmadan önce product verisini kullan
  const displayReviewCount = reviewsLoaded ? reviews.length : (product.reviewCount ?? 0)
  const displayAvgRating = reviewsLoaded && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : (product.averageRating ?? 0)

  const currentCat = categories.find(c => c.category_id === product.categoryId)
  const parentCat = currentCat?.parent_id != null
    ? categories.find(c => c.category_id === currentCat.parent_id)
    : null

  const productImgs = (product.images ?? []).slice().sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.displayOrder - b.displayOrder
  })
  const hasRealImages = productImgs.length > 0
  const activeImg = hasRealImages ? productImgs[activeImgIdx] : null
  const mainBg = THUMB_BG[thumbIdx]
  const mainEmoji = hasRealImages ? null : THUMB_EMOJIS[thumbIdx]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 12px' : '0 20px' }}>

        {/* Breadcrumb */}
        <nav style={{ padding: '16px 0 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text2)' }}>Ana Sayfa</Link>
          {parentCat && (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <Link to={`/urunler?slug=${parentCat.category_slug}`} style={{ fontSize: 13, color: 'var(--text2)' }}>{parentCat.category_name}</Link>
            </>
          )}
          <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
          <Link to={`/urunler?slug=${product.categorySlug}`} style={{ fontSize: 13, color: 'var(--text2)' }}>{product.categoryName}</Link>
          <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* Product Section */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 36, padding: '8px 0 36px', alignItems: 'start' }}>

          {/* LEFT: Gallery */}
          <div>
            <div style={{
              background: hasRealImages ? 'var(--bg2)' : mainBg,
              borderRadius: 'var(--r2)',
              border: '1px solid var(--border)',
              height: isMobile ? 280 : 380,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? 80 : 110, marginBottom: 12, position: 'relative', overflow: 'hidden', cursor: 'zoom-in',
            }}>
              {activeImg
                ? <img src={imgUrl(activeImg.imageUrl)} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 16 }} />
                : <span>{mainEmoji}</span>
              }
            </div>
            {hasRealImages ? (
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                {productImgs.map((img, i) => (
                  <div key={img.id} onClick={() => setActiveImgIdx(i)} style={{
                    width: 72, height: 72, borderRadius: 'var(--r)',
                    border: `2.5px solid ${i === activeImgIdx ? 'var(--primary)' : 'var(--border)'}`,
                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    boxShadow: i === activeImgIdx ? '0 0 0 2px rgba(220,38,38,.2)' : 'none',
                  }}>
                    <img src={imgUrl(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
                {THUMB_BG.map((bg, i) => (
                  <div key={i} onClick={() => setThumbIdx(i)} style={{
                    borderRadius: 'var(--r)', border: `2px solid ${i === thumbIdx ? 'var(--primary)' : 'var(--border)'}`,
                    height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 34, cursor: 'pointer', transition: '0.18s', background: bg,
                    boxShadow: i === thumbIdx ? '0 0 0 2px rgba(220,38,38,.25)' : 'none',
                  }}>
                    {THUMB_EMOJIS[i]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info */}
          <div>
            {product.brandName && <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.8,
              padding: '4px 11px',
              borderRadius: 5,
              border: '1px solid rgba(220,38,38,.25)',
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              {product.brandName}
            </div>}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, marginBottom: 12 }}>{product.name}</h1>

            {displayReviewCount > 0 && displayAvgRating > 0 && (
              <AnimatedStarRating rating={displayAvgRating} count={displayReviewCount} />
            )}
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>SKU: {product.sku}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {effectiveStock > 0
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid rgba(34,197,94,.3)' }}>✓ Stokta Var</span>
                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)' }}>✕ Stokta Yok</span>
              }
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>🚚 1-3 İş Günü Teslimat</span>
            </div>

            {/* Variant Selector */}
            {hasVariants && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                  Paket Seçin <span style={{ color: 'var(--primary)' }}>*</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {activeVariants.map(v => {
                    const isSelected = selectedVariant?.id === v.id
                    const outOfStock = v.availableStock <= 0
                    return (
                      <button
                        key={v.id}
                        onClick={() => { if (!outOfStock) { setSelectedVariant(isSelected ? null : v); setQty(1) } }}
                        disabled={outOfStock}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--r)',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--primary-bg)' : 'var(--bg2)',
                          color: outOfStock ? 'var(--text3)' : isSelected ? 'var(--primary)' : 'var(--text)',
                          fontSize: 13, fontWeight: 700,
                          cursor: outOfStock ? 'not-allowed' : 'pointer',
                          opacity: outOfStock ? 0.5 : 1,
                          transition: '0.15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        }}
                      >
                        <span>{v.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text2)' }}>
                          ₺{Number(v.price).toFixed(2)}
                        </span>
                        {outOfStock && <span style={{ fontSize: 10, color: 'var(--text3)' }}>Tükendi</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price Block */}
            <div style={{ marginBottom: 18 }}>
              {!hasVariants && product.activeDiscount ? (() => {
                const disc = product.activeDiscount!
                const newPrice = disc.discountType === 'PERCENT'
                  ? effectivePrice * (1 - disc.discountValue / 100)
                  : effectivePrice - disc.discountValue
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>₺{newPrice.toFixed(2)}</div>
                    <div style={{ fontSize: 18, color: 'var(--text3)', textDecoration: 'line-through' }}>₺{effectivePrice.toFixed(2)}</div>
                    <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                      {disc.label} İndirim
                    </span>
                  </div>
                )
              })() : (
                hasVariants && selectedVariant
                  ? <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>₺{effectivePrice.toFixed(2)}</div>
                  : !hasVariants
                    ? <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>₺{effectivePrice.toFixed(2)}</div>
                    : <div style={{ fontSize: 15, color: 'var(--text3)', fontStyle: 'italic' }}>Paket seçin</div>
              )}
              {(selectedVariant || !hasVariants) && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>/ {selectedVariant?.label ?? product.unit} · KDV dahil</div>
              )}
            </div>

            {/* Qty Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Adet:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 38, height: 38, background: 'var(--primary)', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>−</button>
                <div style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'var(--text)', background: 'var(--bg2)', height: 38, lineHeight: '38px', borderLeft: '2px solid var(--border2)', borderRight: '2px solid var(--border2)' }}>{qty}</div>
                <button onClick={() => {
                  if (qty >= effectiveStock) { toast.error('Stokta yeterli ürün yok'); return }
                  setQty(qty + 1)
                }} style={{ width: 38, height: 38, background: 'var(--primary)', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>+</button>
              </div>
              {effectiveStock > 0 && effectiveStock < 10 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 20, padding: '2px 10px' }}>
                  ⚠️ Son {effectiveStock} stok!
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button
                onClick={effectiveStock > 0 ? handleAddToCart : undefined}
                disabled={effectiveStock <= 0}
                style={{
                  width: '100%',
                  background: effectiveStock <= 0 ? '#e5e7eb' : addedToCart ? '#22c55e' : 'var(--primary)',
                  color: effectiveStock <= 0 ? '#111' : '#fff',
                  fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 'var(--r)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: '0.2s',
                  boxShadow: effectiveStock > 0 ? '0 4px 12px rgba(220,38,38,.35)' : 'none',
                  border: 'none',
                  cursor: effectiveStock <= 0 ? 'not-allowed' : 'pointer',
                }}>
                {effectiveStock <= 0 ? '✕ Stokta Yok' : addedToCart ? '✅ Sepete Eklendi!' : '🛒 Sepete Ekle'}
              </button>
              <a href={`https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(`Merhaba, "${product.name}" ürünü hakkında bilgi almak istiyorum.`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  width: '100%', background: '#22c55e', color: '#fff',
                  fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 'var(--r)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: '0.2s', boxShadow: '0 4px 12px rgba(34,197,94,.3)', textDecoration: 'none',
                }}>
                💬 Satıcıya Sor — +90 552 773 59 94
              </a>
            </div>

            {/* Price Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[['✅', 'KDV dahil fiyat'], ['🚚', '5.000 ₺ üzeri ücretsiz kargo'], ['🔄', '14 gün iade hakkı']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 36 }} id="tabs">
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
            {(['desc', 'specs', 'reviews'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '12px 22px', fontSize: 14, fontWeight: 600,
                color: activeTab === t ? 'var(--primary)' : 'var(--text2)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -2, transition: '0.18s',
              }}>
                {t === 'desc' ? 'Açıklama' : t === 'specs' ? 'Özellikler' : <>Yorumlar {displayReviewCount > 0 && <span style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 2 }}>{displayReviewCount}</span>}</>}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeTab === 'desc' && (
            <div>
              {product.shortDescription && <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 14 }}>{product.shortDescription}</p>}
              <div style={{ background: 'var(--primary-bg)', borderLeft: '4px solid var(--primary)', padding: '14px 18px', borderRadius: '0 var(--r) var(--r) 0', margin: '18px 0', fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                🏆 {import.meta.env.VITE_BRAND_PART1}{import.meta.env.VITE_BRAND_PART2}, en kaliteli pet ürünlerini toptan fiyatlarla sunan güvenilir platformunuzdur.
              </div>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 14 }}>
                <strong style={{ color: 'var(--text)' }}>Toptan alım avantajı:</strong> Bu ürün özel toptan fiyatlarıyla sunulmaktadır. Pet shop, veteriner klinikleri ve işletmeler için ideal toptan çözüm.
              </p>
            </div>
          )}

          {/* Specs */}
          {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { key: 'Marka', val: product.brandName },
                { key: 'SKU', val: product.sku },
                { key: 'Birim', val: product.unit },
                { key: 'Stok', val: `${product.availableStock} adet` },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{s.key}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div>
              {/* Özet */}
              {reviews.length > 0 && (() => {
                const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                const counts = [5,4,3,2,1].map(s => reviews.filter(r => r.rating === s).length)
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 32, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{avg.toFixed(1)}</div>
                      <Stars count={Math.round(avg)} size={18} />
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{reviews.length} yorum</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5,4,3,2,1].map((star, i) => (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', width: 28, textAlign: 'right', flexShrink: 0 }}>{star} ★</span>
                          <div style={{ flex: 1, height: 7, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 4, background: star >= 4 ? 'var(--primary)' : star === 3 ? '#f59e0b' : '#ef4444', width: `${reviews.length ? counts[i] / reviews.length * 100 : 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text3)', width: 20, flexShrink: 0 }}>{counts[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Yorum Formu */}
              {!user ? (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Yorum yapmak için giriş yapın</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Sadece sipariş veren üyeler yorum yapabilir.</div>
                </div>
              ) : canReview?.reason === 'not_ordered' ? (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Bu ürünü satın almış olmanız gerekiyor</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Yalnızca sipariş veren müşteriler yorum yapabilir.</div>
                </div>
              ) : canReview?.reason === 'already_reviewed' ? null
              : canReview?.canReview ? (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Yorum Yaz</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Puanınız <span style={{ color: 'var(--primary)' }}>*</span></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setStarInput(s)}
                          style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= starInput ? '#f59e0b' : 'var(--border2)', lineHeight: 1, padding: 0, transition: '0.1s' }}>★</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Yorum <span style={{ fontSize: 11, color: 'var(--text3)' }}>(opsiyonel)</span></div>
                    <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} rows={3}
                      placeholder="Ürün hakkında düşüncelerinizi paylaşın..."
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button disabled={submitting || starInput === 0} onClick={async () => {
                    if (!starInput) { toast.error('Lütfen puan verin'); return }
                    setSubmitting(true)
                    try {
                      await reviewApi.create(slug!, starInput, commentInput)
                      setStarInput(0); setCommentInput('')
                      setReviewsLoaded(false)   // sunucudan güncel listeyi çek
                      toast.success('Yorumunuz eklendi')
                    } catch { toast.error('Yorum gönderilemedi') }
                    finally { setSubmitting(false) }
                  }} style={{ padding: '10px 24px', background: starInput ? 'var(--primary)' : 'var(--bg3)', color: starInput ? '#fff' : 'var(--text3)', border: 'none', borderRadius: 'var(--r)', fontSize: 13, fontWeight: 700, cursor: starInput ? 'pointer' : 'not-allowed' }}>
                    {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                  </button>
                </div>
              ) : null}

              {/* Yorum Listesi */}
              {reviews.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 14 }}>Henüz yorum yok. İlk yorumu siz yapın!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.map(r => {
                    const isOwn = user != null && r.userId === user.id
                    const isEditing = editingReviewId === r.id
                    return (
                      <div key={r.id} style={{ background: 'var(--bg2)', border: `1px solid ${isOwn ? 'rgba(220,38,38,.25)' : 'var(--border)'}`, borderRadius: 'var(--r2)', padding: '18px 20px' }}>
                        {/* Kart başlığı */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, background: 'var(--primary)' }}>{r.userName.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                                {r.userName}
                                {isOwn && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>( Siz )</span>}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(r.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {!isEditing && <Stars count={r.rating} size={14} />}
                            {isOwn && !isEditing && (
                              <>
                                <button onClick={() => handleEditReview(r)} title="Düzenle"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '2px 4px', color: 'var(--text3)', lineHeight: 1 }}>✏️</button>
                                <button onClick={() => handleDeleteReview(r.id)} title="Sil"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '2px 4px', color: 'var(--text3)', lineHeight: 1 }}>🗑️</button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Düzenleme formu */}
                        {isEditing ? (
                          <div>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                              {[1,2,3,4,5].map(s => (
                                <button key={s} type="button" onClick={() => setEditStar(s)}
                                  style={{ fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', color: s <= editStar ? '#f59e0b' : 'var(--border2)', lineHeight: 1, padding: 0, transition: '0.1s' }}>★</button>
                              ))}
                            </div>
                            <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={3}
                              placeholder="Yorumunuzu düzenleyin..."
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button disabled={editSubmitting || editStar === 0} onClick={() => handleEditSubmit(r)}
                                style={{ padding: '8px 20px', background: editStar ? 'var(--primary)' : 'var(--bg3)', color: editStar ? '#fff' : 'var(--text3)', border: 'none', borderRadius: 'var(--r)', fontSize: 13, fontWeight: 700, cursor: editStar ? 'pointer' : 'not-allowed' }}>
                                {editSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                              </button>
                              <button onClick={() => setEditingReviewId(null)}
                                style={{ padding: '8px 16px', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: 13, cursor: 'pointer' }}>
                                İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {r.comment && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>{r.comment}</p>}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4, marginTop: r.comment ? 10 : 0 }}>✓ Onaylı Satın Alma</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  )
}
