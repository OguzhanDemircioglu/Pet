import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationApi, type NotificationResponse } from '../api/orderApi'
import type { RootState } from './index'

interface NotificationState {
  items: NotificationResponse[]
  loading: boolean
  loaded: boolean
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  loaded: false,
}

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetch',
  async () => notificationApi.listMy(),
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState
      return !state.notifications.loaded
    },
  }
)

export const markReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (id: number) => {
    await notificationApi.markRead(id)
    return id
  }
)

export const markAllReadThunk = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await notificationApi.markAllRead()
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: (state) => {
      state.loaded = false
      state.items = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => { state.loading = true })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload
          state.loaded = true
        }
        state.loading = false
      })
      .addCase(fetchNotificationsThunk.rejected, (state) => { state.loading = false })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        const id = action.payload
        const n = state.items.find(x => x.id === id)
        if (n) n.isRead = true
      })
      .addCase(markAllReadThunk.fulfilled, (state) => {
        state.items.forEach(n => { n.isRead = true })
      })
  },
})

export const { resetNotifications } = notificationSlice.actions
export default notificationSlice.reducer
