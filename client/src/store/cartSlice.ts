import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { logout } from './authSlice'

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

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

/** Sepet satırının benzersiz anahtarı: aynı ürünün farklı varyantları ayrı satır */
function sameItem(a: CartItem, b: { productId: number; variantId?: number }) {
  return a.productId === b.productId && (a.variantId ?? undefined) === (b.variantId ?? undefined)
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('petshop_cart')
    if (!raw) return []
    const items = JSON.parse(raw) as CartItem[]
    return items.map(i => ({ ...i, availableStock: i.availableStock ?? 999999 }))
  } catch { return [] }
}

function saveToStorage(items: CartItem[]) {
  localStorage.setItem('petshop_cart', JSON.stringify(items))
}

const initialState: CartState = {
  items: loadFromStorage(),
  isOpen: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
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
    openCart(state) { state.isOpen = true },
    closeCart(state) { state.isOpen = false },
    toggleCart(state) { state.isOpen = !state.isOpen },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => { state.items = []; state.isOpen = false; saveToStorage([]) })
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart, openCart, closeCart, toggleCart } = cartSlice.actions
export default cartSlice.reducer
