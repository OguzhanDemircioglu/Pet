import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { NotificationResponse } from '@/types'

interface NotificationState {
  items: NotificationResponse[]
  loaded: boolean
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], loaded: false } as NotificationState,
  reducers: {
    setNotifications(state, action: PayloadAction<NotificationResponse[]>) {
      state.items = action.payload
      state.loaded = true
    },
    markRead(state, action: PayloadAction<number>) {
      const n = state.items.find(x => x.id === action.payload)
      if (n) n.isRead = true
    },
    markAllRead(state) {
      state.items.forEach(n => { n.isRead = true })
    },
    reset(state) {
      state.items = []
      state.loaded = false
    },
  },
})

export const { setNotifications, markRead, markAllRead, reset: resetNotifications } = notificationSlice.actions
export default notificationSlice.reducer
