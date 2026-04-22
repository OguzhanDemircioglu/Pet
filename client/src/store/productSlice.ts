import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '../api/productApi'
import type { DiscountResponse } from '../api/campaignApi'
import { setCategories } from './categorySlice'
import type { CatalogProduct, FeaturedProduct } from '../types'
import type { RootState } from './index'

interface ProductState {
  products: CatalogProduct[]
  loading: boolean
  catalogLoaded: boolean
  activeDiscounts: DiscountResponse[]
  featured: FeaturedProduct[]
  featuredLoaded: boolean
}

const initialState: ProductState = {
  products: [],
  loading: false,
  catalogLoaded: false,
  activeDiscounts: [],
  featured: [],
  featuredLoaded: false,
}

export const fetchCatalogThunk = createAsyncThunk(
  'products/fetchCatalog',
  async (_, { dispatch }) => {
    const data = await productApi.catalog()
    dispatch(setCategories(data.categories))
    dispatch(setActiveDiscounts(data.activeDiscounts))
    return data
  },
  {
    condition: (_, { getState }) => {
      const s = getState() as RootState
      return !s.products.catalogLoaded && !s.products.loading
    },
  }
)

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFeatured: (state, action) => {
      state.featured = action.payload
      state.featuredLoaded = true
    },
    setActiveDiscounts: (state, action) => {
      state.activeDiscounts = action.payload
    },
    resetCatalog: (state) => {
      state.catalogLoaded = false
      state.products = []
    },
    resetFeatured: (state) => {
      state.featuredLoaded = false
      state.featured = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogThunk.pending, (state) => { state.loading = true })
      .addCase(fetchCatalogThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.products = action.payload.products
          state.catalogLoaded = true
        }
        state.loading = false
      })
      .addCase(fetchCatalogThunk.rejected, (state) => { state.loading = false })
  },
})

export const { setFeatured, setActiveDiscounts, resetCatalog, resetFeatured } = productSlice.actions
export default productSlice.reducer
