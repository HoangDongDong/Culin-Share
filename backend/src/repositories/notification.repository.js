/**
 * =================================================================
 * NOTIFICATION REPOSITORY
 * =================================================================
 * Truy vấn database cho bảng notifications.
 * =================================================================
 */

const pool = require('../config/database');

class NotificationRepository {
    /**
     * Tạo notification mới
     * @returns {number} insertId
     */
    async create(notificationData) {
        const { user_id, sender_id, type, recipe_id, message } = notificationData;
        const [result] = await pool.query(
            `INSERT INTO notifications (user_id, sender_id, type, recipe_id, message)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, sender_id, type, recipe_id || null, message]
        );
        return result.insertId;
    }

    /**
     * Tìm notification theo id (kèm thông tin sender)
     */
    async findById(id) {
        const [rows] = await pool.query(
            `SELECT n.*, u.username AS sender_username, u.full_name AS sender_name, u.avatar_url AS sender_avatar
             FROM notifications n
             JOIN users u ON n.sender_id = u.id
             WHERE n.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Lấy danh sách notifications theo userId, phân trang
     */
    async findByUserId(userId, limit = 20, offset = 0) {
        const [rows] = await pool.query(
            `SELECT n.*, u.username AS sender_username, u.full_name AS sender_name, u.avatar_url AS sender_avatar
             FROM notifications n
             JOIN users u ON n.sender_id = u.id
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return rows;
    }

    /**
     * Đếm số notification chưa đọc
     */
    async countUnread(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows[0].count;
    }

    /**
     * Đánh dấu đã đọc 1 notification
     */
    async markAsRead(notificationId, userId) {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    }

    /**
     * Đánh dấu tất cả đã đọc cho 1 user
     */
    async markAllAsRead(userId) {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );
    }
}

module.exports = new NotificationRepository();
