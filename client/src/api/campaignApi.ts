import api from './axios'

export interface CampaignResponse {
  id: number
  title: string
  badge: string
  description: string | null
  emoji: string | null
  sticker: string | null
  bgColor: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export interface DiscountResponse {
  id: number
  type: 'category' | 'product' | 'brand' | 'general'
  name: string
  emoji: string | null
  discountType: 'PERCENT' | 'FIXED' | null
  discountValue: number | null
  targetName: string | null
  targetId: number | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  couponCode: string | null
  minOrderAmount: number | null
  usageLimit: number | null
  usageCount: number
}

export interface CouponValidationResponse {
  valid: boolean
  message: string
  discountAmount: number
  discountType: string | null
  couponCode: string
}

export type DiscountScope = 'category' | 'product' | 'brand' | 'general'
export type DiscountValueType = 'PERCENT' | 'FIXED'

export interface CampaignRequest {
  title: string
  badge: string
  description?: string | null
  emoji?: string | null
  sticker?: string | null
  bgColor: string
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export interface CategoryDiscountRequest {
  name: string
  emoji?: string | null
  categoryId: number
  discountType: DiscountValueType
  discountValue: number
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface ProductDiscountRequest {
  name: string
  emoji?: string | null
  productId: number
  discountType: DiscountValueType
  discountValue: number
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface BrandDiscountRequest {
  name: string
  emoji?: string | null
  brandId: number
  discountType: DiscountValueType
  discountValue: number
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface GeneralDiscountRequest {
  name: string
  emoji?: string | null
  couponCode: string
  discountType: DiscountValueType
  discountValue: number
  minOrderAmount?: number | null
  usageLimit?: number | null
  startDate: string
  endDate: string
  isActive?: boolean
}

export const campaignApi = {
  list: () => api.get<CampaignResponse[]>('/admin/campaigns').then(r => r.data),
  create: (data: CampaignRequest) => api.post<CampaignResponse>('/admin/campaigns', data).then(r => r.data),
  update: (id: number, data: CampaignRequest) => api.put<CampaignResponse>(`/admin/campaigns/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/campaigns/${id}`),
  getActiveEmojis: () => api.get<string[]>('/admin/campaigns/active-emojis').then(r => r.data),
  getActiveCampaigns: () => api.get<CampaignResponse[]>('/public/campaigns').then(r => r.data),
  getActiveDiscounts: () => api.get<DiscountResponse[]>('/public/active-discounts').then(r => r.data),
}

export const discountApi = {
  list: () => api.get<DiscountResponse[]>('/admin/discounts').then(r => r.data),
  create: (
    scope: DiscountScope,
    data: CategoryDiscountRequest | ProductDiscountRequest | BrandDiscountRequest | GeneralDiscountRequest
  ) => api.post<DiscountResponse>(`/admin/discounts/${scope}`, data).then(r => r.data),
  delete: (type: string, id: number) => api.delete(`/admin/discounts/${type.toLowerCase()}/${id}`),
  getActiveEmojis: () => api.get<string[]>('/admin/discounts/active-emojis').then(r => r.data),
  validateCoupon: (couponCode: string, orderAmount: number) =>
    api.post<CouponValidationResponse>('/admin/discounts/validate-coupon', { couponCode, orderAmount }).then(r => r.data),
}
