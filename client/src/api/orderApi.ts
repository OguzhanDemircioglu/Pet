import api from './axios'

export interface OrderItemRequest {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface OrderRequest {
  fullName: string
  phone: string
  city: string
  district: string
  address: string
  totalAmount: number
  items: OrderItemRequest[]
}

export interface OrderItemResponse {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface OrderResponse {
  id: number
  status: string
  totalAmount: number
  fullName: string
  phone: string
  city: string
  district: string
  address: string
  items: OrderItemResponse[]
  createdAt: string
}

export interface NotificationResponse {
  id: number
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export const orderApi = {
  create: (data: OrderRequest) =>
    api.post<{ message: string }>('/orders', data).then(r => r.data),

  listMy: () =>
    api.get<OrderResponse[]>('/orders/myOrders').then(r => r.data),
}

export const notificationApi = {
  listMy: () =>
    api.get<NotificationResponse[]>('/notifications/myNotifications').then(r => r.data),

  markRead: (id: number) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),
}
