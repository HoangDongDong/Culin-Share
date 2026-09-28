const pool = require('../config/database');

class SavedRecipeRepository {
    async findAllByUserId(userId) {
        const sql = `
            SELECT r.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                   COALESCE(avg_rev.avg_rating, 0) AS average_rating,
                   COALESCE(avg_rev.rev_count, 0) AS review_count
            FROM saved_recipes sr
            JOIN recipes r ON sr.recipe_id = r.id
            LEFT JOIN users u ON r.author_id = u.id
            LEFT JOIN (
                SELECT recipe_id, AVG(rating) AS avg_rating, COUNT(*) AS rev_count
                FROM reviews
                GROUP BY recipe_id
            ) avg_rev ON r.id = avg_rev.recipe_id
            WHERE sr.user_id = ?
            ORDER BY sr.created_at DESC
        `;
        const [rows] = await pool.query(sql, [userId]);
        return rows;
    }

    async create(userId, recipeId) {
        const [result] = await pool.query(
            'INSERT IGNORE INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)',
            [userId, recipeId]
        );
        return result.insertId;
    }

    async delete(userId, recipeId) {
        await pool.query(
            'DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );
    }

    async isSaved(userId, recipeId) {
        const [rows] = await pool.query(
            'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );
        return rows.length > 0;
    }
}

module.exports = new SavedRecipeRepository();
