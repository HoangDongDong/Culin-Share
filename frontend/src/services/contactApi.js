import api from './api';

/**
 * Gửi tin nhắn liên hệ / phản hồi tới Ban Quản Trị CulinShare
 * @param {{ name: string, email: string, phone?: string, subject: string, message: string }} data 
 */
export const submitContactMessageApi = async (data) => {
  const response = await api.post('/api/contact', data);
  return response.data;
};

/**
 * Lấy danh sách tin nhắn liên hệ (dành cho Admin)
 */
export const getAdminContactMessagesApi = async (params = {}) => {
  const response = await api.get('/api/admin/contacts', { params });
  return response.data;
};

/**
 * Cập nhật trạng thái tin nhắn liên hệ (dành cho Admin)
 */
export const updateContactStatusApi = async (id, status) => {
  const response = await api.put(`/api/admin/contacts/${id}/status`, { status });
  return response.data;
};
