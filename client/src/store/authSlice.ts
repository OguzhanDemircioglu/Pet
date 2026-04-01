import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data.user
  }
)

export const loadMeThunk = createAsyncThunk('auth/loadMe', async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  return authApi.me()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
      .addCase(loginThunk.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Hata' })
      .addCase(loadMeThunk.fulfilled, (state, action) => { state.user = action.payload })
  },
})

export const { logout, setUser } = authSlice.actions
export default authSlice.reducer
