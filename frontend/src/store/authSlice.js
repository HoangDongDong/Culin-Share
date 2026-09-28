import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '../services/api'
import { loginApi, updateProfileApi, uploadAvatarApi } from '../services/authApi'

// AsyncThunk Đăng ký tài khoản
export const registerAccount = createAsyncThunk(
  'auth/registerAccount',
  async (payload, { rejectWithValue }) => {
    try {
      const endpoint =
        import.meta.env.VITE_REGISTER_ENDPOINT || '/api/register'
      const response = await api.post(endpoint, payload)
      return response.data
    } catch (error) {
      // Nếu backend trả về danh sách lỗi validation, gom tất cả lại
      const validationErrors = error.response?.data?.errors
      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        const allMessages = validationErrors.map(e => e.message).join('\n')
        return rejectWithValue(allMessages)
      }
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Đăng ký thất bại'
      return rejectWithValue(message)
    }
  },
)

// AsyncThunk Đăng nhập tài khoản
export const loginAccount = createAsyncThunk(
  'auth/loginAccount',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await loginApi(username, password)
      if (response?.success && response?.data) {
        // Lưu vào localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.removeItem('fridgeItems')
      }
      return response.data
    } catch (error) {
      const message =
        error.message ||
        error.error ||
        'Đăng nhập thất bại'
      return rejectWithValue(message)
    }
  },
)

// AsyncThunk Cập nhật thông tin Profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await updateProfileApi(profileData)
      if (response) {
        // Cập nhật lại thông tin user trong localStorage
        localStorage.setItem('user', JSON.stringify(response))
      }
      return response
    } catch (error) {
      const message =
        error.message ||
        error.error ||
        'Cập nhật thông tin thất bại'
      return rejectWithValue(message)
    }
  },
)

// AsyncThunk Tải ảnh đại diện
export const uploadUserAvatar = createAsyncThunk(
  'auth/uploadUserAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await uploadAvatarApi(formData)
      if (response) {
        // Cập nhật lại thông tin user trong localStorage
        localStorage.setItem('user', JSON.stringify(response))
      }
      return response
    } catch (error) {
      const message =
        error.message ||
        error.error ||
        'Tải ảnh đại diện thất bại'
      return rejectWithValue(message)
    }
  },
)

// Khôi phục session từ localStorage khi khởi động
const savedToken = localStorage.getItem('token') || null
let savedUser = null
try {
  const userStr = localStorage.getItem('user')
  savedUser = userStr ? JSON.parse(userStr) : null
} catch (e) {
  console.error('Lỗi phân tích user từ localStorage:', e)
  localStorage.removeItem('user')
}

const initialState = {
  token: savedToken,
  user: savedUser,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  result: null,
  profileStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  profileError: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
      state.profileError = null
    },
    resetAuthState(state) {
      state.status = 'idle'
      state.profileStatus = 'idle'
      state.error = null
      state.profileError = null
      state.result = null
    },
    logoutAccount(state) {
      state.token = null
      state.user = null
      state.status = 'idle'
      state.profileStatus = 'idle'
      state.error = null
      state.profileError = null
      state.result = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('fridgeItems')
    },
    setGoogleAuth(state, action) {
      state.status = 'succeeded';
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.result = action.payload;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.removeItem('fridgeItems');
    },
  },
  extraReducers: (builder) => {
    builder
      // Đăng ký
      .addCase(registerAccount.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerAccount.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.result = action.payload
      })
      .addCase(registerAccount.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Đăng nhập
      .addCase(loginAccount.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.user = action.payload.user
        state.result = action.payload
      })
      .addCase(loginAccount.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Cập nhật Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileStatus = 'loading'
        state.profileError = null
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded'
        state.user = action.payload
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileStatus = 'failed'
        state.profileError = action.payload
      })
      // Tải ảnh đại diện
      .addCase(uploadUserAvatar.pending, (state) => {
        state.profileStatus = 'loading'
        state.profileError = null
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded'
        state.user = action.payload
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.profileStatus = 'failed'
        state.profileError = action.payload
      })
  },
})

export const { clearAuthError, resetAuthState, logoutAccount, setGoogleAuth } = authSlice.actions
export default authSlice.reducer
