import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { campaignApi, type CampaignResponse } from '../api/campaignApi'
import { productApi } from '../api/productApi'
import { setFeatured, setBestSellers, setNewArrivals, setDeals, fetchCatalogThunk } from './productSlice'
import type { RootState } from './index'
import { HEX_COLOR_RE } from '../constants/regex'

interface Slide {
  bg: string
  badge: string
  title: string
  sub: string
  btnColor: string
  emoji: string
  sticker?: string
  sourceType: 'info' | 'discount'
}

interface CampaignState {
  slides: Slide[]
  raw: CampaignResponse[]
  loading: boolean
  loaded: boolean
}

const extractFirstColor = (gradient: string): string => {
  const m = gradient.match(HEX_COLOR_RE)
  return m ? m[0] : '#dc2626'
}

export const FREE_SHIPPING_THRESHOLD = 750
export const FREE_SHIPPING_TITLE = `${FREE_SHIPPING_THRESHOLD} ₺ Üzeri\nÜcretsiz Kargo`

const FREE_SHIPPING_SLIDE: Slide = {
  bg: 'linear-gradient(135deg,#1e3a5f,#2d5a8e)',
  badge: 'Ücretsiz Kargo',
  title: FREE_SHIPPING_TITLE,
  sub: 'Tüm siparişlerde geçerli. Aynı gün kargolama.',
  btnColor: '#1e3a5f',
  emoji: '🚚',
  sourceType: 'info' as const,
}

const initialState: CampaignState = {
  slides: [FREE_SHIPPING_SLIDE],  // hemen görünür, API beklenmez
  raw: [],
  loading: false,
  loaded: false,
}

export const fetchHomepageThunk = createAsyncThunk(
  'campaigns/fetchHomepage',
  async (_, { dispatch }) => {
    const [data, bestSellers, newArrivals, deals] = await Promise.all([
      campaignApi.getHomepage(),
      productApi.bestSellers().catch(() => []),
      productApi.newArrivals().catch(() => []),
      productApi.deals().catch(() => []),
    ])
    dispatch(setFeatured(data.featured))
    dispatch(setBestSellers(bestSellers))
    dispatch(setNewArrivals(newArrivals))
    dispatch(setDeals(deals))
    return data
  },
  {
    condition: (_, { getState }) => {
      const state = (getState() as RootState).campaigns
      return !state.loaded && !state.loading
    },
  }
)

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    resetCampaigns: (state) => {
      state.loaded = false
      state.slides = [FREE_SHIPPING_SLIDE]
      state.raw = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomepageThunk.pending, (state) => { state.loading = true })
      .addCase(fetchHomepageThunk.fulfilled, (state) => {
        state.loaded = true
        state.loading = false
      })
      .addCase(fetchHomepageThunk.rejected, (state) => { state.loading = false })
      // Catalog yüklenince API slides'larını ekle (ücretsiz kargo olanları filtrele — DB'deki varyanttaki çift görünmeyi önler)
      .addCase(fetchCatalogThunk.fulfilled, (state, action) => {
        if (!action.payload) return
        const isFreeShipping = (c: CampaignResponse) =>
          c.title.toLowerCase().includes('ücretsiz kargo') ||
          c.badge.toLowerCase().includes('ücretsiz kargo') ||
          (c.title.toLowerCase().includes('kargo') && c.title.includes(String(FREE_SHIPPING_THRESHOLD)))
        const apiSlides: Slide[] = action.payload.slides
          .filter(c => !isFreeShipping(c))
          .map(c => ({
            bg: c.bgColor, badge: c.badge, title: c.title, sub: c.description || '',
            btnColor: extractFirstColor(c.bgColor), emoji: c.emoji || '📢',
            sticker: c.sticker || undefined,
            sourceType: c.sourceType === 'discount' ? 'discount' as const : 'info' as const,
          }))
        state.raw = action.payload.slides
        state.slides = [FREE_SHIPPING_SLIDE, ...apiSlides]
      })
  },
})

export const { resetCampaigns } = campaignSlice.actions
export default campaignSlice.reducer
