import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { brandApi } from '../api/productApi'
import type { Brand } from '../types'
import type { RootState } from './index'

interface BrandState {
  brands: Brand[]
  loading: boolean
  loaded: boolean
}

const initialState: BrandState = {
  brands: [],
  loading: false,
  loaded: false,
}

export const fetchBrandsThunk = createAsyncThunk(
  'brands/fetch',
  async () => brandApi.adminList(),
  {
    condition: (_arg, { getState }) => {
      const state = getState() as RootState
      return !state.brands.loaded
    },
  }
)

const brandSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    resetBrands: (state) => { state.loaded = false },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrandsThunk.pending, (state) => { state.loading = true })
      .addCase(fetchBrandsThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.brands = action.payload
          state.loaded = true
        }
        state.loading = false
      })
      .addCase(fetchBrandsThunk.rejected, (state) => { state.loading = false })
  },
})

export const { resetBrands } = brandSlice.actions
export default brandSlice.reducer
