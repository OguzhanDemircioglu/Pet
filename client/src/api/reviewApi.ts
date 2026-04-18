import api from './axios'

export interface ReviewResponse {
  id: number
  rating: number
  comment: string | null
  userName: string
  userId: number | null
  createdAt: string
}

export interface CanReviewResponse {
  canReview: boolean
  reason: 'not_ordered' | 'already_reviewed' | 'ok'
  orderId: number | null
}

export const reviewApi = {
  list: (slug: string) =>
    api.get<ReviewResponse[]>(`/products/${slug}/reviews`).then(r => r.data),

  canReview: (slug: string) =>
    api.get<CanReviewResponse>(`/products/${slug}/reviews/can-review`).then(r => r.data),

  create: (slug: string, rating: number, comment: string) =>
    api.post<ReviewResponse>(`/products/${slug}/reviews`, { rating, comment: comment || null }).then(r => r.data),

  update: (slug: string, id: number, rating: number, comment: string) =>
    api.put<ReviewResponse>(`/products/${slug}/reviews/${id}`, { rating, comment: comment || null }).then(r => r.data),

  delete: (slug: string, id: number) =>
    api.delete(`/products/${slug}/reviews/${id}`),
}
