/**
 * =================================================================
 * NOTIFICATION CONTROLLER
 * =================================================================
 * Xử lý các request liên quan đến thông báo.
 * =================================================================
 */

const notificationService = require('../services/notification.service');

class NotificationController {
    /**
     * GET /api/notifications?page=1
     * Lấy danh sách thông báo của user hiện tại
     */
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const result = await notificationService.getNotifications(userId, page);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Đếm số thông báo chưa đọc
     */
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService.getUnreadCount(userId);
            return res.status(200).json({
                success: true,
                data: { unreadCount: count },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/notifications/:id/read
     * Đánh dấu 1 thông báo đã đọc
     */
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await notificationService.markAsRead(id, userId);
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu thông báo đã đọc',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/notifications/read-all
     * Đánh dấu tất cả thông báo đã đọc
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            await notificationService.markAllAsRead(userId);
            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu tất cả thông báo đã đọc',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
