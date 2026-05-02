import { createSlice } from '@reduxjs/toolkit'

export type CheckoutStep = 'cart' | 'login' | 'phone' | 'address' | 'invoice' | 'confirm'

interface UIState {
  cartOpen: boolean
  checkoutStep: CheckoutStep
  mobileMenuOpen: boolean
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartOpen: false,
    checkoutStep: 'cart' as CheckoutStep,
    mobileMenuOpen: false,
  } as UIState,
  reducers: {
    openCart(state) { state.cartOpen = true; state.checkoutStep = 'cart' },
    closeCart(state) { state.cartOpen = false },
    toggleCart(state) { state.cartOpen = !state.cartOpen },
    setCheckoutStep(state, action: { payload: CheckoutStep }) { state.checkoutStep = action.payload },
    openMobileMenu(state) { state.mobileMenuOpen = true },
    closeMobileMenu(state) { state.mobileMenuOpen = false },
  },
})

export const { openCart, closeCart, toggleCart, setCheckoutStep, openMobileMenu, closeMobileMenu } = uiSlice.actions
export default uiSlice.reducer
