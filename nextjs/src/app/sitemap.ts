import type { MetadataRoute } from 'next'
import { fetchPublicCatalog, fetchCategories } from '@/lib/api/server'

const SITE = 'https://pettoptan.com.tr'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, categories] = await Promise.all([
    fetchPublicCatalog().catch(() => null),
    fetchCategories().catch(() => []),
  ])
  const products = catalog?.products ?? []

  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/urunler`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/hakkimizda`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/iletisim`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/sss`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/gizlilik-politikasi`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const productUrls: MetadataRoute.Sitemap = products.map(p => ({
    url: `${SITE}/urun/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: p.isFeatured ? 0.8 : 0.6,
  }))

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? [])
    .filter(c => c.parent_id != null && c.has_product)
    .map(c => ({
      url: `${SITE}/urunler?slug=${c.category_slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticUrls, ...categoryUrls, ...productUrls]
}
