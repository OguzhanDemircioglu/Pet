import api from './axios'
import type { AdminInfo, AuthResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),

  register: (email: string, password: string, firstName: string, lastName: string, phone: string) =>
    api.post<{ message: string }>('/auth/register', { email, password, firstName, lastName, phone }).then(r => r.data),

  verifyEmail: (email: string, code: string) =>
    api.post<AuthResponse>('/auth/verify-email', { email, code }).then(r => r.data),

  googleAuth: (accessToken: string) =>
    api.post<AuthResponse>('/auth/google', { accessToken }).then(r => r.data),

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),

  logout: () =>
    api.post('/auth/logout'),

  updatePhone: (phone: string) =>
    api.patch<User>('/auth/me/phone', { phone }).then(r => r.data),

  adminInfo: () =>
    api.get<AdminInfo>('/public/admin-info').then(r => r.data),
}
