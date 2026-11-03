const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');

module.exports = {
    async up(connection) {
        const people = [
            ['community_demo_linh', 'community.linh@example.invalid', 'Linh · tài khoản mẫu'],
            ['community_demo_nam', 'community.nam@example.invalid', 'Nam · tài khoản mẫu'],
            ['community_demo_mai', 'community.mai@example.invalid', 'Mai · tài khoản mẫu'],
        ];
        const users = [];
        for (const [username, email, name] of people) {
            const [existing] = await connection.query('SELECT id, username, email FROM users WHERE username = ? OR email = ?', [username, email]);
            if (existing.length) {
                if (existing.length !== 1 || existing[0].username !== username || existing[0].email !== email) {
                    throw new Error(`Tên tài khoản demo ${username} đã được dùng. Không thay đổi tài khoản hiện có.`);
                }
                users.push(existing[0].id);
            } else {
                const password = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
                const [result] = await connection.query(`INSERT INTO users
                    (username, email, full_name, password_hash, role, is_verified, bio)
                    VALUES (?, ?, ?, ?, 'user', 1, ?)`, [username, email, name, password,
                    'Tài khoản dữ liệu mẫu cho tính năng Cộng đồng. Không phải người dùng thật.']);
                users.push(result.insertId);
            }
        }
        const [recipes] = await connection.query(`SELECT id, title, cover_image_url FROM recipes
            WHERE status = 'published' ORDER BY id ASC LIMIT 2`);
        const texts = [
            recipes[0] ? `[Bài mẫu] Cuối tuần này mình muốn thử món ${recipes[0].title}. Mọi người có mẹo chuẩn bị nguyên liệu nào không?` : '[Bài mẫu] Cuối tuần mọi người thường nấu món gì cho gia đình?',
            recipes[1] ? `[Bài mẫu] Chia sẻ công thức ${recipes[1].title} mình vừa lưu trên CulinShare. Cùng vào bếp nhé!` : '[Bài mẫu] Chia sẻ mẹo sơ chế rau và chuẩn bị bữa tối trong tuần.',
            '[Bài mẫu] Mình thường chia nguyên liệu thành từng phần trước khi cho vào tủ lạnh. Mọi người bảo quản rau thơm thế nào?',
            '[Bài mẫu kiểm duyệt] Nội dung này được ẩn để thử luồng báo cáo và quản trị cộng đồng.',
        ];
        const posts = [];
        for (let i = 0; i < texts.length; i++) {
            const [result] = await connection.query('INSERT INTO community_posts (author_id, content, status) VALUES (?, ?, ?)',
                [users[i % users.length], texts[i], i === 3 ? 'hidden' : 'published']);
            posts.push(result.insertId);
            if (i < 2 && recipes[i]) {
                await connection.query('INSERT INTO community_post_recipes (post_id, recipe_id, sort_order) VALUES (?, ?, 0)', [result.insertId, recipes[i].id]);
                // Reuse a public cover as a shared URL, without owning/deleting its Cloudinary asset.
                if (recipes[i].cover_image_url) await connection.query(`INSERT INTO community_post_media
                    (post_id, media_url, public_id, media_type, sort_order) VALUES (?, ?, NULL, 'image', 0)`, [result.insertId, recipes[i].cover_image_url]);
            }
        }
        for (const [postIndex, userIndex] of [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0]]) {
            await connection.query('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [posts[postIndex], users[userIndex]]);
        }
        const [comment] = await connection.query('INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [posts[0], users[1], '[Bình luận mẫu] Mình thường sơ chế và cân sẵn nguyên liệu trước khi nấu.']);
        const [reply] = await connection.query('INSERT INTO community_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
            [posts[0], users[0], comment.insertId, '[Trả lời mẫu] Cảm ơn bạn, mình sẽ thử cách này!']);
        const [hiddenComment] = await connection.query("INSERT INTO community_comments (post_id, user_id, content, status) VALUES (?, ?, ?, 'hidden')",
            [posts[2], users[1], '[Bình luận mẫu kiểm duyệt] Dùng để thử luồng xử lý báo cáo bình luận.']);
        await connection.query('INSERT INTO community_reports (reporter_id, post_id, reason, description) VALUES (?, ?, ?, ?)',
            [users[2], posts[3], 'other', 'Báo cáo bài viết mẫu để thử hàng đợi kiểm duyệt.']);
        await connection.query('INSERT INTO community_reports (reporter_id, comment_id, reason, description) VALUES (?, ?, ?, ?)',
            [users[0], hiddenComment.insertId, 'spam', 'Báo cáo bình luận mẫu; không liên quan đến người dùng thật.']);
        await connection.query(`INSERT INTO notifications (user_id, sender_id, type, recipe_id, post_id, community_comment_id, message)
            VALUES (?, ?, 'community_comment', NULL, ?, ?, ?), (?, ?, 'community_reply', NULL, ?, ?, ?)`,
            [users[0], users[1], posts[0], comment.insertId, 'đã bình luận vào bài viết mẫu của bạn',
                users[1], users[0], posts[0], reply.insertId, 'đã trả lời bình luận mẫu của bạn']);
    },
};
