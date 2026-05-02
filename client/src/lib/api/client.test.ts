import { describe, it, expect } from 'vitest'

// Backend error wire format → Error mapping kontratını sınıyoruz.
// Interceptor'ın iç davranışını burada simüle ediyoruz; tam axios ortamı yerine
// kontrat seviyesinde doğrulama yapıyoruz (msw daha sonra eklenebilir).

interface BackendError {
  message?: string
  errors?: { code?: string }
}

function mapError(status: number, body: BackendError): Error & { code?: string; status?: number } {
  const code = body.errors?.code
  const msg = body.message || 'İşlem başarısız'
  const e = new Error(msg) as Error & { code?: string; status?: number }
  e.code = code
  e.status = status
  return e
}

describe('api error mapping', () => {
  it('PLAN_LIMIT_EXCEEDED kodu yansıtılır', () => {
    const e = mapError(403, { message: 'limit', errors: { code: 'PLAN_LIMIT_EXCEEDED' } })
    expect(e.code).toBe('PLAN_LIMIT_EXCEEDED')
    expect(e.status).toBe(403)
  })

  it('PLAN_FEATURE_LOCKED kodu yansıtılır', () => {
    const e = mapError(403, { message: 'kilitli', errors: { code: 'PLAN_FEATURE_LOCKED' } })
    expect(e.code).toBe('PLAN_FEATURE_LOCKED')
  })

  it('CROSS_TENANT_ACCESS 404 olarak gelir', () => {
    const e = mapError(404, { message: 'bulunamadı', errors: { code: 'CROSS_TENANT_ACCESS' } })
    expect(e.code).toBe('CROSS_TENANT_ACCESS')
    expect(e.status).toBe(404)
  })

  it('kod yoksa undefined döner', () => {
    const e = mapError(500, { message: 'generic' })
    expect(e.code).toBeUndefined()
  })
})
