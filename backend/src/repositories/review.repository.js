const pool = require('../config/database');

class ReviewRepository {
    async findByRecipeId(recipeId) {
        const sql = `
            SELECT r.*, u.username, u.full_name, u.avatar_url
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.recipe_id = ?
            ORDER BY (r.image_url IS NOT NULL) DESC, r.created_at DESC
        `;
        const [rows] = await pool.query(sql, [recipeId]);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async findByUserAndRecipe(userId, recipeId) {
        const [rows] = await pool.query(
            'SELECT * FROM reviews WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );
        return rows[0] || null;
    }

    async create(reviewData) {
        const { recipe_id, user_id, rating, comment, image_url, tip } = reviewData;
        const [result] = await pool.query(
            `INSERT INTO reviews (recipe_id, user_id, rating, comment, image_url, tip)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                rating = VALUES(rating),
                comment = VALUES(comment),
                image_url = COALESCE(VALUES(image_url), image_url),
                tip = COALESCE(VALUES(tip), tip),
                created_at = CURRENT_TIMESTAMP`,
            [recipe_id, user_id, rating, comment || null, image_url || null, tip || null]
        );
        return result.insertId;
    }

    async update(id, userId, rating, comment, image_url, tip) {
        let sql = 'UPDATE reviews SET rating = ?, comment = ?';
        const params = [rating, comment || null];
        if (image_url !== undefined) {
            sql += ', image_url = ?';
            params.push(image_url);
        }
        if (tip !== undefined) {
            sql += ', tip = ?';
            params.push(tip);
        }
        sql += ' WHERE id = ? AND user_id = ?';
        params.push(id, userId);
        await pool.query(sql, params);
    }

    async delete(id, userId) {
        await pool.query(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    }

    async getStatsByRecipeId(recipeId) {
        const [rows] = await pool.query(
            `SELECT COALESCE(AVG(rating), 0) AS average_rating, 
                    COUNT(*) AS review_count,
                    COUNT(image_url) AS cooksnap_count
             FROM reviews WHERE recipe_id = ?`,
            [recipeId]
        );
        return rows[0] || { average_rating: 0, review_count: 0, cooksnap_count: 0 };
    }
}

module.exports = new ReviewRepository();
