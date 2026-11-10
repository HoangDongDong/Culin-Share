const reviewService = require('../services/review.service');
const notificationService = require('../services/notification.service');
const recipeRepository = require('../repositories/recipe.repository');

class ReviewController {
    async getReviews(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const reviews = await reviewService.getReviewsByRecipe(recipeId);
            return res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            next(error);
        }
    }

    async addReview(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const { rating, comment, tip } = req.body;
            const imageUrl = req.file?.path || req.body.image_url || null;

            const review = await reviewService.addReview(userId, recipeId, rating, comment, imageUrl, tip);

            // Gửi thông báo realtime tới chủ recipe
            try {
                const recipe = await recipeRepository.findById(recipeId);
                if (recipe && recipe.author_id !== userId) {
                    const hasCooksnap = !!imageUrl;
                    await notificationService.createAndNotify({
                        userId: recipe.author_id,
                        senderId: userId,
                        type: 'review',
                        recipeId: parseInt(recipeId),
                        message: hasCooksnap
                            ? `đã chia sẻ ảnh thành phẩm và đánh giá ${rating} sao cho công thức "${recipe.title}" của bạn`
                            : `đã đánh giá ${rating} sao cho công thức "${recipe.title}" của bạn`,
                    });
                }
            } catch (notifError) {
                console.error('Lỗi gửi notification review:', notifError.message);
            }

            return res.status(201).json({
                success: true,
                message: imageUrl ? 'Đăng ảnh thành phẩm và đánh giá thành công!' : 'Đăng đánh giá thành công!',
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
            const { rating, comment, tip } = req.body;
            const imageUrl = req.file?.path || req.body.image_url;

            const review = await reviewService.updateReview(userId, reviewId, rating, comment, imageUrl, tip);
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
            const isAdmin = req.user.role === 'admin';

            await reviewService.deleteReview(userId, reviewId, isAdmin);
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
