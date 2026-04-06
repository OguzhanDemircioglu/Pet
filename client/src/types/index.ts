export interface Category {
  category_id: number
  category_name: string
  emoji: string | null
  category_slug: string
  parent_id: number | null
  display_order: number
  has_product: boolean
}

export interface Brand {
  id: number
  name: string
  isActive: boolean
}

export interface PriceTier {
  minQuantity: number
  maxQuantity: number | null
  unitPrice: number
}

export interface ProductImage {
  id: number
  imageUrl: string
  isPrimary: boolean
  displayOrder: number
}

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  shortDescription: string | null
  categoryName: string
  categorySlug: string | null
  categoryId: number
  brandId: number | null
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
  images: ProductImage[]
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

export interface AdminUser {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: 'ADMIN' | 'CUSTOMER'
  createdAt: string
}
