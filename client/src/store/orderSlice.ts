import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { orderApi, type OrderResponse } from '../api/orderApi'
import type { RootState } from './index'

interface OrderState {
  items: OrderResponse[]
  loading: boolean
  loaded: boolean
  error: string | null
}

const initialState: OrderState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
}

export const fetchOrdersThunk = createAsyncThunk(
  'orders/fetch',
  async () => orderApi.listMy(),
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState
      return !state.orders.loaded
    },
  }
)

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    resetOrders: (state) => {
      state.loaded = false
      state.items = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchOrdersThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload
          state.loaded = true
        }
        state.loading = false
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Siparişler yüklenemedi'
      })
  },
})

export const { resetOrders } = orderSlice.actions
export default orderSlice.reducer
