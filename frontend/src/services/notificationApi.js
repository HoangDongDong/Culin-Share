/**
 * =================================================================
 * NOTIFICATION API SERVICE
 * =================================================================
 * Gọi REST API cho thông báo: lấy danh sách, đếm chưa đọc,
 * đánh dấu đã đọc.
 * =================================================================
 */

import api from './api';

/**
 * Lấy danh sách thông báo (phân trang)
 */
export const fetchNotificationsApi = async (page = 1) => {
    const response = await api.get(`/api/notifications?page=${page}`);
    return response.data;
};

/**
 * Lấy số thông báo chưa đọc
 */
export const fetchUnreadCountApi = async () => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
};

/**
 * Đánh dấu 1 thông báo đã đọc
 */
export const markAsReadApi = async (notificationId) => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllAsReadApi = async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
};
