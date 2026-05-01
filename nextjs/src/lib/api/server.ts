import { auth } from '@/lib/auth'
import type {
  CatalogResponse, Product, SiteSettings, FeaturedProduct, CampaignResponse, Category,
} from '@/types'

const BASE_URL = process.env.API_URL || 'http://localhost:8080'

type FetchOptions = RequestInit & {
  next?: { revalidate?: number; tags?: string[] }
}

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d && typeof d === 'object' && 'success' in d) {
    if (!d.success) throw new Error((d.message as string) || 'API hatası')
    return ('data' in d ? d.data : d) as T
  }
  return data as T
}

/**
 * Public server fetch — auth() ÇAĞIRMAZ.
 * Bu sayede sayfa Next.js tarafından statik (ISR) olarak işaretlenebilir.
 * Tüm public ürün/kategori/site-settings çağrılarında bunu kullanın.
 *
 * Backend erişilemezse (build time / network outage) hata fırlatmak
 * yerine null döner — sayfaların yıkılmasını önler. Caller `?? fallback`
 * pattern'i ile karşılıyor.
 */
export async function serverFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const { next, ...restOptions } = options

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...restOptions,
      headers,
      ...(next ? { next } : {}),
    })

    if (res.status === 404) return null as T
    if (!res.ok) {
      console.error(`[serverFetch] ${res.status} ${path}`)
      return null as T
    }

    const json = await res.json()
    return unwrap<T>(json)
  } catch (e) {
    // Network error (ECONNREFUSED, DNS, timeout). Build sırasında veya
    // backend kapalıyken sayfaları yıkmamak için null döneriz.
    console.error(`[serverFetch] network error on ${path}:`, e instanceof Error ? e.message : e)
    return null as T
  }
}

/**
 * Authenticated server fetch — auth() çağırır, session'daki accessToken'ı header'a ekler.
 * Bu kullanıldığında sayfa otomatik olarak DYNAMIC olur (cookie okunduğu için).
 * Sadece kullanıcıya özel veri çeken sunucu kodlarında kullanın.
 */
export async function serverFetchAuth<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const session = await auth()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  const { next, ...restOptions } = options

  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers,
    ...(next ? { next } : {}),
  })

  if (res.status === 404) return null as T
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)

  const json = await res.json()
  return unwrap<T>(json)
}

// ───────────────── Public endpoints (ISR-friendly) ─────────────────

export function fetchPublicCatalog(): Promise<CatalogResponse> {
  return serverFetch<CatalogResponse>('/public/catalog', {
    next: { revalidate: 600, tags: ['catalog'] },
  })
}

export function fetchFeaturedProducts(): Promise<FeaturedProduct[]> {
  return serverFetch<FeaturedProduct[]>('/products/featured', {
    next: { revalidate: 3600, tags: ['featured'] },
  })
}

export function fetchDeals(): Promise<FeaturedProduct[]> {
  return serverFetch<FeaturedProduct[]>('/products/deals', {
    next: { revalidate: 3600, tags: ['deals'] },
  })
}

export function fetchBestSellers(): Promise<FeaturedProduct[]> {
  return serverFetch<FeaturedProduct[]>('/products/best-sellers', {
    next: { revalidate: 3600, tags: ['best-sellers'] },
  })
}

export function fetchNewArrivals(): Promise<FeaturedProduct[]> {
  return serverFetch<FeaturedProduct[]>('/products/new-arrivals', {
    next: { revalidate: 3600, tags: ['new-arrivals'] },
  })
}

export function fetchActiveCampaigns(): Promise<CampaignResponse[]> {
  return serverFetch<CampaignResponse[]>('/public/campaigns', {
    next: { revalidate: 3600, tags: ['campaigns'] },
  })
}

export function fetchProductBySlug(slug: string): Promise<Product | null> {
  return serverFetch<Product | null>(`/products/${slug}`, {
    next: { revalidate: 1800, tags: [`product-${slug}`] },
  })
}

export function fetchCategories(): Promise<Category[]> {
  return serverFetch<Category[]>('/categories', {
    next: { revalidate: 600, tags: ['categories'] },
  })
}

export function fetchSiteSettings(): Promise<SiteSettings> {
  return serverFetch<SiteSettings>('/public/site-settings', {
    next: { revalidate: 86400, tags: ['site-settings'] },
  })
}
