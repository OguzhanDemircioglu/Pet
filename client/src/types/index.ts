export interface Category {
  id: number
  name: string
  slug: string
  imageUrl: string | null
  displayOrder: number
  children: Category[]
}

export interface PriceTier {
  minQuantity: number
  maxQuantity: number | null
  unitPrice: number
}

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  shortDescription: string | null
  categoryName: string
  categoryId: number
  brandName: string | null
  basePrice: number
  vatRate: number
  moq: number
  availableStock: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  primaryImageUrl: string | null
  priceTiers: PriceTier[]
  averageRating: number | null
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'ADMIN' | 'CUSTOMER'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface AdminInfo {
  email: string
  phone: string | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
