const aiService = require('../services/ai.service');
const adminRepository = require('../repositories/admin.repository');
const recipeRepository = require('../repositories/recipe.repository');
const { enrichSuggestions } = require('../services/fridgeMatching.service');

class AIController {
    async suggestRecipesFromFridge(req, res, next) {
        try {
            const { ingredients, peopleCount, complexity, cookingSpeed, dishCount } = req.body;

            if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp ít nhất một thực phẩm trong tủ lạnh.'
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

            const suggestions = await aiService.getFridgeSuggestions({
                ingredients,
                peopleCount: parsedPeopleCount,
                complexity: parsedComplexity,
                cookingSpeed: parsedCookingSpeed,
                dishCount: parsedDishCount
            });

            const candidates = await recipeRepository.findPublishedForMatching();
            const matchedSuggestions = enrichSuggestions(suggestions, candidates, {
                ingredients, peopleCount: parsedPeopleCount, cookingSpeed: parsedCookingSpeed
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
