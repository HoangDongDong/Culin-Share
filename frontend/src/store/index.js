import { configureStore } from '@reduxjs/toolkit'
import authReducer, { logoutAccount } from './authSlice'
import notificationReducer, { resetNotifications } from './notificationSlice'
import { setAuthExpiredHandler } from '../services/api'
import { disconnectSocket } from '../services/socket'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
  },
})

setAuthExpiredHandler(() => {
  store.dispatch(logoutAccount())
  store.dispatch(resetNotifications())
  disconnectSocket()
})
