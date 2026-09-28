import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import notificationReducer from './notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
  },
})
