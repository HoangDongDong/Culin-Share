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
}

module.exports = new AdminRepository();
