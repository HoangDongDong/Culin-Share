/**
 * =================================================================
 * INPUT VALIDATION MIDDLEWARE
 * =================================================================
 * Sử dụng express-validator để validate dữ liệu đầu vào.
 * Đảm bảo các field không rỗng và đúng định dạng trước khi
 * chuyển tới Controller.
 *
 * Lớp bảo mật thứ 2: INPUT VALIDATION
 * =================================================================
 */

const { body, validationResult } = require("express-validator");

/**
 * Middleware xử lý kết quả validation
 * Nếu có lỗi validation, trả về 400 Bad Request với chi tiết lỗi.
 * Nếu không có lỗi, chuyển tiếp tới handler tiếp theo.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Lấy danh sách lỗi, format lại cho dễ đọc
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: extractedErrors,
    });
  }

  next();
};

/**
 * Validation rules cho API Login
 * - username: không rỗng
 * - password: không rỗng
 */
const validateLogin = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username không được để trống"),

  body("password").notEmpty().withMessage("Password không được để trống"),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

/**
 * Validation rules cho API Register
 * - username: không rỗng, tối thiểu 3 ký tự, chỉ chứa chữ và số
 * - password: không rỗng, tối thiểu 8 ký tự, có chữ và số
 * - email: không rỗng, đúng định dạng email
 * - full_name: optional, nếu có thì 2-100 ký tự
 */
const validateRegister = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username không được để trống")
    .isLength({ min: 3 })
    .withMessage("Username phải có ít nhất 3 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username chỉ được chứa chữ cái, số và dấu gạch dưới"),

  body("password")
    .notEmpty()
    .withMessage("Password không được để trống")
    .isLength({ min: 8 })
    .withMessage("Password phải có ít nhất 8 ký tự")
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage("Password phải chứa ít nhất 1 chữ cái và 1 số"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng")
    .normalizeEmail(),

  body("full_name")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

/**
 * Validation rules cho API Verify OTP
 * - email: không rỗng, đúng format
 * - otp: không rỗng, đúng 6 ký tự số
 */
const validateVerifyOtp = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Mã OTP không được để trống")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có đúng 6 chữ số")
    .isNumeric()
    .withMessage("Mã OTP chỉ chứa số"),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

/**
 * Validation rules cho API Forgot Password
 * - email: không rỗng, đúng format
 */
const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

/**
 * Validation rules cho API Reset Password
 * - email: không rỗng, đúng format
 * - otp: không rỗng, 6 chữ số
 * - newPassword: không rỗng, tối thiểu 6 ký tự
 * - confirmPassword: phải khớp newPassword
 */
const validateResetPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Mã OTP không được để trống")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có đúng 6 chữ số")
    .isNumeric()
    .withMessage("Mã OTP chỉ chứa số"),

  body("newPassword")
    .notEmpty()
    .withMessage("Mật khẩu mới không được để trống")
    .isLength({ min: 8 })
    .withMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 số"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Xác nhận mật khẩu không được để trống")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Mật khẩu xác nhận không khớp"),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

const fullNameRegex = /^[\p{L}\s.'-]+$/u;

/**
 * Validation rules cho API Update Profile
 * - fullName/full_name: optional, nếu có thì không rỗng và không chứa ký tự đặc biệt
 * - phone: optional, nếu có thì đúng format
 * - address: optional (legacy)
 * - bio: optional
 * - cuisinePreferences/cuisine_preferences: optional (string hoặc array string)
 * - dailyBudget/daily_budget: optional, phải là số dương
 */
const validateUpdateProfile = [
  body("avatarUrl")
    .optional({ nullable: true })
    .trim(),

  body("email")
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  body("fullName").custom((value, { req }) => {
    const target = value ?? req.body.full_name;
    if (target === undefined || target === null) return true;
    if (typeof target !== "string") {
      throw new Error("Họ tên phải là chuỗi");
    }
    const trimmed = target.trim();
    if (!trimmed) {
      throw new Error("Họ tên không được để trống nếu được cung cấp");
    }
    if (!fullNameRegex.test(trimmed)) {
      throw new Error("Họ tên không được chứa ký tự đặc biệt");
    }
    return true;
  }),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại phải có 10-11 chữ số"),

  body("address").optional({ nullable: true }).trim(),

  body("bio")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null) return true;
      if (typeof value !== "string") {
        throw new Error("Bio phải là chuỗi");
      }
      return true;
    })
    .trim(),

  body("facebookUrl")
    .optional({ checkFalsy: true })
    .trim(),

  body("instagramUsername")
    .optional({ checkFalsy: true })
    .trim(),

  body("cuisinePreferences").custom((value, { req }) => {
    const target = value ?? req.body.cuisine_preferences;
    if (target === undefined || target === null) return true;
    if (Array.isArray(target)) {
      const invalid = target.some(
        (item) => typeof item !== "string" || !item.trim(),
      );
      if (invalid) {
        throw new Error("Sở thích ẩm thực chỉ chứa chuỗi không rỗng");
      }
      return true;
    }
    if (typeof target === "string") {
      return true;
    }
    throw new Error("Sở thích ẩm thực phải là chuỗi hoặc mảng chuỗi");
  }),

  body("dailyBudget").custom((value, { req }) => {
    const target = value ?? req.body.daily_budget;
    if (target === undefined || target === null || target === "") return true;
    const num = Number(target);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("Ngân sách phải là số dương");
    }
    return true;
  }),

  // Middleware xử lý kết quả validation
  handleValidationErrors,
];

/**
 * Validation rules cho API Create/Update Recipe
 */
const validateRecipe = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề công thức không được để trống")
    .isLength({ max: 150 })
    .withMessage("Tiêu đề công thức tối đa 150 ký tự"),

  body("description")
    .optional({ nullable: true })
    .trim(),

  body("prep_time_minutes")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      const target = value ?? req.body.prepTimeMinutes;
      if (target === undefined || target === null || target === "") return true;
      const num = Number(target);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("Thời gian chuẩn bị phải là số nguyên không âm");
      }
      return true;
    }),

  body("cook_time_minutes")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      const target = value ?? req.body.cookTimeMinutes;
      if (target === undefined || target === null || target === "") return true;
      const num = Number(target);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("Thời gian chế biến phải là số nguyên không âm");
      }
      return true;
    }),

  body("servings")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("Khẩu phần phải là số nguyên không âm");
      }
      return true;
    }),

  body("calories")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("Calories phải là số nguyên không âm");
      }
      return true;
    }),

  body("difficulty")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      const allowed = ["dễ", "trung bình", "khó"];
      if (!allowed.includes(value.toLowerCase())) {
        throw new Error("Độ khó phải là 'dễ', 'trung bình' hoặc 'khó'");
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateRecipe,
};
