const pool = require('../config/database');

class SavedRecipeRepository {
    async findAllByUserId(userId, collectionName = null) {
        let sql = `
            SELECT r.*, u.full_name AS author_name, u.avatar_url AS author_avatar,
                   sr.collection_name, sr.created_at AS saved_at,
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
            WHERE sr.user_id = ? AND r.status='published'
        `;
        const params = [userId];

        if (collectionName && collectionName !== 'all') {
            sql += ' AND sr.collection_name = ?';
            params.push(collectionName);
        }

        sql += ' ORDER BY sr.created_at DESC';

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async getCollectionCounts(userId) {
        const sql = `
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN sr.collection_name = 'want_to_try' THEN 1 ELSE 0 END) AS want_to_try,
                SUM(CASE WHEN sr.collection_name = 'quick_dinner' THEN 1 ELSE 0 END) AS quick_dinner,
                SUM(CASE WHEN sr.collection_name = 'cooked' THEN 1 ELSE 0 END) AS cooked
            FROM saved_recipes sr
            JOIN recipes r ON sr.recipe_id = r.id
            WHERE sr.user_id = ? AND r.status = 'published'
        `;
        const [[row]] = await pool.query(sql, [userId]);
        return {
            total: Number(row?.total || 0),
            want_to_try: Number(row?.want_to_try || 0),
            quick_dinner: Number(row?.quick_dinner || 0),
            cooked: Number(row?.cooked || 0)
        };
    }

    async create(userId, recipeId, collectionName = 'want_to_try') {
        const validCollections = ['want_to_try', 'quick_dinner', 'cooked'];
        const col = validCollections.includes(collectionName) ? collectionName : 'want_to_try';
        const [result] = await pool.query(
            `INSERT INTO saved_recipes (user_id, recipe_id, collection_name)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE collection_name = VALUES(collection_name)`,
            [userId, recipeId, col]
        );
        return result.insertId;
    }

    async updateCollection(userId, recipeId, collectionName) {
        const validCollections = ['want_to_try', 'quick_dinner', 'cooked'];
        const col = validCollections.includes(collectionName) ? collectionName : 'want_to_try';
        await pool.query(
            'UPDATE saved_recipes SET collection_name = ? WHERE user_id = ? AND recipe_id = ?',
            [col, userId, recipeId]
        );
    }

    async delete(userId, recipeId) {
        await pool.query(
            'DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );
    }

    async isSaved(userId, recipeId) {
        const [rows] = await pool.query(
            'SELECT collection_name FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
            [userId, recipeId]
        );
        if (rows.length > 0) {
            return { isSaved: true, collection: rows[0].collection_name };
        }
        return { isSaved: false, collection: null };
    }
}

module.exports = new SavedRecipeRepository();
