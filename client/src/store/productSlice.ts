import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '../api/productApi'
import type { Product } from '../types'
import type { RootState } from './index'

interface ProductState {
  products: Product[]
  loading: boolean
  loaded: boolean
}

const initialState: ProductState = {
  products: [],
  loading: false,
  loaded: false,
}

export const fetchProductsThunk = createAsyncThunk(
  'products/fetch',
  async (_force: boolean = false) => {
    const page = await productApi.list({ size: 500 })
    return page.content
  },
  {
    condition: (force, { getState }) => {
      if (force) return true
      const state = getState() as RootState
      return !state.products.loaded
    },
  }
)

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => { state.loading = true })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.products = action.payload
          state.loaded = true
        }
        state.loading = false
      })
      .addCase(fetchProductsThunk.rejected, (state) => { state.loading = false })
  },
})

export default productSlice.reducer
