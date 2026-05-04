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
  async verifyEmail(email: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: unknown }> {
    const r = await clientApi.post('/auth/verify-email', { email, code })
    return r.data
  },
  async resendVerification(email: string): Promise<void> {
    await clientApi.post('/auth/resend-verification', { email })
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
  async listAudit(opts: { page?: number; size?: number; resourceType?: string; action?: string; resourceId?: number; from?: string; to?: string } = {}): Promise<PageResp<AuditLogDto>> {
    const r = await clientApi.get('/admin/saas/audit', {
      params: {
        page: opts.page ?? 0,
        size: opts.size ?? 50,
        ...(opts.resourceType ? { resourceType: opts.resourceType } : {}),
        ...(opts.action ? { action: opts.action } : {}),
        ...(opts.resourceId ? { resourceId: opts.resourceId } : {}),
        ...(opts.from ? { from: opts.from } : {}),
        ...(opts.to ? { to: opts.to } : {}),
      },
    })
    return r.data
  },
  async listApiKeys(): Promise<ApiKeyDto[]> {
    const r = await clientApi.get('/admin/saas/api-keys')
    return r.data
  },
  async createApiKey(input: { name: string; scopes?: string }): Promise<{ key: ApiKeyDto; plaintext: string }> {
    const r = await clientApi.post('/admin/saas/api-keys', input)
    return r.data
  },
  async revokeApiKey(id: number): Promise<void> {
    await clientApi.delete(`/admin/saas/api-keys/${id}`)
  },
  async getCompanySettings(): Promise<CompanySettingsDto> {
    const r = await clientApi.get('/admin/saas/company/settings')
    return r.data
  },
  async updateCompanySettings(input: Partial<{
    name: string
    lowStockThreshold: number
    lowStockAlertEnabled: boolean
    dailySummaryEnabled: boolean
    notificationEmail: string
  }>): Promise<CompanySettingsDto> {
    const r = await clientApi.put('/admin/saas/company/settings', input)
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
  async topSellers(days = 30, limit = 10): Promise<TopSellerDto[]> {
    const r = await clientApi.get('/admin/saas/charts/top-sellers', { params: { days, limit } })
    return r.data
  },
  async exportProductsCsv(): Promise<Blob> {
    const r = await clientApi.get('/admin/saas/export/products.csv', { responseType: 'blob' })
    return r.data as Blob
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

export interface TopSellerDto {
  productId: number
  productName: string
  totalQuantity: number
  totalRevenue: number
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

export interface CompanySettingsDto {
  id: number
  name: string
  slug: string
  plan: 'FREE' | 'PRO' | 'PRO_PLUS'
  lowStockThreshold: number
  lowStockAlertEnabled: boolean
  dailySummaryEnabled: boolean
  notificationEmail: string | null
}

export interface ApiKeyDto {
  id: number
  name: string
  prefix: string
  lastFour: string
  scopes: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
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
