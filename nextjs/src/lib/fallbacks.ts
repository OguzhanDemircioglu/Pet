import type { SiteSettings } from '@/types'

/**
 * Backend erişilemezken (build time / outage) kullanılan güvenli varsayılanlar.
 * Site'ın "boş" görünmesi yerine markaya uygun fallback gösterir.
 */
export const FALLBACK_SITE_SETTINGS: SiteSettings = {
  brandPart1: 'Pet',
  brandPart2: 'Toptan',
  contactEmail: 'info@pettoptan.com.tr',
  contactPhone: '905527735994',
  companyAddress: '',
  contactHours: 'Hafta içi 09:00–18:00',
  mapCoords: '',
  appDomain: 'pettoptan.com.tr',
  appYear: String(new Date().getFullYear()),
}
