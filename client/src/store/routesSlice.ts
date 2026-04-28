import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { routesApi, type AllowedRoutes } from '../api/routesApi'

interface State {
  data: AllowedRoutes
  loaded: boolean
}

const DEFAULTS: AllowedRoutes = {
  publicRoutes: ['/login', '/hakkimizda', '/iletisim', '/sss', '/gizlilik-politikasi', '/odeme-sonuc'],
  customerRoutes: ['/', '/urunler', '/urun/:slug', '/profil'],
  adminRoutes: [],
}

const LS_KEY = 'pt-allowed-routes'

function readCache(): AllowedRoutes | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.publicRoutes)) return parsed as AllowedRoutes
  } catch { /* ignore */ }
  return null
}

function writeCache(data: AllowedRoutes) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

const cached = readCache()
const initialState: State = {
  data: cached ?? DEFAULTS,
  loaded: cached !== null,
}

export const fetchAllowedRoutesThunk = createAsyncThunk<AllowedRoutes, void, { state: { routes: State } }>(
  'routes/fetch',
  async () => await routesApi.get(),
  {
    condition: (_, { getState }) => !getState().routes.loaded,
  },
)

const slice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    invalidateRoutes: (state) => {
      state.loaded = false
      try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAllowedRoutesThunk.fulfilled, (state, action) => {
      state.data = action.payload
      state.loaded = true
      writeCache(action.payload)
    })
  },
})

export const { invalidateRoutes } = slice.actions
export default slice.reducer
