/**
 * =================================================================
 * JWT SERVICE
 * =================================================================
 * Tầng Service xử lý logic JWT (JSON Web Token).
 * Tạo và xác thực token.
 * =================================================================
 */

const jwt = require('jsonwebtoken');

class JWTService {
    /**
     * Tạo JWT Token từ thông tin user
     * 
     * Payload chứa: id, role
    * Token có thời hạn theo config JWT_EXPIRES_IN (mặc định 15m)
     * 
     * @param {Object} user - User object { id, role }
     * @returns {string} JWT Token
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        return token;
    }

    /**
     * Xác thực và giải mã JWT Token
     * 
     * @param {string} token - JWT Token cần verify
     * @returns {Object} Decoded payload { id, role, iat, exp }
     * @throws {JsonWebTokenError} Nếu token không hợp lệ
     * @throws {TokenExpiredError} Nếu token hết hạn
     */
    verifyToken(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
}

// Export singleton instance
module.exports = new JWTService();
