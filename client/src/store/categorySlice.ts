import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoryApi } from '../api/productApi'
import type { Category } from '../types'
import type { RootState } from './index'

interface CategoryState {
  categories: Category[]
  loading: boolean
  loaded: boolean
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  loaded: false,
}

export const fetchCategoriesThunk = createAsyncThunk(
  'categories/fetch',
  async (_force: boolean = false) => categoryApi.list(),
  {
    condition: (force, { getState }) => {
      if (force) return true
      return !(getState() as RootState).categories.loaded
    },
  }
)

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategoriesThunk.pending, (state) => { state.loading = true })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.categories = action.payload
          state.loaded = true
        }
        state.loading = false
      })
      .addCase(fetchCategoriesThunk.rejected, (state) => {
        state.loading = false
      })
  },
})

export default categorySlice.reducer
