import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Product } from '@/types'
import {
  getBrands,
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
} from '@/lib/api/public'

const DEMO_PRODUCT: Product = {
  id: 0,
  name: 'Royal Canin Adult Yetişkin Kedi Maması 10 kg',
  slug: 'demo',
  sku: 'RC-ADL-10KG',
  shortDescription: 'Yetişkin kediler için dengeli, premium kuru mama. Kalıcı sindirim sağlığı, parlak tüy yapısı ve güçlü bağışıklık sistemi için özel formül.',
  categoryName: 'Kedi Maması',
  categorySlug: 'kedi',
  categoryId: 1,
  brandId: 1,
  brandName: 'Royal Canin',
  basePrice: 1499,
  availableStock: 42,
  unit: 'adet',
  isActive: true,
  isFeatured: true,
  primaryImageUrl: null,
  averageRating: 4.6,
  reviewCount: 49,
  images: [
    { id: 1, imageUrl: '', isPrimary: true, displayOrder: 0 },
    { id: 2, imageUrl: '', isPrimary: false, displayOrder: 1 },
    { id: 3, imageUrl: '', isPrimary: false, displayOrder: 2 },
    { id: 4, imageUrl: '', isPrimary: false, displayOrder: 3 },
  ],
  activeDiscount: { label: '%15 İndirim', discountType: 'PERCENT', discountValue: 15 },
  variants: [
    { id: 1, label: '2 kg', price: 449, stockQuantity: 60, availableStock: 60, displayOrder: 0, isActive: true },
    { id: 2, label: '4 kg', price: 749, stockQuantity: 50, availableStock: 50, displayOrder: 1, isActive: true },
    { id: 3, label: '10 kg', price: 1499, stockQuantity: 42, availableStock: 42, displayOrder: 2, isActive: true },
    { id: 4, label: '15 kg', price: 1999, stockQuantity: 18, availableStock: 18, displayOrder: 3, isActive: true },
  ],
}
import InfoBar from '@/components/home/InfoBar'
import SiteHeader from '@/components/home/SiteHeader'
import CategoryBar from '@/components/home/CategoryBar'
import SiteFooter from '@/components/home/SiteFooter'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import ProductTabs from '@/components/product/ProductTabs'
import RelatedProducts from '@/components/product/RelatedProducts'
import '@/app/home.css'
import './urun.css'

export const revalidate = 300

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const fetched = await getProductBySlug(slug)
  const product = fetched ?? (slug === 'demo' ? DEMO_PRODUCT : null)
  if (!product) return { title: 'Ürün bulunamadı' }
  return {
    title: product.name,
    description: product.shortDescription ?? `${product.name} — toptan B2B fiyat`,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? '',
      images: product.primaryImageUrl ? [product.primaryImageUrl] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params

  const [fetched, categories, related] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
    getFeaturedProducts(),
  ])

  // Backend down veya ürün yoksa, /urun/demo slug'u için demo veri göster
  const product = fetched ?? (slug === 'demo' ? DEMO_PRODUCT : null)
  if (!product) notFound()

  // SiteHeader hâlâ brands kullanıyor — anasayfa orchestrator pattern'i
  const brands = await getBrands()
  void brands // brand strip ürün detayında yok, ama SiteFooter ileride kullanır

  return (
    <>
      <InfoBar />
      <SiteHeader />
      <CategoryBar categories={categories} />
      <main className="pd-page">
        {/* Breadcrumb */}
        <nav className="pd-bc" aria-label="Sayfa yolu">
          <Link href="/">Anasayfa</Link>
          <span className="pd-bc-sep">›</span>
          {product.categorySlug && product.categoryName ? (
            <>
              <Link href={`/kategori/${product.categorySlug}`}>{product.categoryName}</Link>
              <span className="pd-bc-sep">›</span>
            </>
          ) : null}
          <span className="pd-bc-current">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="pd-section">
          <ProductGallery
            images={product.images}
            productName={product.name}
            badge={product.activeDiscount?.label ?? (product.isFeatured ? 'ÖNE ÇIKAN' : null)}
            emojiFallback="📦"
          />
          <ProductInfo product={product} />
        </div>

        {/* Tabs */}
        <ProductTabs product={product} />

        {/* Related */}
        <RelatedProducts products={related.filter((p) => p.id !== product.id)} />
      </main>
      <SiteFooter />
    </>
  )
}
