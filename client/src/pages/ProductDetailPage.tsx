import {useEffect, useState} from 'react'
import {Link, useParams} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {imgUrl, productApi} from '../api/productApi'
import {fetchCategoriesThunk} from '../store/categorySlice'
import {addToCart} from '../store/cartSlice'
import toast from 'react-hot-toast'
import type {AppDispatch, RootState} from '../store'
import type {Product} from '../types'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'

const THUMB_BG = [
  'linear-gradient(135deg,#fce7f3,#fdf2f8)',
  'linear-gradient(135deg,#dbeafe,#eff6ff)',
  'linear-gradient(135deg,#dcfce7,#f0fdf4)',
  'linear-gradient(135deg,#fef3c7,#fffbeb)',
]
const THUMB_EMOJIS = ['🐱', '🛍️', '📦', '🏷️']

const SPECS_DEMO = [
  { key: 'Marka', val: 'Royal Canin' },
  { key: 'Ağırlık', val: '10 kg' },
  { key: 'Hedef Yaş', val: '1+ Yaş (Yetişkin)' },
  { key: 'Ham Protein', val: '%32' },
  { key: 'Ham Yağ', val: '%18' },
  { key: 'Ham Kül', val: '%7.8' },
  { key: 'Nem', val: '%8.5' },
  { key: 'Metabolik Enerji', val: '3.847 kcal/kg' },
  { key: 'Üretim Yeri', val: 'Fransa' },
  { key: 'Raf Ömrü', val: '18 Ay' },
  { key: 'KDV Oranı', val: '%20' },
  { key: 'Saklama Koşulu', val: 'Serin ve kuru yerde' },
]

const REVIEWS_DEMO = [
  { initial: 'M', color: '#f97316', name: 'Mehmet K.', date: '12 Ocak 2024', stars: 5, text: 'Pet shopumuz için düzenli olarak 10\'lu koli alıyoruz. Kediler çok seviyor. Toptan fiyatlar gerçekten rekabetçi, kargo da hızlı geldi.' },
  { initial: 'A', color: '#38bdf8', name: 'Ayşe D.', date: '28 Aralık 2023', stars: 5, text: 'Veteriner kliniğimiz için aldık. Ürün orijinal ve ambalajı sağlam geldi. Fiyat-performans açısından en iyi seçenek.' },
  { initial: 'K', color: '#22c55e', name: 'Kerem T.', date: '5 Kasım 2023', stars: 4, text: 'Genel olarak memnunum. Ürün kalitesi her zamanki gibi iyi. Tek eksiğim kargonun bir gün gecikmesi oldu.' },
]

function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: size, letterSpacing: -1 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const categories = useSelector((s: RootState) => s.categories.categories)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [thumbIdx, setThumbIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    dispatch(fetchCategoriesThunk(false))
  }, [dispatch])

  useEffect(() => {
    if (!slug) return
    productApi.getBySlug(slug)
      .then(p => { setProduct(p); setQty(p.moq) })
      .catch(console.error)
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

  const effectivePrice = product.priceTiers.length > 0
    ? product.priceTiers.find(t => qty >= t.minQuantity && (t.maxQuantity === null || qty <= t.maxQuantity))?.unitPrice ?? product.basePrice
    : product.basePrice

  const getTierIdx = (q: number) => {
    if (!product.priceTiers.length) return -1
    return product.priceTiers.findIndex(t => q >= t.minQuantity && (t.maxQuantity === null || q <= t.maxQuantity))
  }

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: product.id, name: product.name, slug: product.slug, brandName: product.brandName, basePrice: Number(effectivePrice), unit: product.unit, moq: product.moq, primaryImageUrl: product.primaryImageUrl }))
    toast.success('Sepete eklendi')
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1800)
  }

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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, padding: '8px 0 36px', alignItems: 'start' }}>

          {/* LEFT: Gallery */}
          <div>
            <div style={{
              background: hasRealImages ? 'var(--bg2)' : mainBg,
              borderRadius: 'var(--r2)',
              border: '1px solid var(--border)',
              height: 380,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 110, marginBottom: 12, position: 'relative', overflow: 'hidden', cursor: 'zoom-in',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Stars count={4} size={17} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>4.5</span>
              <span style={{ color: 'var(--border2)', fontSize: 18 }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>12 yorum</span>
              <span style={{ color: 'var(--border2)', fontSize: 18 }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>SKU: {product.sku}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid rgba(34,197,94,.3)' }}>✓ Stokta Var</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid rgba(220,38,38,.3)' }}>Min. {product.moq} adet</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>🚚 1-3 İş Günü Teslimat</span>
            </div>

            {/* Price Tier Table */}
            {product.priceTiers.length > 0 && (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                  💡 Toptan Fiyat Kademesi — Miktar arttıkça kazanırsınız
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Miktar', 'Birim Fiyat', 'İndirim'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.priceTiers.map((t, i) => {
                      const isActive = i === getTierIdx(qty)
                      return (
                        <tr key={i} style={{ background: isActive ? 'rgba(220,38,38,.08)' : 'transparent' }}>
                          <td style={{ padding: '10px 14px', fontSize: 14, borderBottom: i < product.priceTiers.length - 1 ? '1px solid var(--border)' : 'none', fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--primary)' : 'var(--text)' }}>
                            {t.minQuantity}{t.maxQuantity ? `–${t.maxQuantity}` : '+'} adet
                            {isActive && <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}> ← Seçili</span>}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: isActive ? 16 : 14, fontWeight: 800, color: isActive ? 'var(--primary)' : 'var(--text2)', borderBottom: i < product.priceTiers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            ₺{Number(t.unitPrice).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 14px', borderBottom: i < product.priceTiers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            {i === 0 ? <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span> : (
                              <span style={{ display: 'inline-block', background: i === 1 ? 'var(--primary)' : i === 2 ? '#16a34a' : '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                                %{Math.round((1 - Number(t.unitPrice) / Number(product.priceTiers[0].unitPrice)) * 100)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Qty Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Adet:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
                <button onClick={() => setQty(Math.max(product.moq, qty - 1))} style={{ width: 38, height: 38, background: 'var(--primary)', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>−</button>
                <div style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: 800, color: 'var(--text)', background: 'var(--bg2)', height: 38, lineHeight: '38px', borderLeft: '2px solid var(--border2)', borderRight: '2px solid var(--border2)' }}>{qty}</div>
                <button onClick={() => setQty(qty + 1)} style={{ width: 38, height: 38, background: 'var(--primary)', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>+</button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Min. {product.moq} · Stok: {product.availableStock} {product.unit}</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={handleAddToCart} style={{
                width: '100%', background: addedToCart ? '#22c55e' : 'var(--primary)', color: '#fff',
                fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 'var(--r)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: '0.2s', boxShadow: '0 4px 12px rgba(220,38,38,.35)', border: 'none', cursor: 'pointer',
              }}>
                {addedToCart ? '✅ Sepete Eklendi!' : '🛒 Sepete Ekle'}
              </button>
              <a href={`https://wa.me/${import.meta.env.VITE_CONTACT_PHONE || '905527735994'}?text=${encodeURIComponent(`Merhaba, "${product.name}" ürünü hakkında bilgi almak istiyorum.`)}`}
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
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
            {(['desc', 'specs', 'reviews'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '12px 22px', fontSize: 14, fontWeight: 600,
                color: activeTab === t ? 'var(--primary)' : 'var(--text2)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -2, transition: '0.18s',
              }}>
                {t === 'desc' ? 'Açıklama' : t === 'specs' ? 'Özellikler' : <>Yorumlar <span style={{ background: 'var(--bg3)', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 2 }}>12</span></>}
              </button>
            ))}
          </div>

          {/* Description */}
          {activeTab === 'desc' && (
            <div>
              {product.shortDescription && <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 14 }}>{product.shortDescription}</p>}
              <div style={{ background: 'var(--primary-bg)', borderLeft: '4px solid var(--primary)', padding: '14px 18px', borderRadius: '0 var(--r) var(--r) 0', margin: '18px 0', fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                🏆 Patilya, en kaliteli pet ürünlerini toptan fiyatlarla sunan güvenilir platfromunuzdur.
              </div>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 14 }}>
                <strong style={{ color: 'var(--text)' }}>Toptan alım avantajı:</strong> Bu ürün minimum {product.moq} adet ile özel toptan fiyatlarıyla sunulmaktadır. Pet shop, veteriner klinikleri ve işletmeler için ideal toptan çözüm.
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
                { key: 'Min. Sipariş', val: `${product.moq} adet` },
                { key: 'Stok', val: `${product.availableStock} adet` },
                ...SPECS_DEMO.slice(2),
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>4.5</div>
                  <div style={{ fontSize: 20, color: '#f59e0b', margin: '4px 0' }}>★★★★½</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>12 değerlendirme</div>
                </div>
                <div style={{ flex: 1 }}>
                  {[[5, 62, 7], [4, 25, 3], [3, 8, 1], [2, 8, 1], [1, 0, 0]].map(([star, pct, cnt]) => (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)', width: 28, textAlign: 'right', flexShrink: 0 }}>{star} ★</span>
                      <div style={{ flex: 1, height: 7, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: star >= 4 ? 'var(--primary)' : star === 3 ? '#f59e0b' : '#ef4444', width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text3)', width: 20, flexShrink: 0 }}>{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {REVIEWS_DEMO.map((r, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0, background: r.color }}>{r.initial}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.date}</div>
                        </div>
                      </div>
                      <Stars count={r.stars} size={14} />
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 8 }}>{r.text}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4 }}>✓ Onaylı Satın Alma</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <Footer />
    </div>
  )
}
