import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean  // loadMeThunk tamamlandı mı?
  error: string | null
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.removeItem('pt-guest')
    return data.user
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string; firstName: string; lastName: string; phone: string }) => {
    return authApi.register(payload.email, payload.password, payload.firstName, payload.lastName, payload.phone)
  }
)

export const verifyEmailThunk = createAsyncThunk(
  'auth/verifyEmail',
  async ({ email, code }: { email: string; code: string }) => {
    const data = await authApi.verifyEmail(email, code)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.removeItem('pt-guest')
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
      localStorage.removeItem('pt-guest')
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
    updateUserPhone(state, action: PayloadAction<string>) {
      if (state.user) state.user.phone = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
      .addCase(loginThunk.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Hata' })
      .addCase(loadMeThunk.pending,    (state) => { state.initialized = false })
      .addCase(loadMeThunk.fulfilled,  (state, action) => { state.user = action.payload; state.initialized = true })
      .addCase(loadMeThunk.rejected,   (state) => { state.initialized = true })
      .addCase(verifyEmailThunk.fulfilled, (state, action) => { state.loading = false; state.user = action.payload })
  },
})

export const { logout, setUser, updateUserPhone } = authSlice.actions
export default authSlice.reducer
