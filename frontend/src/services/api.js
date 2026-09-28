import axios from 'axios'
import toast from 'react-hot-toast'

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Tự động xử lý lỗi 401 (Unauthorized / Token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        // Xóa token và user khỏi localStorage để tự động logout
        window.localStorage.removeItem('token')
        window.localStorage.removeItem('user')
        
        // Hiển thị thông báo đẹp mắt bằng react-hot-toast
        const msg = error.response.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        toast.error(msg, { id: 'auth-error' }); // Sử dụng ID cố định để tránh hiển thị nhiều Toast trùng lặp
        
        // Trì hoãn 1.5 giây để người dùng kịp nhìn thấy thông báo trước khi chuyển hướng
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
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
