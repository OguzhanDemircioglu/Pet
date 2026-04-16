export interface Category {
  category_id: number
  category_name: string
  emoji: string | null
  category_slug: string
  parent_id: number | null
  parent_slug: string | null
  display_order: number
  has_product: boolean
}

export interface Brand {
  id: number
  name: string
  isActive: boolean
}


export interface ProductImage {
  id: number
  imageUrl: string
  isPrimary: boolean
  displayOrder: number
}

export interface ActiveDiscount {
  label: string       // "%20" veya "50 ₺"
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
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
  minSellingQuantity: number
  availableStock: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  primaryImageUrl: string | null
  averageRating: number | null
  images: ProductImage[]
  activeDiscount: ActiveDiscount | null
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

export interface CatalogProduct {
  id: number
  name: string
  slug: string
  sku: string
  shortDescription: string | null
  categoryId: number | null
  categoryName: string | null
  categorySlug: string | null
  brandId: number | null
  brandName: string | null
  basePrice: number
  vatRate: number
  minSellingQuantity: number
  availableStock: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  primaryImageUrl: string | null
  images: ProductImage[]
  activeDiscount: ActiveDiscount | null
}

export interface FeaturedProduct {
  id: number
  name: string
  slug: string
  brandName: string | null
  basePrice: number
  minSellingQuantity: number
  unit: string
  primaryImageUrl: string | null
  activeDiscount: ActiveDiscount | null
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

export interface Address {
  id: number
  title: string
  fullName: string
  phone: string
  city: string
  district: string
  addressLine: string
  isDefault: boolean
}

export interface AddressRequest {
  title: string
  fullName: string
  phone: string
  city: string
  district: string
  addressLine: string
  isDefault: boolean
}
