import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/profil', '/odeme-sonuc', '/api/', '/giris'],
      },
    ],
    sitemap: 'https://pettoptan.com.tr/sitemap.xml',
    host: 'https://pettoptan.com.tr',
  }
}
