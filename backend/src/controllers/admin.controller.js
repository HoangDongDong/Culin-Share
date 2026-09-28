const adminRepository = require('../repositories/admin.repository');
const pool = require('../config/database');

class AdminController {
    async getStats(req, res, next) {
        try {
            // 1. Lấy thống kê công thức theo tháng
            const recipeStats = await adminRepository.getRecipeStats();

            // 2. Lấy thống kê độ khó công thức
            const difficultyStats = await adminRepository.getDifficultyStats();

            // 3. Lấy thống kê lượt gọi gợi ý AI
            const aiLogsStats = await adminRepository.getAiLogsStats();

            // 4. Lấy sở thích/mục tiêu của người dùng và tính toán tần suất
            const rawPrefs = await adminRepository.getUserPreferences();
            const preferencesMap = {};

            rawPrefs.forEach(row => {
                let prefs = [];
                try {
                    // Cột cuisine_preferences được lưu dưới dạng JSON string
                    prefs = JSON.parse(row.cuisine_preferences);
                } catch (e) {
                    // Nếu lỗi parse, thử split bằng dấu phẩy
                    if (typeof row.cuisine_preferences === 'string') {
                        prefs = row.cuisine_preferences.split(',').map(p => p.trim());
                    }
                }

                if (Array.isArray(prefs)) {
                    prefs.forEach(p => {
                        const trimmed = p.trim();
                        if (trimmed) {
                            // Chuẩn hoá chữ viết hoa/thường
                            const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                            preferencesMap[capitalized] = (preferencesMap[capitalized] || 0) + 1;
                        }
                    });
                }
            });

            // Chuyển map tần suất thành mảng array của objects [{ name, value }]
            const preferenceStats = Object.keys(preferencesMap).map(key => ({
                name: key,
                value: preferencesMap[key]
            })).sort((a, b) => b.value - a.value); // Sắp xếp giảm dần theo số lượng

            // 5. Lấy thêm một số chỉ số bento để hiển thị trên Dashboard Admin thật
            const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
            const [[{ totalRecipes }]] = await pool.query('SELECT COUNT(*) AS totalRecipes FROM recipes');
            const [[{ totalReviews }]] = await pool.query('SELECT COUNT(*) AS totalReviews FROM reviews');

            return res.status(200).json({
                success: true,
                message: 'Lấy dữ liệu thống kê Admin thành công',
                data: {
                    recipeStats,
                    difficultyStats,
                    aiLogsStats,
                    preferenceStats,
                    summary: {
                        totalUsers,
                        totalRecipes,
                        totalReviews
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // ========================
    // USER MANAGEMENT
    // ========================
    async getUsers(req, res, next) {
        try {
            const users = await adminRepository.getAllUsers();
            return res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn không thể tự xóa tài khoản của chính mình!'
                });
            }
            await adminRepository.deleteUser(id);
            return res.status(200).json({
                success: true,
                message: 'Xóa người dùng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Vai trò không hợp lệ'
                });
            }
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn không thể tự thay đổi vai trò của chính mình!'
                });
            }
            await adminRepository.updateUserRole(id, role);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật vai trò người dùng thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // ========================
    // RECIPE MANAGEMENT & APPROVAL
    // ========================
    async getRecipes(req, res, next) {
        try {
            const { status } = req.query;
            const recipes = await adminRepository.getAllRecipes(status);
            return res.status(200).json({
                success: true,
                data: recipes
            });
        } catch (error) {
            next(error);
        }
    }

    async updateRecipeStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['draft', 'pending', 'published'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái không hợp lệ'
                });
            }
            await adminRepository.updateRecipeStatus(id, status);
            return res.status(200).json({
                success: true,
                message: `Đã cập nhật trạng thái công thức thành: ${status}`
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteRecipe(req, res, next) {
        try {
            const { id } = req.params;
            await adminRepository.deleteRecipe(id);
            return res.status(200).json({
                success: true,
                message: 'Xóa công thức thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    // ========================
    // CATEGORY MANAGEMENT
    // ========================
    async createCategory(req, res, next) {
        try {
            const { name, description, imageUrl } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên danh mục là bắt buộc'
                });
            }

            // Tạo slug tự động từ tên
            let slug = name.toLowerCase()
                .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
                .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
                .replace(/[íìỉĩị]/g, 'i')
                .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
                .replace(/[úùủũụưứừửữự]/g, 'u')
                .replace(/[ýỳỷỹỵ]/g, 'y')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            slug = `${slug}-${Date.now().toString().slice(-4)}`;

            const categoryId = await adminRepository.createCategory(name.trim(), slug, description, imageUrl);
            return res.status(201).json({
                success: true,
                message: 'Thêm danh mục mới thành công',
                data: { id: categoryId, name, slug, description, imageUrl }
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            await adminRepository.deleteCategory(id);
            return res.status(200).json({
                success: true,
                message: 'Xóa danh mục thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
