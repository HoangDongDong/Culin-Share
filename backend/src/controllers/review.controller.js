const reviewService = require('../services/review.service');
const notificationService = require('../services/notification.service');
const recipeRepository = require('../repositories/recipe.repository');

class ReviewController {
    async addReview(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const { rating, comment } = req.body;

            const review = await reviewService.addReview(userId, recipeId, rating, comment);

            // Gửi thông báo realtime tới chủ recipe
            try {
                const recipe = await recipeRepository.findById(recipeId);
                if (recipe && recipe.author_id !== userId) {
                    await notificationService.createAndNotify({
                        userId: recipe.author_id,
                        senderId: userId,
                        type: 'review',
                        recipeId: parseInt(recipeId),
                        message: `đã đánh giá ${rating} sao cho công thức "${recipe.title}" của bạn`,
                    });
                }
            } catch (notifError) {
                console.error('Lỗi gửi notification review:', notifError.message);
            }

            return res.status(201).json({
                success: true,
                message: 'Đăng đánh giá thành công',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    async updateReview(req, res, next) {
        try {
            const { id: reviewId } = req.params;
            const userId = req.user.id;
            const { rating, comment } = req.body;

            const review = await reviewService.updateReview(userId, reviewId, rating, comment);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật đánh giá thành công',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteReview(req, res, next) {
        try {
            const { id: reviewId } = req.params;
            const userId = req.user.id;

            await reviewService.deleteReview(userId, reviewId);
            return res.status(200).json({
                success: true,
                message: 'Xóa đánh giá thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewController();
