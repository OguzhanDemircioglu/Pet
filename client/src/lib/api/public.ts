import type { Brand, Category, FeaturedProduct, Product } from '@/types'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '')

interface ApiResponse<T> {
  success?: boolean
  message?: string
  data?: T
}

async function apiGet<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<T> | T
    if (json && typeof json === 'object' && 'success' in (json as ApiResponse<T>)) {
      const wrapped = json as ApiResponse<T>
      if (!wrapped.success) return null
      return (wrapped.data ?? null) as T | null
    }
    return json as T
  } catch {
    return null
  }
}

export async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  return (await apiGet<FeaturedProduct[]>('/products/featured', 300)) ?? []
}

export async function getNewArrivals(): Promise<FeaturedProduct[]> {
  return (await apiGet<FeaturedProduct[]>('/products/new-arrivals', 300)) ?? []
}

export async function getDeals(): Promise<FeaturedProduct[]> {
  return (await apiGet<FeaturedProduct[]>('/products/deals', 300)) ?? []
}

export async function getCategories(): Promise<Category[]> {
  return (await apiGet<Category[]>('/categories', 3600)) ?? []
}

export async function getBrands(): Promise<Brand[]> {
  return (await apiGet<Brand[]>('/brands', 3600)) ?? []
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return await apiGet<Product>(`/products/${encodeURIComponent(slug)}`, 300)
}
