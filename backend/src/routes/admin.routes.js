/**
 * =================================================================
 * ADMIN ROUTES
 * =================================================================
 * Định nghĩa các route thống kê, quản trị dành riêng cho Admin:
 * - GET  /admin/stats       (Auth + Role: admin)
 * =================================================================
 */

const express = require('express');
const router = express.Router();

// Import Controllers
const AdminController = require('../controllers/admin.controller');

// Import Middlewares
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Route lấy thống kê (chỉ admin có token hợp lệ mới được xem)
router.get(
    '/admin/stats',
    verifyToken,
    authorize('admin'),
    AdminController.getStats
);

// ========================
// USER MANAGEMENT
// ========================
router.get(
    '/admin/users',
    verifyToken,
    authorize('admin'),
    AdminController.getUsers
);

router.delete(
    '/admin/users/:id',
    verifyToken,
    authorize('admin'),
    AdminController.deleteUser
);

router.put(
    '/admin/users/:id/role',
    verifyToken,
    authorize('admin'),
    AdminController.updateUserRole
);

// ========================
// RECIPE MANAGEMENT & APPROVAL
// ========================
router.get(
    '/admin/recipes',
    verifyToken,
    authorize('admin'),
    AdminController.getRecipes
);

router.put(
    '/admin/recipes/:id/status',
    verifyToken,
    authorize('admin'),
    AdminController.updateRecipeStatus
);

router.delete(
    '/admin/recipes/:id',
    verifyToken,
    authorize('admin'),
    AdminController.deleteRecipe
);

// ========================
// CATEGORY MANAGEMENT
// ========================
router.post(
    '/admin/categories',
    verifyToken,
    authorize('admin'),
    AdminController.createCategory
);

router.delete(
    '/admin/categories/:id',
    verifyToken,
    authorize('admin'),
    AdminController.deleteCategory
);

module.exports = router;
