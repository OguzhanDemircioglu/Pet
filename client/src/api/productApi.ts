import api from './axios'
import type { Product, Category, Page, AdminUser } from '../types'

export interface ProductForm {
  name: string
  sku: string
  categoryId: number
  brandName: string
  basePrice: number
  vatRate: number
  moq: number
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

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`).then(r => r.data),

  // Admin
  adminList: (params?: { page?: number; size?: number }) =>
    api.get<Page<Product>>('/admin/products', { params }).then(r => r.data),

  adminCreate: (data: ProductForm) =>
    api.post<Product>('/admin/products', data).then(r => r.data),

  adminUpdate: (id: number, data: ProductForm) =>
    api.put<Product>(`/admin/products/${id}`, data).then(r => r.data),

  adminDelete: (id: number) =>
    api.delete(`/admin/products/${id}`),
}

export const categoryApi = {
  list: () =>
    api.get<Category[]>('/categories').then(r => r.data),

  getBySlug: (slug: string) =>
    api.get<Category>(`/categories/${slug}`).then(r => r.data),

  adminCreate: (data: { name: string; parentId?: number | null; displayOrder?: number }) =>
    api.post<Category>('/admin/categories', data).then(r => r.data),

  adminUpdate: (id: number, data: { name: string; parentId?: number | null; displayOrder?: number }) =>
    api.put<Category>(`/admin/categories/${id}`, data).then(r => r.data),

  adminDelete: (id: number) =>
    api.delete(`/admin/categories/${id}`),
}

export const userApi = {
  adminList: (params?: { page?: number; size?: number }) =>
    api.get<Page<AdminUser>>('/admin/users', { params }).then(r => r.data),
}
