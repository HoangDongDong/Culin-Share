const pool = require('../config/database');

class CommentRepository {
    async findByRecipeId(recipeId) {
        const sql = `
            SELECT c.*, u.username, u.full_name, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.recipe_id = ?
            ORDER BY c.created_at ASC
        `;
        const [rows] = await pool.query(sql, [recipeId]);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async create(commentData) {
        const { recipe_id, user_id, parent_id, content } = commentData;
        const [result] = await pool.query(
            `INSERT INTO comments (recipe_id, user_id, parent_id, content)
             VALUES (?, ?, ?, ?)`,
            [recipe_id, user_id, parent_id || null, content]
        );
        return result.insertId;
    }

    async delete(id, userId) {
        await pool.query(
            'DELETE FROM comments WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    }

    async deleteById(id) {
        await pool.query(
            'DELETE FROM comments WHERE id = ?',
            [id]
        );
    }

    async deleteByParentId(parentId) {
        await pool.query(
            'DELETE FROM comments WHERE parent_id = ?',
            [parentId]
        );
    }
}

module.exports = new CommentRepository();
