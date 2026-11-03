const aiService = require('../services/ai.service');
const adminRepository = require('../repositories/admin.repository');
const fridgeRag = require('../services/fridgeRag.service');

class AIController {
    async suggestRecipesFromFridge(req, res, next) {
        try {
            const { ingredients: rawIngredients, peopleCount, complexity, cookingSpeed, dishCount } = req.body;
            const ingredients = Array.isArray(rawIngredients) ? rawIngredients.map(item => typeof item === 'string' ? { name: item, quantity: '' } : item) : null;

            if (!ingredients || ingredients.length === 0 || ingredients.length > 60 || ingredients.some(item => !item ||
                typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 ||
                String(item.quantity ?? '').length > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập từ 1 đến 60 nguyên liệu hợp lệ (tên tối đa 200 ký tự).'
                });
            }

            const parsedPeopleCount = Number(peopleCount ?? 2);
            const parsedComplexity = complexity || 'bình thường';
            const parsedCookingSpeed = cookingSpeed || 'bình thường';
            const parsedDishCount = Number(dishCount ?? 3);
            if (!Number.isInteger(Number(peopleCount ?? 2)) || parsedPeopleCount < 1 || parsedPeopleCount > 20 ||
                !Number.isInteger(Number(dishCount ?? 3)) || parsedDishCount < 1 || parsedDishCount > 7) {
                return res.status(400).json({ success: false, message: 'Số người phải từ 1 đến 20 và số món phải từ 1 đến 7.' });
            }

            const matchedSuggestions = await fridgeRag.suggest({
                ingredients,
                peopleCount: parsedPeopleCount,
                complexity: parsedComplexity,
                cookingSpeed: parsedCookingSpeed,
                dishCount: parsedDishCount
            });

            // Ghi nhận log sử dụng AI (giúp thống kê ở Admin Dashboard)
            try {
                const userId = req.user?.id || null;
                await adminRepository.logAiUsage(userId, 'fridge_suggest');
            } catch (logError) {
                console.error('⚠️ Lỗi ghi log sử dụng AI:', logError.message);
                // Bỏ qua lỗi ghi log để không làm ngắt quãng trải nghiệm của người dùng
            }

            return res.status(200).json({
                success: true,
                message: 'Lấy gợi ý món ăn thành công',
                data: matchedSuggestions
            });

        } catch (error) {
            next(error);
        }
    }

    async suggestDishDistribution(req, res, next) {
        try {
            const { peopleCount, cookingTime } = req.body;
            
            if (!cookingTime) {
                return res.status(400).json({ success: false, message: 'Thiếu thời gian nấu' });
            }

            const distribution = await aiService.suggestDishDistribution(peopleCount, cookingTime);

            return res.status(200).json({
                success: true,
                data: distribution
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AIController();
