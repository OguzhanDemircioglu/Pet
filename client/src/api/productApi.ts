import api from './axios'
import type { Product, Category, Page } from '../types'

export const productApi = {
  list: (params?: { categoryId?: number; q?: string; page?: number; size?: number }) =>
    api.get<Page<Product>>('/products', { params }).then(r => r.data),

  featured: () =>
    api.get<Product[]>('/products/featured').then(r => r.data),

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`).then(r => r.data),
}

export const categoryApi = {
  list: () =>
    api.get<Category[]>('/categories').then(r => r.data),

  getBySlug: (slug: string) =>
    api.get<Category>(`/categories/${slug}`).then(r => r.data),
}
