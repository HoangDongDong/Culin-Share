const aiService = require('../services/ai.service');
const adminRepository = require('../repositories/admin.repository');
const fridgeRag = require('../services/fridgeRag.service');
const fridgeHistory = require('../repositories/fridgeHistory.repository');

function historyId(value) {
    if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
        throw Object.assign(new Error('Mã lịch sử không hợp lệ.'), { statusCode: 400 });
    }
    return Number(value);
}

class AIController {
    async suggestRecipesFromFridge(req, res, next) {
        try {
            const { ingredients: rawIngredients, peopleCount, complexity, cookingSpeed, dishCount, dishDistribution } = req.body;
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
            if (typeof parsedComplexity !== 'string' || parsedComplexity.length > 500 ||
                typeof parsedCookingSpeed !== 'string' || parsedCookingSpeed.length > 100) {
                return res.status(400).json({ success: false, message: 'Tùy chọn bữa ăn không hợp lệ.' });
            }
            if (dishDistribution !== undefined && (!dishDistribution ||
                !['easy', 'medium', 'hard'].every(key => Number.isInteger(dishDistribution[key]) && dishDistribution[key] >= 0) ||
                dishDistribution.easy + dishDistribution.medium + dishDistribution.hard !== parsedDishCount)) {
                return res.status(400).json({ success: false, message: 'Phân bổ độ khó phải khớp với số món đã chọn.' });
            }

            const matchedSuggestions = await fridgeRag.suggest({
                ingredients,
                peopleCount: parsedPeopleCount,
                complexity: parsedComplexity,
                cookingSpeed: parsedCookingSpeed,
                dishCount: parsedDishCount
            });

            const savedHistoryId = await fridgeHistory.create(req.user.id, {
                ingredients,
                peopleCount: parsedPeopleCount,
                complexity: parsedComplexity,
                cookingSpeed: parsedCookingSpeed,
                dishCount: parsedDishCount,
                dishDistribution: dishDistribution ? {
                    easy: dishDistribution.easy, medium: dishDistribution.medium, hard: dishDistribution.hard
                } : null
            }, matchedSuggestions);

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
                data: matchedSuggestions,
                historyId: savedHistoryId
            });

        } catch (error) {
            next(error);
        }
    }

    async getFridgeHistory(req, res, next) {
        try {
            const before = req.query.before === undefined ? null : historyId(req.query.before);
            const data = await fridgeHistory.list(req.user.id, before);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }

    async getFridgeHistoryEntry(req, res, next) {
        try {
            const entry = await fridgeHistory.findById(req.user.id, historyId(req.params.id));
            if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy lần gợi ý này.' });
            res.json({ success: true, data: entry });
        } catch (error) { next(error); }
    }

    async deleteFridgeHistoryEntry(req, res, next) {
        try {
            const deleted = await fridgeHistory.delete(req.user.id, historyId(req.params.id));
            if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy lần gợi ý này.' });
            res.json({ success: true, message: 'Đã xóa lần gợi ý khỏi lịch sử.' });
        } catch (error) { next(error); }
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
