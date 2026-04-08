import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import productReducer from './productSlice'
import categoryReducer from './categorySlice'
import cartReducer from './cartSlice'
import campaignReducer from './campaignSlice'
import brandReducer from './brandSlice'
import adminCampaignReducer from './adminCampaignSlice'
import notificationReducer from './notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    categories: categoryReducer,
    cart: cartReducer,
    campaigns: campaignReducer,
    brands: brandReducer,
    adminCampaigns: adminCampaignReducer,
    notifications: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
