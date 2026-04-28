import api from './axios'

export interface AllowedRoutes {
  publicRoutes: string[]
  customerRoutes: string[]
  adminRoutes: string[]
}

export const routesApi = {
  get: () => api.get<AllowedRoutes>('/public/allowed-routes').then(r => r.data),
}
