const reviewRepository = require('../repositories/review.repository');

class ReviewService {
    async addReview(userId, recipeId, rating, comment) {
        const ratingVal = parseInt(rating);
        if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
            const error = new Error('Đánh giá phải từ 1 đến 5 sao');
            error.statusCode = 400;
            throw error;
        }

        // Kiểm tra user đã review công thức này chưa
        const existing = await reviewRepository.findByUserAndRecipe(userId, recipeId);
        if (existing) {
            const error = new Error('Bạn đã đánh giá công thức này rồi. Hãy chỉnh sửa đánh giá cũ thay vì tạo mới.');
            error.statusCode = 409;
            throw error;
        }

        const reviewId = await reviewRepository.create({
            recipe_id: recipeId,
            user_id: userId,
            rating: ratingVal,
            comment
        });

        return await reviewRepository.findById(reviewId);
    }

    async updateReview(userId, reviewId, rating, comment) {
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

        const ratingVal = parseInt(rating);
        if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
            const error = new Error('Đánh giá phải từ 1 đến 5 sao');
            error.statusCode = 400;
            throw error;
        }

        await reviewRepository.update(reviewId, userId, ratingVal, comment);
        return await reviewRepository.findById(reviewId);
    }

    async deleteReview(userId, reviewId) {
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            const error = new Error('Không tìm thấy đánh giá');
            error.statusCode = 404;
            throw error;
        }

        if (review.user_id !== userId) {
            const error = new Error('Bạn không có quyền xóa đánh giá này');
            error.statusCode = 403;
            throw error;
        }

        await reviewRepository.delete(reviewId, userId);
    }
}

module.exports = new ReviewService();
