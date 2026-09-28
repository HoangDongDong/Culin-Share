/**
 * =================================================================
 * USER SERVICE
 * =================================================================
 * Tầng Service - Xử lý Business Logic cốt lõi.
 * Gọi Repository để truy vấn DB, xử lý logic nghiệp vụ.
 * =================================================================
 */

const bcrypt = require('bcryptjs');
const axios = require('axios');
const pool = require('../config/database');
const userRepository = require('../repositories/user.repository');
const JWTService = require('./jwt.service');
const EmailService = require('./email.service');
const { generateOtp, getOtpExpiry } = require('../utils/otp.util');
const { toUserDTO } = require('../utils/dto.util');

class UserService {
    /**
     * Xác thực thông tin đăng nhập
     * Flow: Tìm user -> So sánh password -> Tạo JWT
     * 
     * @param {string} username
     * @param {string} password
     * @returns {Object} { token, user } nếu thành công
     * @throws {Error} Nếu sai thông tin đăng nhập
     */
    async verifyCredentials(username, password) {
        // Bước 1: Tìm user theo username hoặc email từ Repository
        let user = await userRepository.findByUsername(username);
        if (!user) {
            user = await userRepository.findByEmail(username);
        }
        
        if (!user) {
            const error = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
            error.statusCode = 401;
            throw error;
        }

        // Bước 2: Kiểm tra tài khoản đã xác thực chưa
        if (!user.is_verified) {
            const error = new Error('Tài khoản chưa được xác thực email. Vui lòng verify OTP.');
            error.statusCode = 403;
            throw error;
        }

        // Bước 3: So sánh password bằng bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            const error = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
            error.statusCode = 401;
            throw error;
        }

        // Bước 4: Tạo JWT token qua JWTService
        const token = JWTService.generateToken(user);

        // Bước 5: Trả về token và user DTO
        return {
            token,
            user: toUserDTO(user)
        };
    }

    /**
     * Đăng ký tài khoản mới
     * Flow: Check trùng -> Hash password -> Lưu DB -> Gen OTP -> Gửi email
     * 
     * @param {Object} data - { username, password, email, full_name }
     * @returns {Object} Thông tin đăng ký
     */
    async registerUser(data) {
        const normalizeString = (value) => {
            if (typeof value !== 'string') return value;
            const trimmed = value.trim();
            return trimmed ? trimmed : null;
        };

        let username = normalizeString(data.username);
        const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : data.email;
        const full_name = normalizeString(data.full_name);
        const password = data.password;

        const otpTtlMinutes = Number(process.env.OTP_TTL_MINUTES) || 10;

        // Bước 1: Kiểm tra username đã tồn tại chưa
        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
            if (existingUser.is_verified === 0) {
                // Xóa tài khoản chưa xác thực cũ để đăng ký mới
                await pool.query('DELETE FROM users WHERE id = ?', [existingUser.id]);
            } else {
                const error = new Error('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.');
                error.statusCode = 409;
                throw error;
            }
        }

        // Bước 2: Kiểm tra email đã tồn tại chưa
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
            if (existingEmail.is_verified === 0) {
                // Xóa tài khoản chưa xác thực cũ để đăng ký mới
                await pool.query('DELETE FROM users WHERE id = ?', [existingEmail.id]);
            } else {
                const error = new Error('Email đã được sử dụng');
                error.statusCode = 409;
                throw error;
            }
        }

        // Bước 3: Hash password bằng bcrypt (salt rounds = 10)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Bước 4: Lưu user vào DB với is_verified = 0 (cần OTP xác thực)
        const result = await userRepository.create({
            username,
            password_hash,
            email,
            full_name,
            is_verified: 0
        });

        // Thực hiện sinh và gửi OTP
        const otp = generateOtp();
        const otpExpiry = getOtpExpiry(otpTtlMinutes);
        await userRepository.updateOtp(email, otp, otpExpiry);
        await EmailService.sendOtpEmail(email, otp, otpTtlMinutes);

        return {
            message: 'Đăng ký thành công!',
            userId: result.insertId,
            email
        };
    }

    /**
     * Xác thực OTP
     * Flow: Tìm user theo email -> Check OTP -> Check hết hạn -> Update verified
     * 
     * @param {string} email
     * @param {string} otp
     * @returns {Object} Kết quả xác thực
     */
    async verifyOtp(email, otp) {
        // Bước 1: Tìm user theo email
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
        const user = await userRepository.findByEmail(normalizedEmail);
        if (!user) {
            const error = new Error('Email không tồn tại trong hệ thống');
            error.statusCode = 404;
            throw error;
        }

        if (user.is_verified) {
            return { message: 'Tài khoản đã được xác thực trước đó.' };
        }

        // Bước 2: Kiểm tra OTP có khớp không
        if (user.otp_code !== otp) {
            const error = new Error('Mã OTP không đúng');
            error.statusCode = 400;
            throw error;
        }

        // Bước 3: Kiểm tra OTP hết hạn chưa
        if (new Date() > new Date(user.otp_expires_at)) {
            const error = new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
            error.statusCode = 400;
            throw error;
        }

        // Bước 4: Cập nhật trạng thái xác thực
        await userRepository.updateVerificationStatus(normalizedEmail);

        return { message: 'Xác thực email thành công! Bạn có thể đăng nhập.' };
    }

    /**
     * Quên mật khẩu - Gửi OTP qua email
     * 
     * @param {string} email
     * @returns {Object} Thông báo
     */
    async forgotPassword(email) {
        // Bước 1: Kiểm tra email tồn tại
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const error = new Error('Email không tồn tại trong hệ thống');
            error.statusCode = 404;
            throw error;
        }

        // Bước 2: Sinh OTP mới
        const otp = generateOtp();
        const otpExpiry = getOtpExpiry(10);

        // Bước 3: Lưu OTP vào DB
        await userRepository.updateOtp(email, otp, otpExpiry);

        // Bước 4: Gửi email OTP reset password
        await EmailService.sendResetPasswordOtp(email, otp);

        return { message: 'Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.' };
    }

    /**
     * Đặt lại mật khẩu
     * Flow: Check email -> Verify OTP -> Hash new password -> Update DB
     * 
     * @param {string} email
     * @param {string} otp
     * @param {string} newPassword
     * @returns {Object} Kết quả
     */
    async resetPassword(email, otp, newPassword) {
        // Bước 1: Tìm user
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const error = new Error('Email không tồn tại trong hệ thống');
            error.statusCode = 404;
            throw error;
        }

        // Bước 2: Kiểm tra OTP
        if (user.otp_code !== otp) {
            const error = new Error('Mã OTP không đúng');
            error.statusCode = 400;
            throw error;
        }

        // Bước 3: Kiểm tra hết hạn
        if (new Date() > new Date(user.otp_expires_at)) {
            const error = new Error('Mã OTP đã hết hạn');
            error.statusCode = 400;
            throw error;
        }

        // Bước 4: Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Bước 5: Cập nhật mật khẩu trong DB
        await userRepository.updatePasswordByEmail(email, passwordHash);

        return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.' };
    }

    /**
     * Lấy thông tin profile user
     * Trả về User DTO (lược bỏ thông tin nhạy cảm)
     * 
     * @param {number} userId
     * @returns {Object} User DTO
     */
    async getProfileData(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('Không tìm thấy người dùng');
            error.statusCode = 404;
            throw error;
        }
        return toUserDTO(user);
    }

    /**
     * Cập nhật thông tin profile
     * 
     * @param {number} userId
    * @param {Object} data - { full_name, phone, address, bio, cuisine_preferences, daily_budget }
     * @returns {Object} Updated User DTO
     */
    async updateProfile(userId, data) {
        // Bước 1: Kiểm tra user tồn tại
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('Không tìm thấy người dùng');
            error.statusCode = 404;
            throw error;
        }

        const normalizeString = (value) => {
            if (value === undefined) return undefined;
            if (value === null) return null;
            if (typeof value !== 'string') return value;
            const trimmed = value.trim();
            return trimmed ? trimmed : null;
        };

        const normalizeEmail = (value) => {
            const normalized = normalizeString(value);
            if (normalized === undefined || normalized === null) return normalized;
            if (typeof normalized !== 'string') return normalized;
            return normalized.toLowerCase();
        };

        const normalizeUrl = (value) => {
            const normalized = normalizeString(value);
            if (normalized === undefined || normalized === null) return normalized;
            if (typeof normalized !== 'string') return normalized;
            return normalized;
        };

        const normalizePhone = (value) => {
            const normalized = normalizeString(value);
            if (normalized === undefined || normalized === null) return normalized;
            if (typeof normalized !== 'string') return normalized;
            const cleaned = normalized.replace(/[\s-]+/g, '');
            return cleaned ? cleaned : null;
        };

        const normalizeCuisinePreferences = (value) => {
            if (value === undefined) return undefined;
            if (value === null) return null;
            if (Array.isArray(value)) {
                const cleaned = value
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter((item) => item);
                return cleaned.length ? JSON.stringify(cleaned) : null;
            }
            if (typeof value === 'string') {
                const trimmed = value.trim();
                return trimmed ? trimmed : null;
            }
            return null;
        };

        const normalizeDailyBudget = (value) => {
            if (value === undefined) return undefined;
            if (value === null || value === '') return null;
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : undefined;
        };

        const mergeField = (incoming, existing) => (incoming === undefined ? existing : incoming);

        const nextEmail = normalizeEmail(data.email);
        if (nextEmail !== undefined && nextEmail !== user.email) {
            const emailOwner = await userRepository.findByEmail(nextEmail);
            if (emailOwner && emailOwner.id !== userId) {
                const error = new Error('Email đã được sử dụng');
                error.statusCode = 409;
                throw error;
            }
        }

        // Bước 2: Merge dữ liệu (giữ giá trị cũ nếu không gửi mới)
        const updateData = {
            full_name: mergeField(normalizeString(data.full_name), user.full_name),
            avatar_url: mergeField(normalizeUrl(data.avatar_url), user.avatar_url),
            email: mergeField(nextEmail, user.email),
            phone: mergeField(normalizePhone(data.phone), user.phone),
            address: mergeField(normalizeString(data.address), user.address),
            bio: mergeField(normalizeString(data.bio), user.bio),
            facebook_url: mergeField(normalizeUrl(data.facebook_url), user.facebook_url),
            instagram_username: mergeField(normalizeString(data.instagram_username), user.instagram_username),
            cuisine_preferences: mergeField(
                normalizeCuisinePreferences(data.cuisine_preferences),
                user.cuisine_preferences
            ),
            daily_budget: mergeField(normalizeDailyBudget(data.daily_budget), user.daily_budget)
        };

        // Bước 3: Cập nhật DB
        await userRepository.updateProfile(userId, updateData);

        // Bước 4: Lấy lại user mới và trả về DTO
        const updatedUser = await userRepository.findById(userId);
        return toUserDTO(updatedUser);
    }

    async updateHealthStats(userId, data) {
        const { height, weight, activity_level, gender = 'male', age = 25 } = data;

        const heightVal = parseInt(height);
        const weightVal = parseInt(weight);

        if (isNaN(heightVal) || heightVal <= 0) {
            const error = new Error('Chiều cao không hợp lệ');
            error.statusCode = 400;
            throw error;
        }

        if (isNaN(weightVal) || weightVal <= 0) {
            const error = new Error('Cân nặng không hợp lệ');
            error.statusCode = 400;
            throw error;
        }

        const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
        const activityLevel = validActivityLevels.includes(activity_level) ? activity_level : 'sedentary';

        // Update database
        await userRepository.updateHealthStats(userId, heightVal, weightVal, activityLevel);

        // Fetch updated user profile
        const user = await userRepository.findById(userId);
        const userDTO = toUserDTO(user);

        // Calculate BMI
        const heightMeters = heightVal / 100;
        const bmi = parseFloat((weightVal / (heightMeters * heightMeters)).toFixed(2));
        
        let bmiStatus = 'Bình thường';
        if (bmi < 18.5) bmiStatus = 'Thiếu cân';
        else if (bmi >= 25 && bmi < 29.9) bmiStatus = 'Thừa cân';
        else if (bmi >= 29.9) bmiStatus = 'Béo phì';

        // Calculate BMR (Mifflin-St Jeor Equation)
        const ageVal = parseInt(age) || 25;
        const bmr = (10 * weightVal) + (6.25 * heightVal) - (5 * ageVal) + (gender === 'female' ? -161 : 5);

        // Map activity level to multiplier
        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };
        const multiplier = multipliers[activityLevel] || 1.2;
        const tdee = Math.round(bmr * multiplier);

        return {
            user: userDTO,
            health_stats: {
                height: heightVal,
                weight: weightVal,
                activity_level: activityLevel,
                bmi,
                bmi_status: bmiStatus,
                bmr: Math.round(bmr),
                tdee
            }
        };
    }

    async getChefsRanking() {
        return await userRepository.getChefsRanking();
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error('Không tìm thấy người dùng');
            error.statusCode = 404;
            throw error;
        }

        // Kiểm tra mật khẩu cũ
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            const error = new Error('Mật khẩu hiện tại không chính xác');
            error.statusCode = 400;
            throw error;
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Cập nhật database
        await userRepository.updatePasswordById(userId, passwordHash);
    }

    /**
     * Xác thực và đăng nhập bằng Google OAuth
     * 
     * @param {string} idToken
     * @returns {Object} { token, user }
     */
    async loginWithGoogle(idToken) {
        if (!idToken) {
            const error = new Error('Google ID Token là bắt buộc');
            error.statusCode = 400;
            throw error;
        }

        try {
            // Xác thực token với API Google
            const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            const payload = googleRes.data;

            if (!payload || !payload.email) {
                const error = new Error('Token Google không hợp lệ');
                error.statusCode = 400;
                throw error;
            }

            const email = payload.email.trim().toLowerCase();
            const fullName = payload.name || 'Người dùng Google';
            const avatarUrl = payload.picture || null;

            // Tìm user theo email
            let user = await userRepository.findByEmail(email);

            if (!user) {
                // Tạo tài khoản mới tự động
                // Tạo username ngẫu nhiên từ email prefix + 4 số cuối timestamp
                const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                const randomSuffix = Date.now().toString().slice(-4);
                const username = `${emailPrefix}${randomSuffix}`;

                // Tạo mật khẩu ngẫu nhiên bảo mật (không dùng)
                const salt = await bcrypt.genSalt(10);
                const randomPassword = Math.random().toString(36).substring(2, 15);
                const password_hash = await bcrypt.hash(randomPassword, salt);

                // Lưu vào DB với is_verified = 1
                const result = await userRepository.create({
                    username,
                    password_hash,
                    email,
                    full_name: fullName,
                    is_verified: 1 // Tự động xác thực tài khoản Google
                });

                // Cập nhật ảnh đại diện nếu có
                if (avatarUrl) {
                    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, result.insertId]);
                }

                // Lấy thông tin user vừa tạo
                user = await userRepository.findById(result.insertId);
            } else if (user.is_verified === 0) {
                // Nếu tài khoản đã được đăng ký nháp nhưng chưa xác thực OTP, 
                // tự động kích hoạt luôn vì đăng nhập qua Google là an toàn
                await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
                user.is_verified = 1;
            }

            // Tạo JWT token qua JWTService
            const token = JWTService.generateToken(user);

            return {
                token,
                user: toUserDTO(user)
            };
        } catch (error) {
            console.error('❌ Lỗi đăng nhập Google:', error.message);
            const err = new Error(error.response?.data?.error_description || 'Xác thực Google thất bại');
            err.statusCode = 401;
            throw err;
        }
    }
}

module.exports = new UserService();
