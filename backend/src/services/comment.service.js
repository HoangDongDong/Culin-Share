const commentRepository = require('../repositories/comment.repository');

class CommentService {
    async getCommentsByRecipeId(recipeId) {
        const rawComments = await commentRepository.findByRecipeId(recipeId);
        
        // Build hierarchy structure
        const comments = [];
        const commentMap = {};
        rawComments.forEach(c => {
            c.replies = [];
            commentMap[c.id] = c;
        });
        rawComments.forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies.push(c);
            } else {
                comments.push(c);
            }
        });

        return comments;
    }

    async addComment(userId, recipeId, content, parentId = null) {
        if (!content || !content.trim()) {
            const error = new Error('Nội dung bình luận không được để trống');
            error.statusCode = 400;
            throw error;
        }

        const commentId = await commentRepository.create({
            recipe_id: recipeId,
            user_id: userId,
            parent_id: parentId,
            content: content.trim()
        });

        return await commentRepository.findById(commentId);
    }

    async deleteComment(userId, userRole, commentId) {
        const comment = await commentRepository.findById(commentId);
        if (!comment) {
            const error = new Error('Không tìm thấy bình luận');
            error.statusCode = 404;
            throw error;
        }

        if (comment.user_id !== userId && userRole !== 'admin') {
            const error = new Error('Bạn không có quyền xóa bình luận này');
            error.statusCode = 403;
            throw error;
        }

        await commentRepository.deleteByParentId(commentId);
        if (userRole === 'admin') {
            await commentRepository.deleteById(commentId);
        } else {
            await commentRepository.delete(commentId, userId);
        }
    }
}

module.exports = new CommentService();
