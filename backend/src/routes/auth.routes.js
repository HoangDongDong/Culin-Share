/**
 * =================================================================
 * AUTH ROUTES
 * =================================================================
 * Định nghĩa các route cho module Authentication:
 * - POST /api/login             (Rate Limit + Validation)
 * - POST /api/register          (Rate Limit + Validation)
 * - POST /api/verify-otp        (Validation)
 * - POST /api/auth/forgot-password (Rate Limit + Validation)
 * - POST /api/auth/reset-password  (Rate Limit + Validation)
 * =================================================================
 */

const express = require("express");
const router = express.Router();

// Import Controllers
const AuthController = require("../controllers/auth.controller");

// Import Middlewares
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middlewares/rateLimitMiddleware");
const {
  validateLogin,
  validateRegister,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
} = require("../middlewares/inputValidationMiddleware");

// ========================
// AUTH ROUTES
// ========================

/**
 * POST /api/login
 * Middlewares: Rate Limit -> Input Validation -> Controller
 *
 * Luồng: Client -> RateLimitMiddleware -> InputValidation -> AuthController.login
 */
router.post("/login", loginLimiter, validateLogin, AuthController.login);

/**
 * POST /api/auth/google
 * Đăng nhập bằng Google (OAuth2 ID Token)
 */
router.post("/auth/google", AuthController.googleLogin);

/**
 * POST /api/register
 * Middlewares: Rate Limit -> Input Validation -> Controller
 *
 * Luồng: Client -> RateLimitMiddleware -> InputValidation -> AuthController.register
 */
router.post(
  "/register",
  registerLimiter,
  validateRegister,
  AuthController.register,
);

/**
 * POST /api/verify-otp
 * Middlewares: Input Validation -> Controller
 *
 * Luồng: Client -> InputValidation -> AuthController.verifyOtp
 */
router.post("/verify-otp", validateVerifyOtp, AuthController.verifyOtp);

/**
 * POST /api/auth/forgot-password
 * Middlewares: Rate Limit -> Input Validation -> Controller
 *
 * Luồng: Client -> RateLimitMiddleware -> InputValidation -> AuthController.forgotPassword
 */
router.post(
  "/auth/forgot-password",
  forgotPasswordLimiter,
  validateForgotPassword,
  AuthController.forgotPassword,
);

/**
 * POST /api/auth/reset-password
 * Middlewares: Rate Limit -> Input Validation -> Controller
 *
 * Luồng: Client -> RateLimitMiddleware -> InputValidation -> AuthController.resetPassword
 */
router.post(
  "/auth/reset-password",
  resetPasswordLimiter,
  validateResetPassword,
  AuthController.resetPassword,
);

module.exports = router;
