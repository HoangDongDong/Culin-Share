const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middlewares/authMiddleware');
const optionalAuth = (req, res, next) => req.headers.authorization ? verifyToken(req, res, next) : next();

/**
 * Rate limiter cho AI API
 * Giới hạn: Tối đa 10 requests trong 1 phút mỗi user
 * Mục đích: Tránh lạm dụng Gemini API key (tốn tiền)
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Bạn đã gửi quá nhiều yêu cầu AI. Vui lòng thử lại sau 1 phút.',
        });
    },
});

/**
 * POST /api/ai/fridge-suggest
 * Gợi ý công thức từ nguyên liệu trong tủ lạnh
 * Middlewares: verifyToken -> aiLimiter -> Controller
 */
router.post('/ai/fridge-suggest', verifyToken, aiLimiter, aiController.suggestRecipesFromFridge);
router.post('/ai/step-timers', verifyToken, aiLimiter, aiController.completeStepTimers);
router.post('/recipes/:id/step-timers', optionalAuth, aiLimiter, aiController.completeStoredStepTimers);
router.get('/ai/fridge-history', verifyToken, aiController.getFridgeHistory);
router.get('/ai/fridge-history/:id', verifyToken, aiController.getFridgeHistoryEntry);
router.delete('/ai/fridge-history/:id', verifyToken, aiController.deleteFridgeHistoryEntry);

/**
 * POST /api/ai/distribute-dishes
 * Dùng AI tính toán phân bổ số món theo độ khó
 */
router.post('/ai/distribute-dishes', verifyToken, aiLimiter, aiController.suggestDishDistribution);

module.exports = router;
