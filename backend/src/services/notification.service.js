/**
 * =================================================================
 * NOTIFICATION SERVICE
 * =================================================================
 * Xử lý logic nghiệp vụ cho thông báo:
 * - Tạo notification lưu DB + emit realtime qua Socket.io
 * - Truy vấn danh sách, đánh dấu đã đọc
 * =================================================================
 */

const notificationRepository = require('../repositories/notification.repository');
const { emitToUser } = require('../config/socket');

class NotificationService {
    /**
     * Tạo thông báo mới, lưu DB và gửi realtime tới user đích
     * @param {object} params
     * @param {number} params.userId - Người nhận
     * @param {number} params.senderId - Người gửi (tạo sự kiện)
     * @param {string} params.type - 'comment' | 'review' | 'follow'
     * @param {number|null} params.recipeId - ID recipe liên quan (nếu có)
     * @param {string} params.message - Nội dung thông báo
     */
    async createAndNotify({ userId, senderId, type, recipeId = null, message }) {
        // Không gửi thông báo cho chính mình
        if (userId === senderId) return;

        try {
            // Lưu vào database
            const notificationId = await notificationRepository.create({
                user_id: userId,
                sender_id: senderId,
                type,
                recipe_id: recipeId,
                message,
            });

            // Lấy notification đầy đủ (kèm thông tin sender)
            const notification = await notificationRepository.findById(notificationId);

            // Emit realtime tới user đích
            if (notification) {
                emitToUser(userId, 'new_notification', notification);
            }

            return notification;
        } catch (error) {
            // Log lỗi nhưng không throw để không ảnh hưởng flow chính
            console.error('❌ Lỗi tạo notification:', error.message);
        }
    }

    /**
     * Lấy danh sách notifications theo user, phân trang
     */
    async getNotifications(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const notifications = await notificationRepository.findByUserId(userId, limit, offset);
        const unreadCount = await notificationRepository.countUnread(userId);

        return {
            notifications,
            unreadCount,
            page,
            limit,
        };
    }

    /**
     * Lấy số thông báo chưa đọc
     */
    async getUnreadCount(userId) {
        return await notificationRepository.countUnread(userId);
    }

    /**
     * Đánh dấu đã đọc 1 notification
     */
    async markAsRead(notificationId, userId) {
        await notificationRepository.markAsRead(notificationId, userId);
    }

    /**
     * Đánh dấu tất cả đã đọc
     */
    async markAllAsRead(userId) {
        await notificationRepository.markAllAsRead(userId);
    }
}

module.exports = new NotificationService();
