const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const contactController = require('../controllers/contact.controller');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const contactRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10, // tối đa 10 tin nhắn/phút
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi một lát rồi thử lại.'
    }
});

// Route gửi tin nhắn liên hệ (Công khai)
router.post('/contact', contactRateLimit, contactController.submit);

// Route quản trị viên xem và quản lý tin nhắn liên hệ
router.get('/admin/contacts', verifyToken, authorize('admin'), contactController.getMessages);
router.put('/admin/contacts/:id/status', verifyToken, authorize('admin'), contactController.updateStatus);

module.exports = router;
