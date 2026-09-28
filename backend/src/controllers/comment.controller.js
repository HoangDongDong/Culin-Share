const commentService = require('../services/comment.service');
const notificationService = require('../services/notification.service');
const recipeRepository = require('../repositories/recipe.repository');
const commentRepository = require('../repositories/comment.repository');

class CommentController {
    async getComments(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const comments = await commentService.getCommentsByRecipeId(recipeId);
            return res.status(200).json({
                success: true,
                data: comments
            });
        } catch (error) {
            next(error);
        }
    }

    async addComment(req, res, next) {
        try {
            const { id: recipeId } = req.params;
            const userId = req.user.id;
            const { content, parentId } = req.body;

            const comment = await commentService.addComment(userId, recipeId, content, parentId);

            // Gửi thông báo realtime
            try {
                const recipe = await recipeRepository.findById(recipeId);
                if (recipe) {
                    if (parentId) {
                        // Trường hợp 1: Có parentId -> Đây là phản hồi bình luận
                        const parentComment = await commentRepository.findById(parentId);
                        if (parentComment && parentComment.user_id !== userId) {
                            // Gửi thông báo tới người sở hữu bình luận gốc
                            await notificationService.createAndNotify({
                                userId: parentComment.user_id,
                                senderId: userId,
                                type: 'comment',
                                recipeId: parseInt(recipeId),
                                message: `đã phản hồi bình luận của bạn trong công thức "${recipe.title}"`,
                            });
                        }

                        // Đồng thời báo cho chủ bài viết (nếu chủ bài viết không phải người rep và không phải người nhận rep)
                        if (recipe.author_id !== userId && (!parentComment || parentComment.user_id !== recipe.author_id)) {
                            await notificationService.createAndNotify({
                                userId: recipe.author_id,
                                senderId: userId,
                                type: 'comment',
                                recipeId: parseInt(recipeId),
                                message: `đã trả lời một bình luận trong công thức "${recipe.title}" của bạn`,
                            });
                        }
                    } else {
                        // Trường hợp 2: Bình luận gốc mới hoàn toàn
                        if (recipe.author_id !== userId) {
                            await notificationService.createAndNotify({
                                userId: recipe.author_id,
                                senderId: userId,
                                type: 'comment',
                                recipeId: parseInt(recipeId),
                                message: `đã bình luận về công thức "${recipe.title}" của bạn`,
                            });
                        }
                    }
                }
            } catch (notifError) {
                console.error('Lỗi gửi notification comment:', notifError.message);
            }

            return res.status(201).json({
                success: true,
                message: 'Đăng bình luận thành công',
                data: comment
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteComment(req, res, next) {
        try {
            const { id: commentId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            await commentService.deleteComment(userId, userRole, commentId);
            return res.status(200).json({
                success: true,
                message: 'Xóa bình luận thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CommentController();
