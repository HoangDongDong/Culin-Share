import axios from 'axios'
import toast from 'react-hot-toast'

let onAuthExpired = () => {}
export const setAuthExpiredHandler = (handler) => { onAuthExpired = handler }

const isAuthRequest = (url = '') =>
  /\/(?:login|register|verify-otp|auth\/(?:google|forgot-password|reset-password))\/?$/.test(url.split('?')[0])

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tự động thêm Token JWT vào header nếu có trong localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token')
    if (token && !isAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Tự động xử lý lỗi 401 (Unauthorized / Token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('token')
        // Ignore failures from requests belonging to an older session.
        if (!token || error.config?.headers?.Authorization !== `Bearer ${token}`) {
          return Promise.reject(error)
        }
        // Xóa token và user khỏi localStorage để tự động logout
        window.localStorage.removeItem('token')
        window.localStorage.removeItem('user')
        window.localStorage.removeItem('fridgeItems')
        onAuthExpired()
        
        // Hiển thị thông báo đẹp mắt bằng react-hot-toast
        const msg = error.response.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        toast.error(msg, { id: 'auth-error' }); // Sử dụng ID cố định để tránh hiển thị nhiều Toast trùng lặp
        
        window.location.replace('/login');
      }
    }
    return Promise.reject(error)
  }
)

export const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
};

export default api
