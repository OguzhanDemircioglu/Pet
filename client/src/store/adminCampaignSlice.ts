import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { campaignApi, discountApi, type CampaignResponse, type DiscountResponse } from '../api/campaignApi'
import type { RootState } from './index'

interface AdminCampaignState {
  campaigns: CampaignResponse[]
  discounts: DiscountResponse[]
  activeEmojis: string[]
  loading: boolean
  loaded: boolean
}

const initialState: AdminCampaignState = {
  campaigns: [],
  discounts: [],
  activeEmojis: [],
  loading: false,
  loaded: false,
}

export const fetchAdminCampaignsThunk = createAsyncThunk(
  'adminCampaigns/fetch',
  async () => {
    const [c, d, ce, de] = await Promise.all([
      campaignApi.list(),
      discountApi.list(),
      campaignApi.getActiveEmojis(),
      discountApi.getActiveEmojis(),
    ])
    return { campaigns: c, discounts: d, activeEmojis: [...ce, ...de] }
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState() as RootState
      return !state.adminCampaigns.loaded
    },
  }
)

const adminCampaignSlice = createSlice({
  name: 'adminCampaigns',
  initialState,
  reducers: {
    resetAdminCampaigns: (state) => { state.loaded = false },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminCampaignsThunk.pending, (state) => { state.loading = true })
      .addCase(fetchAdminCampaignsThunk.fulfilled, (state, action) => {
        state.campaigns = action.payload.campaigns
        state.discounts = action.payload.discounts
        state.activeEmojis = action.payload.activeEmojis
        state.loaded = true
        state.loading = false
      })
      .addCase(fetchAdminCampaignsThunk.rejected, (state) => { state.loading = false })
  },
})

export const { resetAdminCampaigns } = adminCampaignSlice.actions
export default adminCampaignSlice.reducer
