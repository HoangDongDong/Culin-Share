/**
 * =================================================================
 * ROLE MIDDLEWARE (Authorization)
 * =================================================================
 * Kiểm tra quyền truy cập dựa trên role của user.
 * Middleware này phải được đặt SAU authMiddleware (verifyToken)
 * vì nó cần req.user.role đã được gắn từ bước xác thực.
 * 
 * Lớp bảo mật thứ 4: AUTHORIZATION (Role-based)
 * =================================================================
 */

/**
 * Factory function tạo middleware kiểm tra role
 * 
 * @param  {...string} allowedRoles - Danh sách các role được phép truy cập
 * @returns {Function} Express middleware
 * 
 * @example
 * // Chỉ cho phép admin truy cập
 * router.get('/admin/profile', verifyToken, authorize('admin'), controller)
 * 
 * // Cho phép cả user và admin truy cập
 * router.get('/user/profile', verifyToken, authorize('user', 'admin'), controller)
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Kiểm tra req.user đã được gắn từ authMiddleware chưa
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Vui lòng đăng nhập trước.'
            });
        }

        // Kiểm tra role của user có nằm trong danh sách cho phép không
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Không có quyền truy cập. Bạn cần quyền: ' + allowedRoles.join(' hoặc ')
            });
        }

        // Role hợp lệ -> chuyển tiếp
        next();
    };
};

module.exports = { authorize };
