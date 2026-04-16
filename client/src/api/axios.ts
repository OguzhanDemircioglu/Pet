import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

// Başarısız olan isteklerin parmak izleri (method:url:body)
const failedFingerprints = new Set<string>()

function getFingerprint(config: { method?: string; url?: string; data?: unknown }): string {
  // axios, response aşamasında config.data'yı string'e çevirir; request aşamasında object olabilir.
  // İkisinde de aynı fingerprint üretmek için string ise olduğu gibi kullan.
  const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? '')
  return `${config.method}:${config.url}:${body}`
}

// Access token + parmak izi kontrolü
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const fp = getFingerprint(config)
  if (failedFingerprints.has(fp)) {
    return Promise.reject(new Error('Lütfen bilgileri değiştirip tekrar deneyin'))
  }

  return config
})

// Başarılı istekte parmak izini temizle
api.interceptors.response.use(
  (res) => {
    const fp = getFingerprint(res.config)
    failedFingerprints.delete(fp)
    return res
  },
  async (error) => {
    const original = error.config

    // Parmak izi kontrolü zaten reddettiyse direkt ilet
    if (!original) {
      return Promise.reject(error)
    }

    // 401 → token yenile (login endpoint'i hariç)
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/auth/refresh`,
            { refreshToken }
          )
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }

    // 4xx hatalarında parmak izini kaydet (client hatası — aynı veriyle retry anlamsız)
    // 5xx veya ağ hatalarında kaydetme (sunucu sorunu — kullanıcı retry yapabilir)
    const status = error.response?.status
    if (status && status >= 400 && status < 500) {
      failedFingerprints.add(getFingerprint(original))
    }

    const backendMsg = error.response?.data?.message
    return Promise.reject(backendMsg ? new Error(backendMsg) : error)
  }
)

export default api
