/**
 * =================================================================
 * AUTH CONTROLLER
 * =================================================================
 * Tầng Controller - Nhận Request, gọi Service, trả về Response.
 * Không chứa business logic, chỉ điều phối.
 * =================================================================
 */

const UserService = require("../services/user.service");

class AuthController {
  /**
   * POST /api/login
   * Đăng nhập tài khoản
   *
   * Body: { username, password }
   * Response: { success, message, data: { token, user } }
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Gọi Service xác thực
      const result = await UserService.verifyCredentials(username, password);

      // Trả về HTTP 200 OK kèm JWT token
      return res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      // Trả về lỗi từ Service (401, 403, ...)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  /**
   * POST /api/register
   * Đăng ký tài khoản mới
   *
   * Body: { username, password, email, full_name }
   * Response: { success, message, data }
   */
  async register(req, res, next) {
    try {
      const { username, password, email, full_name } = req.body;

      // Gọi Service đăng ký
      const result = await UserService.registerUser({
        username,
        password,
        email,
        full_name,
      });

      // Trả về HTTP 201 Created
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          email: result.email,
        },
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  /**
   * POST /api/verify-otp
   * Xác thực OTP email
   *
   * Body: { email, otp }
   * Response: { success, message }
   */
  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;

      const result = await UserService.verifyOtp(email, otp);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Gửi OTP đặt lại mật khẩu
   *
   * Body: { email }
   * Response: { success, message, data }
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await UserService.forgotPassword(email);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: { email },
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Đặt lại mật khẩu bằng OTP
   *
   * Body: { email, otp, newPassword, confirmPassword }
   * Response: { success, message }
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      const result = await UserService.resetPassword(email, otp, newPassword);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Lỗi server",
      });
    }
  }

  /**
   * POST /api/auth/google
   * Đăng nhập / đăng ký bằng tài khoản Google
   *
   * Body: { idToken }
   * Response: { success, message, data: { token, user } }
   */
  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;

      const result = await UserService.loginWithGoogle(idToken);

      return res.status(200).json({
        success: true,
        message: "Đăng nhập bằng Google thành công",
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Xác thực Google thất bại",
      });
    }
  }
}

module.exports = new AuthController();
