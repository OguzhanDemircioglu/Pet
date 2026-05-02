'use client'
import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const clientApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Başarısız olan POST/PUT/PATCH/DELETE isteklerinin parmak izleri
const failedFingerprints = new Set<string>()

function getFingerprint(config: { method?: string; url?: string; data?: unknown }): string {
  const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? '')
  return `${config.method}:${config.url}:${body}`
}

function unwrap(res: { data: unknown }) {
  const d = res.data as Record<string, unknown> | null
  if (d && typeof d === 'object' && 'success' in d) {
    if (!d.success) {
      const err = new Error((d.message as string) || 'İşlem başarısız') as Error & { errors?: unknown }
      err.errors = d.errors
      throw err
    }
    res.data = 'data' in d ? d.data : d
  }
}

clientApi.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') {
    const fp = getFingerprint(config)
    if (failedFingerprints.has(fp)) {
      return Promise.reject(new Error('Lütfen bilgileri değiştirip tekrar deneyin'))
    }
  }

  return config
})

clientApi.interceptors.response.use(
  (res) => {
    const fp = getFingerprint(res.config)
    failedFingerprints.delete(fp)
    unwrap(res)
    return res
  },
  async (error) => {
    const original = error.config
    if (!original) return Promise.reject(error)

    // 401 → NextAuth oturumu yenile, başarısız olursa çıkış yap
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true
      await signOut({ redirect: true, callbackUrl: '/giris' })
      return Promise.reject(error)
    }

    const status = error.response?.status
    const method = (original.method || 'get').toLowerCase()
    if (status && status >= 400 && status < 500 && method !== 'get') {
      failedFingerprints.add(getFingerprint(original))
    }

    const backendMsg = error.response?.data?.message
    const backendCode = error.response?.data?.errors?.code as string | undefined
    if (backendMsg || backendCode) {
      const e = new Error(backendMsg || 'İşlem başarısız') as Error & { code?: string; status?: number }
      e.code = backendCode
      e.status = status
      return Promise.reject(e)
    }
    return Promise.reject(error)
  }
)

export default clientApi
export { BASE_URL }
