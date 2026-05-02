'use client'
import clientApi from './client'

export interface ProductDto {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  reserved: number
  active: boolean
}

export interface SaleLineDto {
  productId: number
  name: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface SaleDto {
  id: number
  orderNumber: string
  customerName: string | null
  total: number
  itemCount: number
  createdAt: string
  items: SaleLineDto[]
}

export interface DashboardStats {
  productCount: number
  salesCount: number
  productLimit: number
  plan: 'FREE' | 'PRO' | 'PRO_PLUS'
  lowStock: ProductDto[]
  recentSales: SaleDto[]
}

interface PageResp<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CompanyUserDto {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: 'ADMIN' | 'CUSTOMER'
  isActive: boolean
  createdAt: string
}

export const saasApi = {
  async dashboard(): Promise<DashboardStats> {
    const r = await clientApi.get('/admin/saas/dashboard')
    return r.data
  },
  async listProducts(page = 0, size = 20): Promise<PageResp<ProductDto>> {
    const r = await clientApi.get('/admin/saas/products', { params: { page, size } })
    return r.data
  },
  async getProduct(id: number): Promise<ProductDto> {
    const r = await clientApi.get(`/admin/saas/products/${id}`)
    return r.data
  },
  async createProduct(input: { name: string; sku: string; price: number; stock: number }): Promise<ProductDto> {
    const r = await clientApi.post('/admin/saas/products', input)
    return r.data
  },
  async updateProduct(id: number, input: { name: string; price: number; stock: number; active?: boolean }): Promise<ProductDto> {
    const r = await clientApi.put(`/admin/saas/products/${id}`, input)
    return r.data
  },
  async deleteProduct(id: number): Promise<void> {
    await clientApi.delete(`/admin/saas/products/${id}`)
  },
  async createSale(input: { customerName?: string; notes?: string; items: { productId: number; quantity: number }[] }): Promise<SaleDto> {
    const r = await clientApi.post('/admin/saas/sales', input)
    return r.data
  },
  async listSales(page = 0, size = 20): Promise<PageResp<SaleDto>> {
    const r = await clientApi.get('/admin/saas/sales', { params: { page, size } })
    return r.data
  },
  async registerCompany(input: { companyName: string; email: string; password: string; firstName?: string; lastName?: string }): Promise<{ accessToken: string; refreshToken: string; user: unknown }> {
    const r = await clientApi.post('/auth/register-company', input)
    return r.data
  },
  async listUsers(): Promise<CompanyUserDto[]> {
    const r = await clientApi.get('/admin/saas/users')
    return r.data
  },
  async inviteUser(input: { email: string; password: string; firstName?: string; lastName?: string }): Promise<CompanyUserDto> {
    const r = await clientApi.post('/admin/saas/users', input)
    return r.data
  },
  async deactivateUser(id: number): Promise<void> {
    await clientApi.delete(`/admin/saas/users/${id}`)
  },
  async planInfo(): Promise<{ plan: 'FREE' | 'PRO' | 'PRO_PLUS'; availablePlans: ('FREE' | 'PRO' | 'PRO_PLUS')[]; companyId: number; companyName: string; companySlug: string }> {
    const r = await clientApi.get('/admin/saas/plan')
    return r.data
  },
  async changePlan(plan: 'FREE' | 'PRO' | 'PRO_PLUS'): Promise<{ plan: string }> {
    const r = await clientApi.post('/admin/saas/plan/change', { plan })
    return r.data
  },
}
