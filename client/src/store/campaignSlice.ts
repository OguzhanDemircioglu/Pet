import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { campaignApi, type CampaignResponse, type DiscountResponse } from '../api/campaignApi'
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
  activeDiscounts: DiscountResponse[]
  loading: boolean
  loaded: boolean
  discountsLoaded: boolean
}

const initialState: CampaignState = {
  slides: [],
  raw: [],
  activeDiscounts: [],
  loading: false,
  loaded: false,
  discountsLoaded: false,
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

export const fetchActiveDiscountsThunk = createAsyncThunk(
  'campaigns/fetchActiveDiscounts',
  async () => campaignApi.getActiveDiscounts(),
  {
    condition: (_arg, { getState }) => {
      const state = getState() as RootState
      return !state.campaigns.discountsLoaded
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
    resetActiveDiscounts: (state) => {
      state.discountsLoaded = false
      state.activeDiscounts = []
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
      .addCase(fetchActiveDiscountsThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeDiscounts = action.payload
          state.discountsLoaded = true
        }
      })
  },
})

export const { resetCampaigns, resetActiveDiscounts } = campaignSlice.actions
export default campaignSlice.reducer
