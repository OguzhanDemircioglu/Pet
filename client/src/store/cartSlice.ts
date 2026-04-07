import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { logout } from './authSlice'

export interface CartItem {
  productId: number
  name: string
  slug: string
  brandName: string | null
  basePrice: number
  unit: string
  moq: number
  primaryImageUrl: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('pettoptan_cart')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToStorage(items: CartItem[]) {
  localStorage.setItem('pettoptan_cart', JSON.stringify(items))
}

const initialState: CartState = {
  items: loadFromStorage(),
  isOpen: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const existing = state.items.find(i => i.productId === action.payload.productId)
      if (existing) {
        existing.quantity += action.payload.moq
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.moq })
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
        item.quantity = Math.max(item.moq, action.payload.quantity)
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
