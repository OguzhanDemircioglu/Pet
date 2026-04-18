import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { logout } from './authSlice'

export interface CartItem {
  productId: number
  name: string
  slug: string
  brandName: string | null
  basePrice: number
  unit: string
  minSellingQuantity: number
  availableStock: number
  primaryImageUrl: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('petshop_cart')
    if (!raw) return []
    const items = JSON.parse(raw) as CartItem[]
    // Eski localStorage kayıtlarında availableStock olmayabilir
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
      const existing = state.items.find(i => i.productId === action.payload.productId)
      const addQty = action.payload.quantity ?? action.payload.minSellingQuantity
      const stock = action.payload.availableStock
      if (existing) {
        existing.quantity = Math.min(existing.quantity + addQty, stock)
        existing.availableStock = stock   // stoğu güncel tut
      } else {
        state.items.push({ ...action.payload, quantity: Math.min(addQty, stock) })
      }
      saveToStorage(state.items)
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter(i => i.productId !== action.payload)
      saveToStorage(state.items)
    },
    updateQuantity(state, action: PayloadAction<{ productId: number; quantity: number }>) {
      const item = state.items.find(i => i.productId === action.payload.productId)
      if (item) {
        item.quantity = Math.max(item.minSellingQuantity, Math.min(action.payload.quantity, item.availableStock))
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
