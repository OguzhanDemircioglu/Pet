import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  hydrated: boolean // localStorage'dan okuma tamamlandı mı? — hydration mismatch'i önler
}

const STORAGE_KEY = 'petshop_cart'

function sameItem(a: CartItem, b: { productId: number; variantId?: number }) {
  return a.productId === b.productId && (a.variantId ?? undefined) === (b.variantId ?? undefined)
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items = JSON.parse(raw) as CartItem[]
    return items.map(i => ({ ...i, availableStock: i.availableStock ?? 999999 }))
  } catch { return [] }
}

const cartSlice = createSlice({
  name: 'cart',
  // Server ve client arasında deterministik kalmak için her zaman boş başlar.
  // localStorage hydration StoreProvider'da useEffect içinde yapılır.
  initialState: { items: [], hydrated: false } as CartState,
  reducers: {
    hydrateCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload
      state.hydrated = true
    },
    addToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) {
      const existing = state.items.find(i => sameItem(i, action.payload))
      const addQty = action.payload.quantity ?? 1
      const stock = action.payload.availableStock
      if (existing) {
        existing.quantity = Math.min(existing.quantity + addQty, stock)
        existing.availableStock = stock
      } else {
        state.items.push({ ...action.payload, quantity: Math.min(addQty, stock) })
      }
      saveToStorage(state.items)
    },
    removeFromCart(state, action: PayloadAction<{ productId: number; variantId?: number }>) {
      state.items = state.items.filter(i => !sameItem(i, action.payload))
      saveToStorage(state.items)
    },
    updateQuantity(state, action: PayloadAction<{ productId: number; variantId?: number; quantity: number }>) {
      const item = state.items.find(i => sameItem(i, action.payload))
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.availableStock))
        saveToStorage(state.items)
      }
    },
    clearCart(state) {
      state.items = []
      saveToStorage([])
    },
  },
})

export const { hydrateCart, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer
