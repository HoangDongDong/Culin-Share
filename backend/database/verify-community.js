require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const assert = require('node:assert/strict');
const pool = require('../src/config/database');

async function verify() {
    const connection = await pool.getConnection();
    try {
        const tables = ['community_posts', 'community_post_media', 'community_post_recipes', 'community_post_likes', 'community_comments', 'community_reports'];
        const counts = {};
        for (const table of tables) {
            const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM ${table}`);
            counts[table] = row.total;
        }
        const [columns] = await connection.query(`SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME IN ('post_id','community_comment_id')`);
        assert.equal(columns.length, 2, 'Thiếu liên kết notifications');
        const [[badParents]] = await connection.query(`SELECT COUNT(*) AS total FROM community_comments c
            JOIN community_comments p ON c.parent_id = p.id WHERE c.post_id <> p.post_id`);
        assert.equal(badParents.total, 0, 'Có trả lời bình luận thuộc bài khác');
        const [migrations] = await connection.query('SELECT version, state FROM schema_migrations ORDER BY version');
        const [seeds] = await connection.query('SELECT version FROM schema_seeds ORDER BY version');
        const [[demo]] = await connection.query("SELECT COUNT(*) AS total FROM users WHERE email IN ('community.linh@example.invalid','community.nam@example.invalid','community.mai@example.invalid')");
        const [[notifications]] = await connection.query("SELECT COUNT(*) AS total FROM notifications WHERE type LIKE 'community_%'");

        if (process.argv.includes('--check-constraints')) {
            const [[author]] = await connection.query("SELECT id FROM users WHERE email = 'community.linh@example.invalid'");
            assert.ok(author, 'Cần chạy db:seed trước khi thử ràng buộc');
            const [[parent]] = await connection.query('SELECT id, post_id FROM community_comments WHERE parent_id IS NULL ORDER BY id LIMIT 1');
            await connection.beginTransaction();
            try {
                const [post] = await connection.query("INSERT INTO community_posts (author_id, content, status) VALUES (?, 'Constraint check: rolled back', 'draft')", [author.id]);
                await assert.rejects(connection.query('INSERT INTO community_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
                    [post.insertId, author.id, parent.id, 'Invalid cross-post reply']), error => error.code === 'ER_NO_REFERENCED_ROW_2');
                await connection.query('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [post.insertId, author.id]);
                await assert.rejects(connection.query('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [post.insertId, author.id]), error => error.code === 'ER_DUP_ENTRY');
                await assert.rejects(connection.query("INSERT INTO community_reports (reporter_id, reason) VALUES (?, 'other')", [author.id]),
                    error => ['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_CONSTRAINT_FAILED'].includes(error.code));
            } finally { await connection.rollback(); }
        }
        console.log(JSON.stringify({ counts, demoAccounts: demo.total, communityNotifications: notifications.total, migrations, seeds, constraints: process.argv.includes('--check-constraints') ? 'passed; all test inserts rolled back' : 'not requested' }, null, 2));
    } finally { connection.release(); }
}

verify().catch(error => { console.error('Kiểm tra thất bại:', error.message || error.code); process.exitCode = 1; }).finally(() => pool.end());
