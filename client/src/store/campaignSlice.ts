import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { campaignApi, type CampaignResponse } from '../api/campaignApi'
import type { RootState } from './index'

interface Slide {
  bg: string
  badge: string
  title: string
  sub: string
  btnColor: string
  emoji: string
  sticker?: string
}

interface CampaignState {
  slides: Slide[]
  raw: CampaignResponse[]
  loading: boolean
  loaded: boolean
}

const initialState: CampaignState = {
  slides: [],
  raw: [],
  loading: false,
  loaded: false,
}

const extractFirstColor = (gradient: string): string => {
  const m = gradient.match(/#[0-9a-fA-F]{6}/)
  return m ? m[0] : '#dc2626'
}

export const fetchCampaignsThunk = createAsyncThunk(
  'campaigns/fetch',
  async () => {
    const data = await campaignApi.getActiveCampaigns()
    const slides: Slide[] = data.map(c => ({
      bg: c.bgColor,
      badge: c.badge,
      title: c.title,
      sub: c.description || '',
      btnColor: extractFirstColor(c.bgColor),
      emoji: c.emoji || '📢',
      sticker: c.sticker || undefined,
    }))
    return { raw: data, slides }
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState() as RootState
      return !state.campaigns.loaded
    },
  }
)

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    resetCampaigns: (state) => {
      state.loaded = false
      state.slides = []
      state.raw = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaignsThunk.pending, (state) => { state.loading = true })
      .addCase(fetchCampaignsThunk.fulfilled, (state, action) => {
        state.slides = action.payload.slides
        state.raw = action.payload.raw
        state.loaded = true
        state.loading = false
      })
      .addCase(fetchCampaignsThunk.rejected, (state) => { state.loading = false })
  },
})

export const { resetCampaigns } = campaignSlice.actions
export default campaignSlice.reducer
