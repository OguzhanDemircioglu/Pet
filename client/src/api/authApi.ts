import api from './axios'
import type { AuthResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),

  register: (email: string, password: string, firstName: string, lastName: string) =>
    api.post<AuthResponse>('/auth/register', { email, password, firstName, lastName }).then(r => r.data),

  googleAuth: (idToken: string) =>
    api.post<AuthResponse>('/auth/google', { idToken }).then(r => r.data),

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),

  logout: () =>
    api.post('/auth/logout'),
}
