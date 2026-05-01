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

export interface ProductVariant {
  id: number
  label: string
  price: number
  stockQuantity: number
  availableStock: number
  displayOrder: number
  isActive: boolean
}

export interface ActiveDiscount {
  label: string
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
  availableStock: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  primaryImageUrl: string | null
  averageRating: number | null
  reviewCount: number | null
  images: ProductImage[]
  activeDiscount: ActiveDiscount | null
  variants: ProductVariant[]
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'ADMIN' | 'CUSTOMER'
  pendingEmailChange: boolean
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
  availableStock: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  primaryImageUrl: string | null
  images: ProductImage[]
  activeDiscount: ActiveDiscount | null
  variants: ProductVariant[]
}

export interface FeaturedProduct {
  id: number
  name: string
  slug: string
  brandName: string | null
  basePrice: number
  availableStock: number
  unit: string
  primaryImageUrl: string | null
  activeDiscount: ActiveDiscount | null
  variants: ProductVariant[]
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

export interface SiteSettings {
  brandPart1: string
  brandPart2: string
  contactEmail: string
  contactPhone: string
  companyAddress: string
  contactHours: string
  mapCoords: string
  appDomain: string
  appYear: string
}

export interface CartItem {
  productId: number
  variantId?: number
  variantLabel?: string
  name: string
  slug: string
  brandName: string | null
  basePrice: number
  unit: string
  availableStock: number
  primaryImageUrl: string | null
  quantity: number
}

export interface CampaignResponse {
  id: number | null
  title: string
  badge: string
  description: string | null
  emoji: string | null
  sticker: string | null
  bgColor: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string | null
  sourceType: 'info' | 'discount' | null
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

export interface CatalogResponse {
  products: CatalogProduct[]
  categories: Category[]
  activeDiscounts: DiscountResponse[]
  slides: CampaignResponse[]
}

export interface OrderItemRequest {
  productId: number
  variantId?: number | null
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
  invoiceType: 'INDIVIDUAL' | 'CORPORATE'
  invoiceIdentityNo: string
  invoiceTitle?: string
  invoiceTaxOffice?: string
  invoiceAddress?: string
  invoiceCity?: string
  invoiceDistrict?: string
}

export interface OrderItemResponse {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface OrderResponse {
  id: number
  orderNumber?: string
  status: string
  paymentMethod: string
  totalAmount: number
  fullName: string
  phone: string
  city: string
  district: string
  address: string
  items: OrderItemResponse[]
  createdAt: string
  invoiceType?: 'INDIVIDUAL' | 'CORPORATE' | null
  parasutInvoiceStatus?: 'PENDING' | 'CREATED' | 'FAILED' | 'CANCELLED' | null
  parasutEBelgeUrl?: string | null
  refundedAt?: string | null
  refundReason?: string | null
}

export interface NotificationResponse {
  id: number
  message: string
  type: string
  isRead: boolean
  createdAt: string
  relatedOrderId?: number
}

export interface PaymentInitiateResponse {
  orderId: number
  paymentPageUrl: string
}

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

export interface CouponValidationResponse {
  valid: boolean
  message: string
  discountAmount: number
  discountType: string | null
  couponCode: string
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
