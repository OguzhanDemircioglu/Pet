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
  async adjustStock(id: number, delta: number, note?: string): Promise<ProductDto> {
    const r = await clientApi.post(`/admin/saas/products/${id}/stock`, { delta, note })
    return r.data
  },
  async createSale(input: { customerName?: string; notes?: string; items: { productId: number; quantity: number }[] }): Promise<SaleDto> {
    const r = await clientApi.post('/admin/saas/sales', input)
    return r.data
  },
  async listSales(page = 0, size = 20): Promise<PageResp<SaleDto>> {
    const r = await clientApi.get('/admin/saas/sales', { params: { page, size } })
    return r.data
  },
  async getSale(id: number): Promise<SaleDto> {
    const r = await clientApi.get(`/admin/saas/sales/${id}`)
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
  async listAudit(opts: { page?: number; size?: number; resourceType?: string; action?: string } = {}): Promise<PageResp<AuditLogDto>> {
    const r = await clientApi.get('/admin/saas/audit', {
      params: {
        page: opts.page ?? 0,
        size: opts.size ?? 50,
        ...(opts.resourceType ? { resourceType: opts.resourceType } : {}),
        ...(opts.action ? { action: opts.action } : {}),
      },
    })
    return r.data
  },
  async monthlyMetrics(period?: string): Promise<MonthlyMetrics> {
    const r = await clientApi.get('/admin/saas/metrics/monthly', {
      params: period ? { period } : {},
    })
    return r.data
  },
  async updateProductsCsv(file: File): Promise<BulkImportResult> {
    const fd = new FormData()
    fd.append('file', file)
    const r = await clientApi.post('/admin/saas/import/products/update', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data
  },
  async requestPasswordReset(email: string): Promise<void> {
    await clientApi.post('/auth/password-reset', { email })
  },
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await clientApi.post('/auth/password-reset/confirm', { token, newPassword })
  },
  async salesDaily(days = 30): Promise<DailySalesPoint[]> {
    const r = await clientApi.get('/admin/saas/charts/sales-daily', { params: { days } })
    return r.data
  },
  async searchSales(opts: { page?: number; size?: number; from?: string; to?: string; q?: string } = {}): Promise<PageResp<SaleDto>> {
    const r = await clientApi.get('/admin/saas/sales', {
      params: {
        page: opts.page ?? 0,
        size: opts.size ?? 20,
        ...(opts.from ? { from: opts.from } : {}),
        ...(opts.to ? { to: opts.to } : {}),
        ...(opts.q ? { q: opts.q } : {}),
      },
    })
    return r.data
  },
  async exportAll(): Promise<Blob> {
    const r = await clientApi.get('/admin/saas/export', { responseType: 'blob' })
    return r.data as Blob
  },
  async importProductsCsv(file: File): Promise<BulkImportResult> {
    const fd = new FormData()
    fd.append('file', file)
    const r = await clientApi.post('/admin/saas/import/products', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data
  },
}

export interface DailySalesPoint {
  date: string
  count: number
  total: number
}

export interface BulkImportResult {
  totalRows: number
  createdCount: number
  skippedCount: number
  errors: { row: number; reason: string }[]
}

export interface MonthlyMetrics {
  period: string
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  inactiveProducts: number
}

export interface AuditLogDto {
  id: number
  action: string
  resourceType: string | null
  resourceId: number | null
  userId: number | null
  details: string | null
  ip: string | null
  createdAt: string
}
