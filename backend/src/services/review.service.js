const reviewRepository = require('../repositories/review.repository');
const savedRecipeRepository = require('../repositories/savedRecipe.repository');
const { publishedRecipe } = require('./resourceSecurity');

class ReviewService {
    async getReviewsByRecipe(recipeId) {
        await publishedRecipe(recipeId);
        return await reviewRepository.findByRecipeId(recipeId);
    }

    async addReview(userId, recipeId, rating, comment, imageUrl = null, tip = null) {
        await publishedRecipe(recipeId);
        const ratingVal = Number(rating);
        if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5 || 
            (comment !== undefined && comment !== null && (typeof comment !== 'string' || comment.length > 5000)) ||
            (tip !== undefined && tip !== null && (typeof tip !== 'string' || tip.length > 255))) {
            const error = new Error('Đánh giá phải từ 1 đến 5 sao');
            error.statusCode = 400;
            throw error;
        }

        const reviewId = await reviewRepository.create({
            recipe_id: recipeId,
            user_id: userId,
            rating: ratingVal,
            comment,
            image_url: imageUrl,
            tip
        });

        // Tự động liên kết: Khi thành viên chia sẻ ảnh thành phẩm hoặc đánh giá,
        // tự động đánh dấu món ăn này vào bộ sưu tập "Món đã nấu" (cooked) của họ
        try {
            await savedRecipeRepository.create(userId, recipeId, 'cooked');
        } catch (e) {
            // Không ảnh hưởng đến luồng chính nếu lỗi
        }

        return await reviewRepository.findById(reviewId);
    }

    async updateReview(userId, reviewId, rating, comment, imageUrl = null, tip = null) {
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            const error = new Error('Không tìm thấy đánh giá');
            error.statusCode = 404;
            throw error;
        }

        if (review.user_id !== userId) {
            const error = new Error('Bạn không có quyền sửa đánh giá này');
            error.statusCode = 403;
            throw error;
        }

        const ratingVal = Number(rating);
        if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5 || 
            (comment !== undefined && comment !== null && (typeof comment !== 'string' || comment.length > 5000)) ||
            (tip !== undefined && tip !== null && (typeof tip !== 'string' || tip.length > 255))) {
            const error = new Error('Đánh giá phải từ 1 đến 5 sao');
            error.statusCode = 400;
            throw error;
        }

        await reviewRepository.update(reviewId, userId, ratingVal, comment, imageUrl, tip);
        return await reviewRepository.findById(reviewId);
    }

    async deleteReview(userId, reviewId, isAdmin = false) {
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            const error = new Error('Không tìm thấy đánh giá');
            error.statusCode = 404;
            throw error;
        }

        if (review.user_id !== userId && !isAdmin) {
            const error = new Error('Bạn không có quyền xóa đánh giá này');
            error.statusCode = 403;
            throw error;
        }

        await reviewRepository.delete(reviewId, review.user_id);
    }
}

module.exports = new ReviewService();
