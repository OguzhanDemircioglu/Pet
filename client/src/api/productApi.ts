import api, { BASE_URL } from './axios'
import type { Product, CatalogProduct, ProductImage, Brand, Category, Page, AdminUser } from '../types'
import type { DiscountResponse, CampaignResponse } from './campaignApi'

export interface CatalogResponse {
  products: CatalogProduct[]
  categories: Category[]
  activeDiscounts: DiscountResponse[]
  slides: CampaignResponse[]
}

export const imgUrl = (path: string | null | undefined): string | undefined =>
  path ? (path.startsWith('http') ? path : `${BASE_URL}${path}`) : undefined

export interface ProductForm {
  name: string
  sku: string
  categoryId: number
  brandId: number
  basePrice: number
  vatRate: number
  minSellingQuantity: number
  stockQuantity: number
  unit: string
  shortDescription: string
  isActive: boolean
  isFeatured: boolean
}

export const productApi = {
  list: (params?: { categoryId?: number; q?: string; page?: number; size?: number }) =>
    api.get<Page<Product>>('/products', { params }).then(r => r.data),

  featured: () =>
    api.get<Product[]>('/products/featured').then(r => r.data),

  catalog: () =>
    api.get<CatalogResponse>('/public/catalog').then(r => r.data),

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`).then(r => r.data),

  adminCreate: (data: ProductForm) =>
    api.post<Product>('/admin/products', data).then(r => r.data),

  adminUpdate: (id: number, data: ProductForm) =>
    api.put<{ message: string }>(`/admin/products/${id}`, data).then(r => r.data),

  adminDelete: (id: number) =>
    api.delete(`/admin/products/${id}`),
}

export const brandApi = {
  list: () =>
    api.get<Brand[]>('/brands').then(r => r.data),

  adminList: () =>
    api.get<Brand[]>('/admin/brands').then(r => r.data),

  adminCreate: (data: { name: string; isActive?: boolean }) =>
    api.post<Brand>('/admin/brands', data).then(r => r.data),

  adminUpdate: (id: number, data: { name: string; isActive?: boolean }) =>
    api.put<Brand>(`/admin/brands/${id}`, data).then(r => r.data),

  adminDelete: (id: number) =>
    api.delete(`/admin/brands/${id}`),
}

export const categoryApi = {
  list: () =>
    api.get<Category[]>('/categories').then(r => r.data),

  getBySlug: (slug: string) =>
    api.get<Category>(`/categories/${slug}`).then(r => r.data),

  adminCreate: (data: { name: string; emoji?: string; parentId?: number | null; displayOrder?: number }) =>
    api.post<Category>('/admin/categories', data).then(r => r.data),

  adminUpdate: (id: number, data: { name: string; emoji?: string; parentId?: number | null; displayOrder?: number }) =>
    api.put<Category>(`/admin/categories/${id}`, data).then(r => r.data),

  adminDelete: (id: number) =>
    api.delete(`/admin/categories/${id}`),
}

export const productImageApi = {
  list: (productId: number) =>
    api.get<ProductImage[]>(`/admin/products/${productId}/images`).then(r => r.data),

  upload: (productId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ProductImage>(`/admin/products/${productId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  setPrimary: (productId: number, imageId: number) =>
    api.put(`/admin/products/${productId}/images/${imageId}/primary`),

  reorder: (productId: number, orderedIds: number[]) =>
    api.put(`/admin/products/${productId}/images/reorder`, orderedIds),

  delete: (productId: number, imageId: number) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),
}

export const userApi = {
  adminList: (params?: { page?: number; size?: number }) =>
    api.get<Page<AdminUser>>('/admin/users', { params }).then(r => r.data),
}
