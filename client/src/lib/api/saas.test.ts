import { describe, it, expect, vi, beforeEach } from 'vitest'

// SaaS API client kontrat testleri — backend olmadan params + endpoint
// kontrolü yapılır. Mock axios üzerinden çağrı yakalanır.
const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('./client', () => ({
  default: {
    get: (...a: unknown[]) => getMock(...a),
    post: (...a: unknown[]) => postMock(...a),
    put: (...a: unknown[]) => putMock(...a),
    delete: (...a: unknown[]) => deleteMock(...a),
  },
}))

const { saasApi } = await import('./saas')

describe('saasApi', () => {
  beforeEach(() => {
    getMock.mockReset(); postMock.mockReset(); putMock.mockReset(); deleteMock.mockReset()
    getMock.mockResolvedValue({ data: {} })
    postMock.mockResolvedValue({ data: {} })
    putMock.mockResolvedValue({ data: {} })
    deleteMock.mockResolvedValue({ data: {} })
  })

  describe('endpoints', () => {
    it('dashboard GET /admin/saas/dashboard', async () => {
      await saasApi.dashboard()
      expect(getMock).toHaveBeenCalledWith('/admin/saas/dashboard')
    })

    it('listProducts query params doğru', async () => {
      await saasApi.listProducts(2, 50)
      expect(getMock).toHaveBeenCalledWith('/admin/saas/products', { params: { page: 2, size: 50 } })
    })

    it('createProduct POST', async () => {
      const input = { name: 'X', sku: 'X-1', price: 10, stock: 5 }
      await saasApi.createProduct(input)
      expect(postMock).toHaveBeenCalledWith('/admin/saas/products', input)
    })

    it('deleteProduct DELETE', async () => {
      await saasApi.deleteProduct(99)
      expect(deleteMock).toHaveBeenCalledWith('/admin/saas/products/99')
    })

    it('adjustStock POST + body', async () => {
      await saasApi.adjustStock(1, -5, 'kayıp')
      expect(postMock).toHaveBeenCalledWith('/admin/saas/products/1/stock', { delta: -5, note: 'kayıp' })
    })

    it('searchSales sadece dolu params gönderir', async () => {
      await saasApi.searchSales({ page: 0, size: 20, q: 'ali' })
      expect(getMock).toHaveBeenCalledWith('/admin/saas/sales', {
        params: { page: 0, size: 20, q: 'ali' },
      })
    })

    it('searchSales boş alanlar params\'tan çıkarılır', async () => {
      await saasApi.searchSales({})
      expect(getMock).toHaveBeenCalledWith('/admin/saas/sales', {
        params: { page: 0, size: 20 },
      })
    })

    it('listAudit filter params', async () => {
      await saasApi.listAudit({
        page: 0, size: 20,
        resourceType: 'product', action: 'STOCK_ADJUST',
        resourceId: 5, from: '2026-01-01', to: '2026-12-31',
      })
      expect(getMock).toHaveBeenCalledWith('/admin/saas/audit', {
        params: {
          page: 0, size: 20,
          resourceType: 'product', action: 'STOCK_ADJUST',
          resourceId: 5, from: '2026-01-01', to: '2026-12-31',
        },
      })
    })

    it('changePlan POST', async () => {
      await saasApi.changePlan('PRO')
      expect(postMock).toHaveBeenCalledWith('/admin/saas/plan/change', { plan: 'PRO' })
    })

    it('createApiKey POST + scopes opsiyonel', async () => {
      await saasApi.createApiKey({ name: 'Z' })
      expect(postMock).toHaveBeenCalledWith('/admin/saas/api-keys', { name: 'Z' })
      await saasApi.createApiKey({ name: 'Z', scopes: 's1,s2' })
      expect(postMock).toHaveBeenCalledWith('/admin/saas/api-keys', { name: 'Z', scopes: 's1,s2' })
    })

    it('topSellers default + custom days/limit', async () => {
      await saasApi.topSellers()
      expect(getMock).toHaveBeenCalledWith('/admin/saas/charts/top-sellers', {
        params: { days: 30, limit: 10 },
      })
      await saasApi.topSellers(7, 3)
      expect(getMock).toHaveBeenCalledWith('/admin/saas/charts/top-sellers', {
        params: { days: 7, limit: 3 },
      })
    })

    it('exportProductsCsv responseType blob', async () => {
      await saasApi.exportProductsCsv()
      expect(getMock).toHaveBeenCalledWith('/admin/saas/export/products.csv', { responseType: 'blob' })
    })

    it('importProductsCsv FormData + multipart header', async () => {
      const file = new File(['x'], 'x.csv', { type: 'text/csv' })
      await saasApi.importProductsCsv(file)
      const [path, body, opts] = postMock.mock.calls[0] as [string, FormData, Record<string, unknown>]
      expect(path).toBe('/admin/saas/import/products')
      expect(body).toBeInstanceOf(FormData)
      expect((opts.headers as Record<string, string>)['Content-Type']).toBe('multipart/form-data')
    })

    it('updateProductsCsv farklı endpoint', async () => {
      await saasApi.updateProductsCsv(new File(['x'], 'x.csv'))
      const [path] = postMock.mock.calls[0] as [string]
      expect(path).toBe('/admin/saas/import/products/update')
    })

    it('requestPasswordReset', async () => {
      await saasApi.requestPasswordReset('a@b.com')
      expect(postMock).toHaveBeenCalledWith('/auth/password-reset', { email: 'a@b.com' })
    })

    it('confirmPasswordReset', async () => {
      await saasApi.confirmPasswordReset('tok', 'newpass')
      expect(postMock).toHaveBeenCalledWith('/auth/password-reset/confirm', {
        token: 'tok', newPassword: 'newpass',
      })
    })

    it('updateCompanySettings PUT', async () => {
      await saasApi.updateCompanySettings({ lowStockAlertEnabled: true, lowStockThreshold: 10 })
      expect(putMock).toHaveBeenCalledWith('/admin/saas/company/settings', {
        lowStockAlertEnabled: true, lowStockThreshold: 10,
      })
    })
  })
})
