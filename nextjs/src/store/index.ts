import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'
import uiReducer from './uiSlice'
import notificationReducer from './notificationSlice'

export const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
      notifications: notificationReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
