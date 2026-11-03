const pool = require('../config/database');

class CommunityRepository {
    async hydrate(rows) {
        if (!rows.length) return [];
        const ids = rows.map(row => row.id), placeholders = ids.map(() => '?').join(',');
        const [media] = await pool.query(`SELECT id, post_id, media_url, media_type FROM community_post_media WHERE post_id IN (${placeholders}) ORDER BY sort_order, id`, ids);
        const [recipes] = await pool.query(`SELECT pr.post_id, r.id, r.title, r.cover_image_url,
            r.prep_time_minutes + r.cook_time_minutes AS total_minutes FROM community_post_recipes pr
            JOIN recipes r ON r.id = pr.recipe_id AND r.status = 'published'
            WHERE pr.post_id IN (${placeholders}) ORDER BY pr.sort_order`, ids);
        return rows.map(row => ({ ...row, liked: Boolean(row.liked), media: media.filter(item => item.post_id === row.id), recipes: recipes.filter(item => item.post_id === row.id) }));
    }

    select() {
        return `SELECT p.*, t.name AS topic_name, u.full_name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar,
            (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id AND c.status = 'published' AND c.deleted_at IS NULL) AS comment_count,
            EXISTS(SELECT 1 FROM community_saved_posts s WHERE s.post_id = p.id AND s.user_id = ?) AS saved,
            EXISTS(SELECT 1 FROM community_post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
            FROM community_posts p JOIN users u ON u.id = p.author_id LEFT JOIN community_topics t ON t.slug=p.topic_slug`;
    }

    async feed({ viewerId, tab, q, page, limit, topic, kind, challengeId, excludeSeedDemo = false }) {
        const params = [viewerId || 0, viewerId || 0], where = ['p.deleted_at IS NULL'];
        if (tab === 'mine') { where.push('p.author_id = ?'); params.push(viewerId); }
        else where.push("p.status = 'published'");
        if (excludeSeedDemo) where.push("NOT (LEFT(u.username,15) = 'community_demo_' AND u.email LIKE 'community.%@example.invalid')");
        if (tab === 'following') { where.push('EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = p.author_id)'); params.push(viewerId); }
        if (tab === 'saved') { where.push('EXISTS(SELECT 1 FROM community_saved_posts s WHERE s.user_id = ? AND s.post_id = p.id)'); params.push(viewerId); }
        if (topic) { where.push('p.topic_slug = ?'); params.push(topic); }
        if (kind) { where.push('p.post_kind = ?'); params.push(kind); }
        if (challengeId) { where.push('p.challenge_id = ?'); params.push(challengeId); }
        if (q) { where.push('(p.content LIKE ? OR u.full_name LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
        const order = tab === 'popular' ? 'like_count DESC, p.id DESC' : 'p.id DESC';
        const [rows] = await pool.query(`${this.select()} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit + 1, (page - 1) * limit]);
        return { posts: await this.hydrate(rows.slice(0, limit)), hasMore: rows.length > limit, page };
    }

    async find(id, viewerId) {
        const [rows] = await pool.query(`${this.select()} WHERE p.id = ? AND p.deleted_at IS NULL`, [viewerId || 0, viewerId || 0, id]);
        return (await this.hydrate(rows))[0] || null;
    }

    async stats() {
        const [[counts]] = await pool.query(`SELECT COUNT(*) AS posts, COUNT(DISTINCT author_id) AS members FROM community_posts WHERE status = 'published' AND deleted_at IS NULL`);
        const [contributors] = await pool.query(`SELECT u.id, u.full_name, u.username, u.avatar_url, COUNT(*) AS post_count
            FROM community_posts p JOIN users u ON u.id = p.author_id WHERE p.status = 'published' AND p.deleted_at IS NULL
            GROUP BY u.id ORDER BY post_count DESC, u.id LIMIT 4`);
        return { ...counts, contributors };
    }

    async create(userId, content, recipeIds, files, details = {}) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            if (recipeIds.length) {
                const [recipes] = await connection.query(`SELECT id FROM recipes WHERE status = 'published' AND id IN (${recipeIds.map(() => '?').join(',')}) FOR SHARE`, recipeIds);
                if (recipes.length !== recipeIds.length) throw Object.assign(new Error('Một công thức đã bị xóa hoặc chưa xuất bản.'), { statusCode: 400 });
            }
            if (details.topic_slug) {
                const [rows] = await connection.query('SELECT slug FROM community_topics WHERE slug = ? FOR SHARE', [details.topic_slug]);
                if (!rows.length) throw Object.assign(new Error('Nhóm cộng đồng không tồn tại.'), { statusCode: 400 });
            }
            if (details.challenge_id) {
                const [rows] = await connection.query("SELECT id FROM community_challenges WHERE id=? AND status='published' AND starts_at<=UTC_TIMESTAMP() AND ends_at>UTC_TIMESTAMP() FOR SHARE", [details.challenge_id]);
                if (!rows.length) throw Object.assign(new Error('Thử thách không còn mở.'), { statusCode: 400 });
                await connection.query('INSERT IGNORE INTO community_challenge_participants(challenge_id,user_id) VALUES(?,?)', [details.challenge_id,userId]);
            }
            const [post] = await connection.query(`INSERT INTO community_posts (author_id, content, title, topic_slug, post_kind, challenge_id)
                VALUES (?, ?, ?, ?, ?, ?)`, [userId, content, details.title || null, details.topic_slug || null, details.post_kind || 'story', details.challenge_id || null]);
            for (const [index, file] of files.entries()) await connection.query(`INSERT INTO community_post_media
                (post_id, media_url, public_id, media_type, sort_order) VALUES (?, ?, ?, 'image', ?)`, [post.insertId, file.path, file.filename || null, index]);
            for (const [index, recipeId] of recipeIds.entries()) await connection.query('INSERT INTO community_post_recipes (post_id, recipe_id, sort_order) VALUES (?, ?, ?)', [post.insertId, recipeId, index]);
            await connection.commit();
            return post.insertId;
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    }

    async update(id, content) { await pool.query('UPDATE community_posts SET content = ? WHERE id = ? AND deleted_at IS NULL', [content, id]); }
    async remove(id) { await pool.query('UPDATE community_posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]); }
    async like(id, userId, liked) {
        const [result] = liked
            ? await pool.query('INSERT IGNORE INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [id, userId])
            : await pool.query('DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
    async comments(postId, after, limit) {
        const [rows] = await pool.query(`SELECT c.*, u.full_name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar
            FROM community_comments c JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ? AND c.id > ? AND c.status = 'published' AND c.deleted_at IS NULL ORDER BY c.id LIMIT ?`, [postId, after, limit + 1]);
        return { comments: rows.slice(0, limit), hasMore: rows.length > limit, nextCursor: rows.slice(0, limit).at(-1)?.id || after };
    }
    async comment(id) { const [rows] = await pool.query('SELECT * FROM community_comments WHERE id = ? AND deleted_at IS NULL', [id]); return rows[0]; }
    async addComment(postId, userId, parentId, content) {
        const [result] = await pool.query('INSERT INTO community_comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)', [postId, userId, parentId, content]);
        return result.insertId;
    }
    async removeComment(id) { await pool.query('UPDATE community_comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]); }
    async save(postId, userId, saved) {
        if (saved) await pool.query('INSERT IGNORE INTO community_saved_posts(post_id,user_id) VALUES(?,?)', [postId,userId]);
        else await pool.query('DELETE FROM community_saved_posts WHERE post_id=? AND user_id=?', [postId,userId]);
    }
    async metadata(viewerId = 0) {
        const [topics] = await pool.query(`SELECT t.*, (SELECT COUNT(*) FROM community_posts p WHERE p.topic_slug=t.slug AND p.status='published' AND p.deleted_at IS NULL) AS post_count FROM community_topics t ORDER BY t.sort_order,t.slug`);
        const [people] = await pool.query(`SELECT u.id,u.full_name,u.username,u.avatar_url,
            (SELECT COUNT(*) FROM community_posts p WHERE p.author_id=u.id AND p.status='published' AND p.deleted_at IS NULL) AS post_count,
            EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=? AND f.following_id=u.id) AS followed
            FROM users u WHERE u.is_verified=1 AND u.id<>? ORDER BY post_count DESC,u.id LIMIT 8`, [viewerId,viewerId]);
        const [following] = viewerId ? await pool.query(`SELECT u.id,u.full_name,u.username,u.avatar_url,1 AS followed FROM follows f JOIN users u ON u.id=f.following_id WHERE f.follower_id=? ORDER BY f.id DESC LIMIT 12`, [viewerId]) : [[]];
        const [challenges] = await pool.query(`SELECT c.*, DATE_FORMAT(c.starts_at,'%Y-%m-%dT%H:%i:%sZ') AS starts_at, DATE_FORMAT(c.ends_at,'%Y-%m-%dT%H:%i:%sZ') AS ends_at,
            (SELECT COUNT(*) FROM community_challenge_participants p WHERE p.challenge_id=c.id) AS participant_count,
            EXISTS(SELECT 1 FROM community_challenge_participants p WHERE p.challenge_id=c.id AND p.user_id=?) AS joined
            FROM community_challenges c WHERE c.status='published' AND c.starts_at<=UTC_TIMESTAMP() AND c.ends_at>UTC_TIMESTAMP() ORDER BY c.ends_at,c.id LIMIT 8`, [viewerId]);
        const [events] = await pool.query(`SELECT e.*, DATE_FORMAT(e.starts_at,'%Y-%m-%dT%H:%i:%sZ') AS starts_at, DATE_FORMAT(e.ends_at,'%Y-%m-%dT%H:%i:%sZ') AS ends_at,
            (SELECT COUNT(*) FROM community_event_registrations r WHERE r.event_id=e.id) AS registration_count,
            EXISTS(SELECT 1 FROM community_event_registrations r WHERE r.event_id=e.id AND r.user_id=?) AS registered
            FROM community_events e WHERE e.status='published' AND e.ends_at>UTC_TIMESTAMP() ORDER BY e.starts_at,e.id LIMIT 8`, [viewerId]);
        return { topics, people, following, challenges, events };
    }
    async participate(type, targetId, userId, join) {
        const challenge = type === 'challenge';
        const table = challenge ? 'community_challenges' : 'community_events';
        const mapping = challenge ? 'community_challenge_participants' : 'community_event_registrations';
        const column = challenge ? 'challenge_id' : 'event_id';
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.query(`SELECT id FROM ${table} WHERE id=? AND status='published' AND ends_at>UTC_TIMESTAMP() ${challenge ? 'AND starts_at<=UTC_TIMESTAMP()' : ''} FOR SHARE`, [targetId]);
            if (!rows.length) throw Object.assign(new Error('Nội dung không còn mở đăng ký.'), { statusCode: 400 });
            if (join) await connection.query(`INSERT IGNORE INTO ${mapping}(${column},user_id) VALUES(?,?)`, [targetId,userId]);
            else await connection.query(`DELETE FROM ${mapping} WHERE ${column}=? AND user_id=?`, [targetId,userId]);
            await connection.commit();
            return { joined: join };
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
    }
    async createActivity(type, userId, data) {
        if (type === 'challenge') {
            const [row] = await pool.query("INSERT INTO community_challenges(title,description,starts_at,ends_at,status,created_by) VALUES(?,?,?,?,'published',?)", [data.title,data.description,data.starts_at,data.ends_at,userId]);
            return { id: row.insertId };
        }
        const [row] = await pool.query("INSERT INTO community_events(title,description,starts_at,ends_at,location,event_url,status,created_by) VALUES(?,?,?,?,?,?,'published',?)", [data.title,data.description,data.starts_at,data.ends_at,data.location,data.event_url,userId]);
        return { id: row.insertId };
    }
    async report(userId, targetId, reason, description, comment = false) {
        await pool.query(`INSERT INTO community_reports (reporter_id, ${comment ? 'comment_id' : 'post_id'}, reason, description) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [userId, targetId, reason, description]);
    }
}
module.exports = new CommunityRepository();
