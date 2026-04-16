import api from './axios'
import type { Address, AddressRequest } from '../types'

export const addressApi = {
  list: () =>
    api.get<Address[]>('/addresses').then(r => r.data),

  create: (data: AddressRequest) =>
    api.post<Address>('/addresses', data).then(r => r.data),

  update: (id: number, data: AddressRequest) =>
    api.put<Address>(`/addresses/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/addresses/${id}`),

  setDefault: (id: number) =>
    api.patch<Address>(`/addresses/${id}/default`).then(r => r.data),
}
