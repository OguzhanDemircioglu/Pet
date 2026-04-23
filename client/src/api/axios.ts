import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Başarısız olan isteklerin parmak izleri (method:url:body)
const failedFingerprints = new Set<string>()

function getFingerprint(config: { method?: string; url?: string; data?: unknown }): string {
  const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? '')
  return `${config.method}:${config.url}:${body}`
}

// DataGenericResponse unwrap: { success, message, data?, errors? } → data
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

// Access token + parmak izi kontrolü
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Fingerprint kontrolü sadece mutasyon request'leri için (POST/PUT/PATCH/DELETE).
  // GET idempotent — aynı URL'e tekrar istek atmak zararsız, bloke etmemeli.
  const method = (config.method || 'get').toLowerCase()
  if (method !== 'get') {
    const fp = getFingerprint(config)
    if (failedFingerprints.has(fp)) {
      return Promise.reject(new Error('Lütfen bilgileri değiştirip tekrar deneyin'))
    }
  }

  return config
})

api.interceptors.response.use(
  (res) => {
    const fp = getFingerprint(res.config)
    failedFingerprints.delete(fp)
    unwrap(res)
    return res
  },
  async (error) => {
    const original = error.config

    if (!original) return Promise.reject(error)

    // 401 → token yenile (login endpoint'i hariç)
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          // DataGenericResponse<AuthResponse> → tokens data.data içinde
          const tokens = data?.data ?? data
          localStorage.setItem('accessToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          original.headers.Authorization = `Bearer ${tokens.accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }

    // 4xx hatalarında parmak izini kaydet — sadece mutasyon request'leri için
    const status = error.response?.status
    const method = (original.method || 'get').toLowerCase()
    if (status && status >= 400 && status < 500 && method !== 'get') {
      failedFingerprints.add(getFingerprint(original))
    }

    // Backend'den gelen message'ı kullan
    const backendMsg = error.response?.data?.message
    return Promise.reject(backendMsg ? new Error(backendMsg) : error)
  }
)

export default api
