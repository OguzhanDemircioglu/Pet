import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { siteSettingsApi, type SiteSettings } from '../api/siteSettingsApi'

interface State {
  data: SiteSettings
  loaded: boolean
}

const DEFAULTS: SiteSettings = {
  brandPart1: 'Pet',
  brandPart2: 'Toptan',
  contactEmail: 'info@petshop.com.tr',
  contactPhone: '905000000000',
  companyAddress: '',
  contactHours: 'Haftaiçi 09:00–18:00',
  mapCoords: '',
  appDomain: 'petshop.com.tr',
  appYear: String(new Date().getFullYear()),
}

const LS_KEY = 'pt-site-settings'

function readCache(): SiteSettings | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'brandPart1' in parsed) return parsed as SiteSettings
  } catch { /* ignore */ }
  return null
}

function writeCache(data: SiteSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

const cached = readCache()
const initialState: State = {
  data: cached ?? DEFAULTS,
  loaded: cached !== null,
}

/**
 * localStorage'da cache varsa endpoint'e gidilmez.
 * Admin panelinden update yapıldığında cache yenilenir; ayrıca dışarıdan
 * `invalidateSiteSettings()` çağrısıyla da zorla refetch tetiklenebilir.
 */
export const fetchSiteSettingsThunk = createAsyncThunk<SiteSettings, void, { state: { siteSettings: State } }>(
  'siteSettings/fetch',
  async () => await siteSettingsApi.get(),
  {
    condition: (_, { getState }) => !getState().siteSettings.loaded,
  },
)

const slice = createSlice({
  name: 'siteSettings',
  initialState,
  reducers: {
    setSiteSettings: (state, action: PayloadAction<SiteSettings>) => {
      state.data = action.payload
      state.loaded = true
      writeCache(action.payload)
    },
    invalidateSiteSettings: (state) => {
      state.loaded = false
      try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSiteSettingsThunk.fulfilled, (state, action) => {
      state.data = action.payload
      state.loaded = true
      writeCache(action.payload)
    })
  },
})

export const { setSiteSettings, invalidateSiteSettings } = slice.actions
export default slice.reducer
