/**
 * =================================================================
 * USER REPOSITORY
 * =================================================================
 * Tầng Repository - CHỈ tương tác với Database.
 * Tất cả các truy vấn SQL đều nằm ở đây.
 * Không chứa business logic.
 * =================================================================
 */

const pool = require('../config/database');

class UserRepository {
    /**
     * Tìm user theo username
     * @param {string} username
     * @returns {Object|null} User object hoặc null
     */
    async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Tìm user theo email
     * @param {string} email
     * @returns {Object|null} User object hoặc null
     */
    async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Tìm user theo ID
     * @param {number} id
     * @returns {Object|null} User object hoặc null
     */
    async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Tạo user mới
     * @param {Object} userData - { username, password_hash, email, full_name, role }
     * @returns {Object} Kết quả INSERT (chứa insertId)
     */
    async create(userData) {
        const { username, password_hash, email, full_name, role = 'user', is_verified = 1 } = userData;

        const [result] = await pool.execute(
            `INSERT INTO users (username, password_hash, email, full_name, role, is_verified) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, password_hash, email, full_name || null, role, is_verified]
        );

        return result;
    }

    /**
     * Cập nhật OTP cho user (theo email)
     * @param {string} email
     * @param {string} otpCode - Mã OTP 6 chữ số
     * @param {Date} otpExpiresAt - Thời gian hết hạn
     * @returns {Object} Kết quả UPDATE
     */
    async updateOtp(email, otpCode, otpExpiresAt) {
        const [result] = await pool.execute(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?',
            [otpCode, otpExpiresAt, email]
        );
        return result;
    }

    /**
     * Cập nhật trạng thái xác thực email
     * Đồng thời xóa OTP sau khi verify thành công
     * @param {string} email
     * @returns {Object} Kết quả UPDATE
     */
    async updateVerificationStatus(email) {
        const [result] = await pool.execute(
            'UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE email = ?',
            [email]
        );
        return result;
    }

    /**
     * Cập nhật mật khẩu (dùng cho reset password)
     * Đồng thời xóa OTP sau khi reset thành công
     * @param {string} email
     * @param {string} passwordHash - Mật khẩu đã được hash
     * @returns {Object} Kết quả UPDATE
     */
    async updatePasswordByEmail(email, passwordHash) {
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?',
            [passwordHash, email]
        );
        return result;
    }

    /**
     * Cập nhật thông tin profile
     * @param {number} id - User ID
    * @param {Object} data - { full_name, phone, address, bio, cuisine_preferences, daily_budget }
     * @returns {Object} Kết quả UPDATE
     */
    async updateProfile(id, data) {
        const { full_name, avatar_url, email, phone, address, bio, facebook_url, instagram_username, cuisine_preferences, daily_budget } = data;

        const [result] = await pool.execute(
            'UPDATE users SET full_name = ?, avatar_url = ?, email = ?, phone = ?, address = ?, bio = ?, facebook_url = ?, instagram_username = ?, cuisine_preferences = ?, daily_budget = ? WHERE id = ?',
            [
                full_name ?? null,
                avatar_url ?? null,
                email ?? null,
                phone ?? null,
                address ?? null,
                bio ?? null,
                facebook_url ?? null,
                instagram_username ?? null,
                cuisine_preferences ?? null,
                daily_budget ?? null,
                id
            ]
        );

        return result;
    }

    async updateHealthStats(id, height, weight, activityLevel) {
        const [result] = await pool.execute(
            'UPDATE users SET height = ?, weight = ?, activity_level = ? WHERE id = ?',
            [height, weight, activityLevel, id]
        );
        return result;
    }

    async getChefsRanking() {
        const sql = `
            SELECT 
                u.id, 
                u.username, 
                u.full_name, 
                u.avatar_url, 
                u.bio,
                u.role,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
                (SELECT COUNT(*) FROM recipes r JOIN saved_recipes sr ON r.id = sr.recipe_id WHERE r.author_id = u.id) AS likes_count,
                (SELECT COUNT(*) FROM recipes WHERE author_id = u.id) AS recipes_count
            FROM users u
            WHERE u.id IN (SELECT DISTINCT author_id FROM recipes)
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async updatePasswordById(id, passwordHash) {
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, id]
        );
        return result;
    }
}

// Export singleton instance
module.exports = new UserRepository();
