'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from '@/store'
import { hydrateCart, loadCartFromStorage } from '@/store/cartSlice'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  // Hydration: client-side mount sonrası localStorage'tan sepeti yükle.
  // SSR ile aynı initialState (boş) → hydrate sonrası gerçek veri.
  useEffect(() => {
    const items = loadCartFromStorage()
    if (items.length > 0) storeRef.current!.dispatch(hydrateCart(items))
    else storeRef.current!.dispatch(hydrateCart([]))
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}
