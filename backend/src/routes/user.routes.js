/**
 * =================================================================
 * USER ROUTES
 * =================================================================
 * Định nghĩa các route cho module User/Admin Profile:
 * - GET  /user/profile       (Auth + Role: user/admin)
 * - GET  /admin/profile      (Auth + Role: admin)
 * - PUT  /user/profile       (Auth + Role: user/admin + Validation)
 * 
 * Tất cả route đều yêu cầu JWT Authentication (verifyToken)
 * và Role Authorization (authorize).
 * =================================================================
 */

const express = require('express');
const router = express.Router();

// Import Controllers
const UserController = require('../controllers/user.controller');

// Import Middlewares
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { validateUpdateProfile } = require('../middlewares/inputValidationMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ========================
// USER PROFILE ROUTES
// ========================

/**
 * GET /user/profile
 * Lấy profile của user đang đăng nhập
 * Middlewares: verifyToken -> authorize('user', 'admin') -> Controller
 * 
 * Luồng: Client -> AuthMiddleware -> RoleMiddleware -> UserController.getProfile
 */
router.get(
    '/user/profile',
    verifyToken,
    authorize('user', 'admin'),
    UserController.getProfile
);

/**
 * GET /api/users/:id
 * Lấy profile của user theo ID (public)
 */
router.get(
    '/api/users/:id',
    UserController.getProfileById
);

/**
 * GET /api/chefs/ranking
 * Lấy bảng xếp hạng đầu bếp nổi bật (public)
 */
router.get(
    '/api/chefs/ranking',
    UserController.getChefsRanking
);

/**
 * PUT /user/profile
 * Cập nhật thông tin profile
 * Middlewares: verifyToken -> authorize('user', 'admin') -> Validation -> Controller
 * 
 * Luồng: Client -> AuthMiddleware -> RoleMiddleware -> InputValidation -> UserController.updateProfile
 */
router.put(
    '/user/profile',
    verifyToken,
    authorize('user', 'admin'),
    validateUpdateProfile,
    UserController.updateProfile
);

/**
 * PUT /user/password
 * Đổi mật khẩu của user đang đăng nhập
 */
router.put(
    '/user/password',
    verifyToken,
    authorize('user', 'admin'),
    UserController.changePassword
);

/**
 * POST /user/avatar
 * Tải lên ảnh đại diện của user đang đăng nhập
 * Middlewares: verifyToken -> authorize('user', 'admin') -> upload.single('avatar') -> Controller
 */
router.post(
    '/user/avatar',
    verifyToken,
    authorize('user', 'admin'),
    (req, res, next) => {
        upload.single('avatar')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    },
    UserController.updateAvatar
);

/**
 * PUT /api/me/health
 * Cập nhật chỉ số sức khỏe & tính TDEE (Đã đồng bộ)
 */
router.put(
    '/api/me/health',
    verifyToken,
    authorize('user', 'admin'),
    UserController.updateHealthStats
);

/**
 * PUT /user/health-stats
 * Giữ nguyên để tương thích ngược
 */
router.put(
    '/user/health-stats',
    verifyToken,
    authorize('user', 'admin'),
    UserController.updateHealthStats
);


// ========================
// ADMIN PROFILE ROUTES
// ========================

/**
 * GET /admin/profile
 * Lấy profile admin (chỉ admin mới truy cập được)
 * Middlewares: verifyToken -> authorize('admin') -> Controller
 * 
 * Luồng: Client -> AuthMiddleware -> RoleMiddleware(admin) -> UserController.getAdminProfile
 */
router.get(
    '/admin/profile',
    verifyToken,
    authorize('admin'),
    UserController.getAdminProfile
);

module.exports = router;
