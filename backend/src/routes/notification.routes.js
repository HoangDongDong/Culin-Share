/**
 * =================================================================
 * NOTIFICATION ROUTES
 * =================================================================
 * Tất cả routes đều yêu cầu xác thực JWT.
 * =================================================================
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

// Lấy danh sách thông báo
router.get('/notifications', verifyToken, (req, res, next) => notificationController.getNotifications(req, res, next));

// Đếm số thông báo chưa đọc
router.get('/notifications/unread-count', verifyToken, (req, res, next) => notificationController.getUnreadCount(req, res, next));

// Đánh dấu tất cả đã đọc (phải đặt TRƯỚC /:id để tránh conflict)
router.put('/notifications/read-all', verifyToken, (req, res, next) => notificationController.markAllAsRead(req, res, next));

// Đánh dấu 1 thông báo đã đọc
router.put('/notifications/:id/read', verifyToken, (req, res, next) => notificationController.markAsRead(req, res, next));

module.exports = router;
