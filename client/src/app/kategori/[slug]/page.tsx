import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { FeaturedProduct } from '@/types'
import { getCategories, getFeaturedProducts } from '@/lib/api/public'
import InfoBar from '@/components/home/InfoBar'
import SiteHeader from '@/components/home/SiteHeader'
import CategoryBar from '@/components/home/CategoryBar'
import SiteFooter from '@/components/home/SiteFooter'
import ProductCard from '@/components/home/ProductCard'
import '@/app/home.css'
import './kategori.css'

export const revalidate = 300

const HERO_DATA: Record<string, { name: string; emoji: string; sub: string; class: string; brands: string[] }> = {
  kedi: { name: 'Kedi Ürünleri', emoji: '🐱', sub: 'Mama, kum, oyuncak ve aksesuarlarda toptan B2B fiyatlar.', class: 'cat-hero-1', brands: ['Royal Canin', 'Whiskas', 'Felix', 'Friskies', "Hill's"] },
  kopek: { name: 'Köpek Ürünleri', emoji: '🐶', sub: 'Tüm ırk ve yaş gruplarına özel premium köpek ürünleri.', class: 'cat-hero-2', brands: ['Pro Plan', 'Pedigree', 'Acana', 'Orijen', 'Iams'] },
  kus: { name: 'Kuş Ürünleri', emoji: '🦜', sub: 'Muhabbet kuşundan papağana — yem, kafes ve aksesuar.', class: 'cat-hero-3', brands: ['Versele-Laga', 'Vitapol', 'Padovan', 'Manitoba'] },
  balik: { name: 'Balık & Akvaryum', emoji: '🐠', sub: 'Akvaryum ekipmanları, su düzenleyici, yem ve dekor.', class: 'cat-hero-4', brands: ['Tetra', 'JBL', 'API', 'Sera', 'Hagen'] },
  kemirgen: { name: 'Kemirgen Ürünleri', emoji: '🐹', sub: 'Hamster, tavşan, kobay için özel ürünler.', class: 'cat-hero-5', brands: ['Vitakraft', 'Versele-Laga', 'Beaphar'] },
  surungen: { name: 'Sürüngen Ürünleri', emoji: '🦎', sub: 'Terraryum, ısı lambası ve özel sürüngen mamaları.', class: 'cat-hero-6', brands: ['Exo Terra', 'Zoo Med', 'Reptiles'] },
}

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const hero = HERO_DATA[slug]
  return {
    title: hero ? `${hero.name} — Toptan Fiyat` : 'Kategori',
    description: hero?.sub,
  }
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params
  const hero = HERO_DATA[slug]
  if (!hero) notFound()

  const [categories, products] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ])

  // Backend yoksa demo görünüm için 8 örnek ürün
  const list: FeaturedProduct[] = products.length > 0 ? products : Array.from({ length: 8 }, (_, i) => ({
    id: 1000 + i,
    name: `${hero.name.replace(' Ürünleri', '').replace(' & Akvaryum', '')} Premium Mama ${i + 1} kg`,
    slug: `demo-${slug}-${i + 1}`,
    brandName: hero.brands[i % hero.brands.length],
    basePrice: 299 + i * 120,
    availableStock: i % 4 === 3 ? 6 : 50,
    unit: 'adet',
    primaryImageUrl: null,
    activeDiscount: i % 3 === 0 ? { label: '%15 İndirim', discountType: 'PERCENT', discountValue: 15 } : null,
    variants: [],
  }))

  const FILTERS_PRICE = [
    { label: '0 — 250 ₺', count: 12 },
    { label: '250 — 500 ₺', count: 28 },
    { label: '500 — 1000 ₺', count: 41 },
    { label: '1000 — 2500 ₺', count: 19 },
    { label: '2500 ₺+', count: 6 },
  ]

  return (
    <>
      <InfoBar />
      <SiteHeader />
      <CategoryBar categories={categories} />
      <main className="cat-page">
        <nav className="cat-bc" aria-label="Sayfa yolu">
          <Link href="/">Anasayfa</Link>
          <span className="sep">›</span>
          <span className="current">{hero.name}</span>
        </nav>

        <section className={`cat-hero ${hero.class}`}>
          <div className="cat-hero-content">
            <span className="cat-hero-badge">📂 {hero.name}</span>
            <h1 className="cat-hero-title">{hero.name}</h1>
            <p className="cat-hero-sub">{hero.sub}</p>
          </div>
          <span className="cat-hero-emoji" aria-hidden="true">{hero.emoji}</span>
        </section>

        <div className="cat-grid">
          <aside className="cat-side" aria-label="Filtreler">
            <div className="cat-side-block">
              <div className="cat-side-title">📂 Alt Kategoriler</div>
              {[
                { label: 'Kuru Mama', count: 38 },
                { label: 'Yaş Mama', count: 22 },
                { label: 'Ödül & Ek Mama', count: 14 },
                { label: 'Aksesuar', count: 19 },
                { label: 'Bakım Ürünleri', count: 11 },
              ].map((f) => (
                <label key={f.label} className="cat-filter">
                  <input type="checkbox" />
                  <span>{f.label}</span>
                  <span className="cat-filter-count">({f.count})</span>
                </label>
              ))}
            </div>

            <div className="cat-side-block">
              <div className="cat-side-title">🏷️ Marka</div>
              {hero.brands.map((b, i) => (
                <label key={b} className="cat-filter">
                  <input type="checkbox" defaultChecked={i === 0} />
                  <span>{b}</span>
                  <span className="cat-filter-count">({Math.floor(Math.random() * 30) + 5})</span>
                </label>
              ))}
            </div>

            <div className="cat-side-block">
              <div className="cat-side-title">💰 Fiyat Aralığı</div>
              {FILTERS_PRICE.map((p) => (
                <label key={p.label} className="cat-filter">
                  <input type="checkbox" />
                  <span>{p.label}</span>
                  <span className="cat-filter-count">({p.count})</span>
                </label>
              ))}
              <div className="cat-price-row" style={{ marginTop: 10 }}>
                <input type="number" placeholder="Min" />
                <span style={{ color: 'var(--text3)' }}>—</span>
                <input type="number" placeholder="Max" />
              </div>
            </div>

            <div className="cat-side-block">
              <div className="cat-side-title">⭐ Diğer</div>
              <label className="cat-filter">
                <input type="checkbox" />
                <span>Stokta olanlar</span>
              </label>
              <label className="cat-filter">
                <input type="checkbox" />
                <span>İndirimli ürünler</span>
              </label>
              <label className="cat-filter">
                <input type="checkbox" />
                <span>4★ ve üzeri</span>
              </label>
            </div>

            <button type="button" className="cat-side-clear">Filtreleri Temizle</button>
          </aside>

          <section className="cat-main">
            <div className="cat-toolbar">
              <div className="cat-result-count">
                <strong>{list.length}</strong> ürün listeleniyor
              </div>
              <div className="cat-sort">
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Sırala:</span>
                <select defaultValue="popularity">
                  <option value="popularity">⭐ Popülerlik</option>
                  <option value="price-asc">💰 Fiyat (Artan)</option>
                  <option value="price-desc">💰 Fiyat (Azalan)</option>
                  <option value="newest">🆕 Yeni Gelenler</option>
                  <option value="discount">🏷️ En Çok İndirim</option>
                </select>
              </div>
            </div>

            <div className="pt-prod-grid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} emojiFallback={hero.emoji} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
