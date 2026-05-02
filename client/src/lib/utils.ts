const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function imgUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

export function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }
  return phone
}

export function discountedPrice(base: number, discount: { discountType: string; discountValue: number } | null): number {
  if (!discount) return base
  if (discount.discountType === 'PERCENT') return base * (1 - discount.discountValue / 100)
  if (discount.discountType === 'FIXED') return Math.max(0, base - discount.discountValue)
  return base
}
