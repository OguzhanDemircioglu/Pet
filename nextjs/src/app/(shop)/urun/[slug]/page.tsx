import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchProductBySlug, fetchFeaturedProducts, fetchCategories, fetchSiteSettings } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'
import ProductDetailClient from '@/components/product/ProductDetailClient'
import { imgUrl } from '@/lib/utils'

export const revalidate = 1800

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const products = await fetchFeaturedProducts()
    return (products ?? []).map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const product = await fetchProductBySlug(slug)
    if (!product) return {}
    const img = imgUrl(product.primaryImageUrl)
    return {
      title: product.name,
      description: product.shortDescription || `${product.name} — ${product.brandName ?? ''} toptan fiyatıyla PetToptan'da.`,
      openGraph: {
        title: product.name,
        description: product.shortDescription || undefined,
        images: img ? [{ url: img, width: 800, height: 800, alt: product.name }] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const [product, categories, settings] = await Promise.all([
    fetchProductBySlug(slug),
    fetchCategories(),
    fetchSiteSettings(),
  ])

  if (!product) notFound()

  const currentCat = (categories ?? []).find(c => c.category_id === product.categoryId)
  const parentCat = currentCat?.parent_id != null
    ? (categories ?? []).find(c => c.category_id === currentCat.parent_id)
    : null

  const price = product.basePrice
  const availability = product.availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const productImg = imgUrl(product.primaryImageUrl)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: product.brandName ? { '@type': 'Brand', name: product.brandName } : undefined,
    description: product.shortDescription || undefined,
    image: productImg || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TRY',
      price: price.toFixed(2),
      availability,
      url: `https://pettoptan.com.tr/urun/${slug}`,
    },
    ...(product.reviewCount && product.reviewCount > 0 && product.averageRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating.toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://pettoptan.com.tr' },
      ...(parentCat ? [{ '@type': 'ListItem', position: 2, name: parentCat.category_name, item: `https://pettoptan.com.tr/urunler?slug=${parentCat.category_slug}` }] : []),
      ...(currentCat ? [{ '@type': 'ListItem', position: parentCat ? 3 : 2, name: currentCat.category_name, item: `https://pettoptan.com.tr/urunler?slug=${currentCat.category_slug}` }] : []),
      { '@type': 'ListItem', position: (parentCat ? 4 : currentCat ? 3 : 2), name: product.name },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductDetailClient
        product={product}
        settings={settings ?? FALLBACK_SITE_SETTINGS}
        parentCatSlug={parentCat?.category_slug ?? undefined}
        parentCatName={parentCat?.category_name ?? undefined}
      />
    </>
  )
}
