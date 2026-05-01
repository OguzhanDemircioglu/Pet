// Client-side API methods (use in 'use client' components)
import clientApi from './client'
import type {
  Address, AddressRequest, OrderRequest, ReviewResponse,
  CanReviewResponse, NotificationResponse, CouponValidationResponse,
} from '@/types'

// Auth
export const authClientApi = {
  login: (email: string, password: string) =>
    clientApi.post('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) =>
    clientApi.post('/auth/register', { email, password, firstName, lastName, phone }).then(r => r.data),
  verifyEmail: (email: string, code: string) =>
    clientApi.post('/auth/verify-email', { email, code }).then(r => r.data),
  resendVerification: (email: string) =>
    clientApi.post('/auth/resend-verification', { email }).then(r => r.data),
  googleAuth: (accessToken: string) =>
    clientApi.post('/auth/google', { accessToken }).then(r => r.data),
  me: () => clientApi.get('/auth/me').then(r => r.data),
  logout: () => clientApi.post('/auth/logout'),
  updatePhone: (phone: string) => clientApi.patch('/auth/me/phone', { phone }).then(r => r.data),
  updateProfile: (firstName: string, lastName: string, phone: string) =>
    clientApi.patch('/auth/me/profile', { firstName, lastName, phone }).then(r => r.data),
  requestEmailChange: (newEmail: string) => clientApi.post('/auth/me/email/request', { newEmail }),
  getConfig: () => clientApi.get<{ verifyExpiryMinutes: number }>('/public/config').then(r => r.data),
}

// Addresses
export const addressClientApi = {
  list: () => clientApi.get<Address[]>('/addresses').then(r => r.data),
  create: (data: AddressRequest) => clientApi.post<Address>('/addresses', data).then(r => r.data),
  update: (id: number, data: AddressRequest) => clientApi.put<Address>(`/addresses/${id}`, data).then(r => r.data),
  remove: (id: number) => clientApi.delete(`/addresses/${id}`),
  setDefault: (id: number) => clientApi.patch<Address>(`/addresses/${id}/default`).then(r => r.data),
}

// Orders
export const orderClientApi = {
  create: (data: OrderRequest) =>
    clientApi.post('/orders', data).then(r => r.data),
  listMy: () => clientApi.get('/orders/myOrders').then(r => r.data),
  initiatePayment: (data: OrderRequest) =>
    clientApi.post('/payment/iyzico/initiate', data).then(r => r.data),
  invoiceUrl: (orderId: number) => `/orders/${orderId}/invoice`,
}

// Reviews
export const reviewClientApi = {
  list: (slug: string) =>
    clientApi.get<ReviewResponse[]>(`/products/${slug}/reviews`).then(r => r.data),
  canReview: (slug: string) =>
    clientApi.get<CanReviewResponse>(`/products/${slug}/reviews/can-review`).then(r => r.data),
  create: (slug: string, rating: number, comment: string) =>
    clientApi.post<ReviewResponse>(`/products/${slug}/reviews`, { rating, comment: comment || null }).then(r => r.data),
  update: (slug: string, id: number, rating: number, comment: string) =>
    clientApi.put<ReviewResponse>(`/products/${slug}/reviews/${id}`, { rating, comment: comment || null }).then(r => r.data),
  delete: (slug: string, id: number) => clientApi.delete(`/products/${slug}/reviews/${id}`),
}

// Notifications
export const notificationClientApi = {
  listMy: () => clientApi.get<NotificationResponse[]>('/notifications/myNotifications').then(r => r.data),
  markRead: (id: number) => clientApi.patch(`/notifications/${id}/read`),
  markAllRead: () => clientApi.patch('/notifications/read-all'),
}

// Products client
export const productClientApi = {
  notifyStock: (productId: number, data: { email: string; variantId?: number }) =>
    clientApi.post(`/products/${productId}/notify-stock`, data).then(r => r.data),
  checkStockNotify: (productId: number, email: string, variantId?: number) =>
    clientApi.get<{ subscribed: boolean }>(`/products/${productId}/notify-stock`, {
      params: { email, ...(variantId ? { variantId } : {}) },
    }).then(r => r.data),
}

// Coupon
export const couponClientApi = {
  validate: (couponCode: string, orderAmount: number) =>
    clientApi.post<CouponValidationResponse>('/admin/discounts/validate-coupon', { couponCode, orderAmount }).then(r => r.data),
}
