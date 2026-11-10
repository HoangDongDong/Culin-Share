const pool = require('../config/database');

class AdminRepository {
    constructor() {
        // Tự động khởi tạo bảng ai_logs khi repo được nạp
        this.initTables().catch(err => {
            console.error('❌ Lỗi khởi tạo bảng admin stats:', err.message);
        });
    }

    async initTables() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ai_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                type VARCHAR(50) DEFAULT 'fridge_suggest',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await pool.query(sql);
    }

    async getRecipeStats() {
        const sql = `
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
            FROM recipes
            GROUP BY month
            ORDER BY month ASC
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async getDifficultyStats() {
        const sql = `
            SELECT difficulty, COUNT(*) AS count
            FROM recipes
            GROUP BY difficulty
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async getAiLogsStats() {
        const sql = `
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
            FROM ai_logs
            GROUP BY month
            ORDER BY month ASC
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async getUserPreferences() {
        const sql = `
            SELECT cuisine_preferences 
            FROM users 
            WHERE cuisine_preferences IS NOT NULL
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async logAiUsage(userId, type = 'fridge_suggest') {
        const sql = `
            INSERT INTO ai_logs (user_id, type)
            VALUES (?, ?)
        `;
        await pool.query(sql, [userId, type]);
    }

    // ========================
    // USER MANAGEMENT
    // ========================
    async getAllUsers() {
        const sql = `
            SELECT id, username, email, full_name, role, avatar_url, is_verified, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.query(sql);
        return rows;
    }

    async deleteUser(id) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
    }

    async updateUserRole(id, role) {
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    }

    // ========================
    // RECIPE MANAGEMENT & APPROVAL
    // ========================
    async getAllRecipes(status) {
        let sql = `
            SELECT r.*, u.full_name AS author_name, u.username AS author_username,
                   (SELECT COUNT(*) FROM saved_recipes sr WHERE sr.recipe_id = r.id) AS save_count
            FROM recipes r
            LEFT JOIN users u ON r.author_id = u.id
        `;
        const params = [];
        if (status) {
            sql += ' WHERE r.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY r.created_at DESC';
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async updateRecipeStatus(id, status) {
        await pool.query('UPDATE recipes SET status = ? WHERE id = ?', [status, id]);
    }

    async deleteRecipe(id) {
        await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
    }

    // ========================
    // CATEGORY MANAGEMENT
    // ========================
    async createCategory(name, slug, description, imageUrl) {
        const [result] = await pool.query(
            'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
            [name, slug, description || '', imageUrl || '']
        );
        return result.insertId;
    }

    async deleteCategory(id) {
        await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    }

    // ========================
    // COMMUNITY REPORT MANAGEMENT
    // ========================
    async getCommunityReports(status) {
        let sql = `
            SELECT 
                r.id,
                r.reason,
                r.description,
                r.status,
                r.created_at,
                r.reviewed_at,
                r.reporter_id,
                u.full_name AS reporter_name,
                u.username AS reporter_username,
                u.avatar_url AS reporter_avatar,
                r.reviewed_by,
                rev.full_name AS reviewer_name,
                r.post_id,
                p.title AS post_title,
                p.content AS post_content,
                p.status AS post_status,
                p.deleted_at AS post_deleted_at,
                pu.id AS post_author_id,
                pu.full_name AS post_author_name,
                pu.username AS post_author_username,
                pu.avatar_url AS post_author_avatar,
                r.comment_id,
                c.content AS comment_content,
                c.status AS comment_status,
                c.deleted_at AS comment_deleted_at,
                c.post_id AS comment_post_id,
                cp.title AS comment_post_title,
                cu.id AS comment_author_id,
                cu.full_name AS comment_author_name,
                cu.username AS comment_author_username,
                cu.avatar_url AS comment_author_avatar
            FROM community_reports r
            JOIN users u ON r.reporter_id = u.id
            LEFT JOIN users rev ON r.reviewed_by = rev.id
            LEFT JOIN community_posts p ON r.post_id = p.id
            LEFT JOIN users pu ON p.author_id = pu.id
            LEFT JOIN community_comments c ON r.comment_id = c.id
            LEFT JOIN users cu ON c.user_id = cu.id
            LEFT JOIN community_posts cp ON c.post_id = cp.id
        `;
        const params = [];
        if (status && status !== 'all') {
            sql += ' WHERE r.status = ?';
            params.push(status);
        }
        sql += `
            ORDER BY 
                CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
                r.created_at DESC
        `;
        const [rows] = await pool.query(sql, params);

        const postIds = rows.filter(r => r.post_id).map(r => r.post_id);
        const mediaMap = {};
        if (postIds.length > 0) {
            const [media] = await pool.query(
                `SELECT post_id, media_url FROM community_post_media WHERE post_id IN (?) ORDER BY sort_order ASC`,
                [postIds]
            );
            for (const m of media) {
                if (!mediaMap[m.post_id]) mediaMap[m.post_id] = [];
                mediaMap[m.post_id].push(m.media_url);
            }
        }

        return rows.map(r => ({
            ...r,
            target_type: r.post_id ? 'post' : 'comment',
            post_media: r.post_id ? (mediaMap[r.post_id] || []) : []
        }));
    }

    async getReportStats() {
        const sql = `
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
                SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed
            FROM community_reports
        `;
        const [[stats]] = await pool.query(sql);
        return {
            total: Number(stats?.total || 0),
            pending: Number(stats?.pending || 0),
            reviewed: Number(stats?.reviewed || 0),
            dismissed: Number(stats?.dismissed || 0)
        };
    }

    async updateReportStatus(reportId, status, reviewerId) {
        await pool.query(
            'UPDATE community_reports SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, reviewerId, reportId]
        );
    }

    async handleReportAction(reportId, action, reviewerId) {
        const [[report]] = await pool.query('SELECT * FROM community_reports WHERE id = ?', [reportId]);
        if (!report) {
            const err = new Error('Báo cáo không tồn tại');
            err.statusCode = 404;
            throw err;
        }

        if (action === 'hide_content') {
            if (report.post_id) {
                await pool.query("UPDATE community_posts SET status = 'hidden' WHERE id = ?", [report.post_id]);
            }
            if (report.comment_id) {
                await pool.query("UPDATE community_comments SET status = 'hidden' WHERE id = ?", [report.comment_id]);
            }
            await pool.query(
                "UPDATE community_reports SET status = 'reviewed', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
                [reviewerId, reportId]
            );
        } else if (action === 'delete_content') {
            if (report.post_id) {
                await pool.query("UPDATE community_posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [report.post_id]);
            }
            if (report.comment_id) {
                await pool.query("UPDATE community_comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [report.comment_id]);
            }
            await pool.query(
                "UPDATE community_reports SET status = 'reviewed', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
                [reviewerId, reportId]
            );
        } else if (action === 'restore_content') {
            if (report.post_id) {
                await pool.query("UPDATE community_posts SET status = 'published', deleted_at = NULL WHERE id = ?", [report.post_id]);
            }
            if (report.comment_id) {
                await pool.query("UPDATE community_comments SET status = 'published', deleted_at = NULL WHERE id = ?", [report.comment_id]);
            }
            await pool.query(
                "UPDATE community_reports SET status = 'reviewed', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
                [reviewerId, reportId]
            );
        } else if (action === 'dismiss_report') {
            await pool.query(
                "UPDATE community_reports SET status = 'dismissed', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?",
                [reviewerId, reportId]
            );
        } else if (action === 'reopen_report') {
            await pool.query(
                "UPDATE community_reports SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL WHERE id = ?",
                [reportId]
            );
        }
    }
}

module.exports = new AdminRepository();
