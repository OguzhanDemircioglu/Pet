import { describe, it, expect } from 'vitest'

const dashboardPaths = ['/dashboard', '/urunler', '/satislar', '/kullanicilar', '/ayarlar']
const authOnlyVisitorPaths = ['/giris', '/kayit']
const proPaths = ['/satislar', '/kullanicilar']
// Mirror src/proxy.ts exception list — FREE can record sales (matches README)
const proPathFreeExceptions = ['/satislar/yeni']
const proPlusPaths = ['/shop-settings']

function startsWithAny(path: string, list: string[]) {
  return list.some(p => path === p || path.startsWith(p + '/'))
}

type Plan = 'FREE' | 'PRO' | 'PRO_PLUS'

function decide(path: string, isLoggedIn: boolean, plan: Plan | null): { redirect?: string } {
  if (isLoggedIn && startsWithAny(path, authOnlyVisitorPaths)) return { redirect: '/dashboard' }
  if (startsWithAny(path, dashboardPaths) && !isLoggedIn) return { redirect: '/giris' }
  if (
    isLoggedIn &&
    startsWithAny(path, proPaths) &&
    !startsWithAny(path, proPathFreeExceptions) &&
    plan === 'FREE'
  ) return { redirect: '/dashboard?upgrade=1' }
  if (isLoggedIn && startsWithAny(path, proPlusPaths) && plan !== 'PRO_PLUS') return { redirect: '/dashboard?upgrade=1' }
  return {}
}

describe('middleware decision', () => {
  it('auth\'suz dashboard → /giris', () => {
    expect(decide('/dashboard', false, null).redirect).toBe('/giris')
  })

  it('auth\'lu /giris → /dashboard', () => {
    expect(decide('/giris', true, 'FREE').redirect).toBe('/dashboard')
  })

  it('auth\'lu /kayit → /dashboard', () => {
    expect(decide('/kayit', true, 'PRO').redirect).toBe('/dashboard')
  })

  it('FREE plan /satislar (history) → upgrade redirect', () => {
    expect(decide('/satislar', true, 'FREE').redirect).toBe('/dashboard?upgrade=1')
  })

  it('FREE plan /satislar/yeni (sale create) → izin (README: basit satış kaydı)', () => {
    expect(decide('/satislar/yeni', true, 'FREE').redirect).toBeUndefined()
  })

  it('PRO plan /satislar → izin', () => {
    expect(decide('/satislar', true, 'PRO').redirect).toBeUndefined()
  })

  it('PRO plan /shop-settings → upgrade', () => {
    expect(decide('/shop-settings', true, 'PRO').redirect).toBe('/dashboard?upgrade=1')
  })

  it('PRO_PLUS /shop-settings → izin', () => {
    expect(decide('/shop-settings', true, 'PRO_PLUS').redirect).toBeUndefined()
  })

  it('public path \'/odeme-sonuc\' kararsız bırakılır', () => {
    expect(decide('/odeme-sonuc', false, null).redirect).toBeUndefined()
  })
})
