const repository = require('../repositories/community.repository');
const notifications = require('./notification.service');
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
const id = value => { const parsed = Number(value); if (!Number.isSafeInteger(parsed) || parsed < 1) fail('Mã đối tượng không hợp lệ.'); return parsed; };
const text = (value, limit) => { if (typeof value !== 'string' || !value.trim() || value.trim().length > limit) fail(`Nội dung phải có từ 1 đến ${limit} ký tự.`); return value.trim(); };

class CommunityService {
    async post(value, viewer) {
        const post = await repository.find(id(value), viewer?.id);
        if (!post || (post.status !== 'published' && post.author_id !== viewer?.id && viewer?.role !== 'admin')) fail('Bài viết không tồn tại hoặc đã bị ẩn.', 404);
        return post;
    }
    async feed(query, viewer) {
        const tab = ['latest', 'popular', 'following', 'mine', 'saved'].includes(query.tab) ? query.tab : 'latest';
        if (['following', 'mine', 'saved'].includes(tab) && !viewer) fail('Vui lòng đăng nhập để xem mục này.', 401);
        const page = Math.min(10000, Math.max(1, Number.parseInt(query.page) || 1));
        const limit = Math.min(20, Math.max(1, Number.parseInt(query.limit) || 10));
        return repository.feed({ viewerId: viewer?.id, tab, q: String(query.q || '').trim().slice(0, 200), page, limit,
            topic: String(query.topic || '').slice(0,32), kind: ['tip','story','challenge'].includes(query.kind) ? query.kind : null,
            challengeId: query.challengeId ? id(query.challengeId) : null });
    }
    async create(viewer, body, files) {
        const content = text(body.content, 8000);
        let recipeIds;
        try { recipeIds = typeof body.recipeIds === 'string' ? JSON.parse(body.recipeIds) : (body.recipeIds || []); }
        catch { fail('Danh sách công thức không hợp lệ.'); }
        if (!Array.isArray(recipeIds) || recipeIds.length > 3) fail('Chỉ được đính kèm tối đa 3 công thức.');
        recipeIds = [...new Set(recipeIds.map(id))];
        const title = body.title ? text(body.title, 150) : null;
        const kind = body.topic === 'tips' && (!body.kind || body.kind === 'story') ? 'tip' : body.kind || 'story';
        if (!['story','tip','challenge'].includes(kind)) fail('Loại bài viết không hợp lệ.');
        const challengeId = body.challengeId ? id(body.challengeId) : null;
        if (kind === 'challenge' && !challengeId) fail('Vui lòng chọn thử thách đang mở.');
        const postId = await repository.create(viewer.id, content, recipeIds, files, {
            title, topic_slug: body.topic ? String(body.topic).slice(0,32) : null, post_kind: challengeId ? 'challenge' : kind, challenge_id: challengeId,
        });
        // The composer refreshes the feed. Avoid a second read failure after commit
        // making a successful post look failed and deleting its uploaded images.
        return { id: postId };
    }
    async update(value, viewer, content) {
        const post = await this.post(value, viewer);
        if (post.author_id !== viewer.id) fail('Bạn chỉ được sửa bài của mình.', 403);
        await repository.update(post.id, text(content, 8000));
        return this.post(post.id, viewer);
    }
    async remove(value, viewer) {
        const post = await this.post(value, viewer);
        if (post.author_id !== viewer.id && viewer.role !== 'admin') fail('Bạn không có quyền xóa bài này.', 403);
        await repository.remove(post.id);
    }
    async like(value, viewer, liked) {
        const post = await this.post(value, viewer);
        if (post.status !== 'published') fail('Chỉ tương tác với bài đã xuất bản.');
        const changed = await repository.like(post.id, viewer.id, liked);
        if (liked && changed) await notifications.createAndNotify({ userId: post.author_id, senderId: viewer.id, type: 'community_like', postId: post.id, message: 'đã thích bài viết của bạn' });
        const updated = await this.post(post.id, viewer);
        return { liked: updated.liked, like_count: updated.like_count };
    }
    async save(value, viewer, saved) {
        const post = await this.post(value, viewer);
        if (post.status !== 'published') fail('Chỉ lưu được bài đã xuất bản.');
        await repository.save(post.id, viewer.id, saved);
        return { saved };
    }
    async participate(type, value, viewer, join) { return repository.participate(type,id(value),viewer.id,join); }
    async createActivity(type, viewer, body) {
        if (viewer.role !== 'admin') fail('Chỉ quản trị viên được công bố hoạt động.',403);
        const start = new Date(body.startsAt), end = new Date(body.endsAt);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() <= Date.now()) fail('Thời gian bắt đầu/kết thúc không hợp lệ.');
        let eventUrl = null;
        if (body.eventUrl) {
            try { const parsed = new URL(body.eventUrl); if (!['http:','https:'].includes(parsed.protocol)) fail('Đường dẫn phải là HTTP hoặc HTTPS.'); eventUrl = parsed.href; }
            catch { fail('Đường dẫn sự kiện không hợp lệ.'); }
            if (eventUrl.length > 2048) fail('Đường dẫn quá dài.');
        }
        return repository.createActivity(type,viewer.id,{title:text(body.title,150),description:text(body.description,5000),
            starts_at:start.toISOString().slice(0,19).replace('T',' '),ends_at:end.toISOString().slice(0,19).replace('T',' '),
            location:type==='event'?text(body.location,255):null,event_url:eventUrl});
    }
    async comments(value, viewer, cursor) {
        const post = await this.post(value, viewer);
        return repository.comments(post.id, Math.max(0, Number.parseInt(cursor) || 0), 20);
    }
    async addComment(value, viewer, body) {
        const post = await this.post(value, viewer);
        if (post.status !== 'published') fail('Không thể bình luận bài đang ẩn.');
        const content = text(body.content, 2000), parentId = body.parentId ? id(body.parentId) : null;
        let parent;
        if (parentId) {
            parent = await repository.comment(parentId);
            if (!parent || parent.post_id !== post.id || parent.status !== 'published') fail('Bình luận được trả lời không còn tồn tại.');
        }
        const commentId = await repository.addComment(post.id, viewer.id, parentId, content);
        await notifications.createAndNotify({ userId: parent?.user_id || post.author_id, senderId: viewer.id,
            type: parent ? 'community_reply' : 'community_comment', postId: post.id, communityCommentId: commentId,
            message: parent ? 'đã trả lời bình luận của bạn' : 'đã bình luận vào bài viết của bạn' });
        return { id: commentId };
    }
    async removeComment(value, viewer) {
        const comment = await repository.comment(id(value));
        if (!comment) fail('Bình luận không còn tồn tại.', 404);
        if (comment.user_id !== viewer.id && viewer.role !== 'admin') fail('Bạn không có quyền xóa bình luận này.', 403);
        await this.post(comment.post_id, viewer);
        await repository.removeComment(comment.id);
    }
    async report(value, viewer, body) {
        const post = await this.post(value, viewer);
        if (post.author_id === viewer.id) fail('Bạn có thể chỉnh sửa hoặc xóa bài của mình.');
        if (!['spam', 'inappropriate', 'misinformation', 'harassment', 'other'].includes(body.reason)) fail('Vui lòng chọn lý do báo cáo.');
        const description = body.description ? text(body.description, 1500) : null;
        await repository.report(viewer.id, post.id, body.reason, description);
    }
    async reportComment(value, viewer, body) {
        const comment = await repository.comment(id(value));
        if (!comment || comment.status !== 'published') fail('Bình luận không còn tồn tại.', 404);
        await this.post(comment.post_id, viewer);
        if (comment.user_id === viewer.id) fail('Bạn có thể xóa bình luận của mình.');
        if (!['spam', 'inappropriate', 'misinformation', 'harassment', 'other'].includes(body.reason)) fail('Vui lòng chọn lý do báo cáo.');
        await repository.report(viewer.id, comment.id, body.reason, body.description ? text(body.description, 1500) : null, true);
    }
}
module.exports = new CommunityService();
