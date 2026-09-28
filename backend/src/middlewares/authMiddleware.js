/**
 * =================================================================
 * AUTH MIDDLEWARE (verifyToken)
 * =================================================================
 * Xác thực JWT Token từ Header Authorization.
 * Nếu token hợp lệ, giải mã payload (id, role) và gắn vào req.user.
 * 
 * Lớp bảo mật thứ 3: AUTHENTICATION (JWT)
 * =================================================================
 */

const JWTService = require('../services/jwt.service');

/**
 * Middleware xác thực JWT Token
 * 
 * Luồng xử lý:
 * 1. Lấy token từ header Authorization: "Bearer <token>"
 * 2. Nếu không có token -> trả về 401 Unauthorized
 * 3. Verify token bằng JWTService
 * 4. Nếu token không hợp lệ hoặc hết hạn -> trả về 401
 * 5. Nếu hợp lệ -> gắn payload (id, role) vào req.user -> next()
 */
const verifyToken = (req, res, next) => {
    try {
        // Bước 1: Lấy Authorization header
        const authHeader = req.headers['authorization'];

        // Bước 2: Kiểm tra header có tồn tại và đúng format "Bearer <token>"
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Không tìm thấy token xác thực. Vui lòng đăng nhập.'
            });
        }

        // Tách token từ header (bỏ prefix "Bearer ")
        const token = authHeader.split(' ')[1];

        // Bước 3: Kiểm tra token có rỗng không
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Token không hợp lệ.'
            });
        }

        // Bước 4: Verify và decode token
        const decoded = JWTService.verifyToken(token);

        // Bước 5: Gắn payload vào req.user để các handler tiếp theo sử dụng
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        // Chuyển tiếp tới middleware/handler tiếp theo
        next();
    } catch (error) {
        // Token hết hạn
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Token đã hết hạn. Vui lòng đăng nhập lại.'
            });
        }

        // Token không hợp lệ (sai signature, malformed, ...)
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Token không hợp lệ.'
        });
    }
};

module.exports = { verifyToken };
