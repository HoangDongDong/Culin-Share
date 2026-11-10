/**
 * =================================================================
 * RATE LIMIT MIDDLEWARE
 * =================================================================
 * Giới hạn số lượng request trong một khoảng thời gian nhất định.
 * Bảo vệ API khỏi brute-force attack và DDoS.
 *
 * Lớp bảo mật thứ 1: RATE LIMITING
 * =================================================================
 */

const rateLimit = require("express-rate-limit");

/**
 * Rate limiter cho API Login
 * Giới hạn: Tối đa 5 requests trong 15 phút
 * Mục đích: Chống brute-force tấn công mật khẩu
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  message: {
    success: false,
    message:
      "Too Many Requests - Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true, // Trả về rate limit info trong `RateLimit-*` headers
  legacyHeaders: false, // Tắt `X-RateLimit-*` headers cũ
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too Many Requests - Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    });
  },
});

/**
 * Rate limiter cho API Register
 * Giới hạn: Tối đa 5 requests trong 15 phút
 * Mục đích: Chống spam tạo tài khoản
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  message: {
    success: false,
    message:
      "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 15 phút.",
    });
  },
});

/**
 * Rate limiter cho API Forgot Password
 * Giới hạn: Tối đa 3 requests trong 15 phút
 * Mục đích: Chống spam email OTP
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3, // Tối đa 3 requests
  message: {
    success: false,
    message:
      "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
    });
  },
});

/**
 * Rate limiter cho API Reset Password
 * Giới hạn: Tối đa 5 requests trong 15 phút
 * Mục đích: Chống spam reset password
 */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  message: {
    success: false,
    message:
      "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too Many Requests - Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
    });
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
