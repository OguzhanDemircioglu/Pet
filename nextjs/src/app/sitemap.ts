import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://pettoptan.com.tr'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE,            lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${SITE}/giris`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/kayit`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
