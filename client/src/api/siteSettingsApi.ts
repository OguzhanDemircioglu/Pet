import api from './axios'

export interface SiteSettings {
  brandPart1: string
  brandPart2: string
  contactEmail: string
  contactPhone: string
  companyAddress: string
  contactHours: string
  mapCoords: string
  appDomain: string
  appYear: string
}

export const siteSettingsApi = {
  get: () => api.get<SiteSettings>('/public/site-settings').then(r => r.data),
  adminGet: () => api.get<SiteSettings>('/admin/site-settings').then(r => r.data),
  update: (data: SiteSettings) => api.put<SiteSettings>('/admin/site-settings', data).then(r => r.data),
}
