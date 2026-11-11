const pool = require('../config/database');

const parseJson = value => typeof value === 'string' ? JSON.parse(value) : value;

class FridgeHistoryRepository {
    async create(userId, config, result) {
        const [saved] = await pool.query(
            'INSERT INTO fridge_history (user_id, request_config, result) VALUES (?, ?, ?)',
            [userId, JSON.stringify(config), JSON.stringify(result)]
        );
        return saved.insertId;
    }

    async list(userId, before = null) {
        const params = [userId];
        let cursor = '';
        if (before !== null) {
            cursor = ' AND id < ?';
            params.push(before);
        }
        const [rows] = await pool.query(`SELECT id, created_at, request_config,
            JSON_EXTRACT(result, '$.recipes[*].name') AS recipe_names
            FROM fridge_history WHERE user_id = ?${cursor} ORDER BY id DESC LIMIT 11`, params);
        const entries = rows.slice(0, 10).map(row => ({
            ...row,
            request_config: parseJson(row.request_config),
            recipe_names: parseJson(row.recipe_names) || []
        }));
        return { entries, nextCursor: rows.length > 10 ? entries.at(-1).id : null };
    }

    async findById(userId, id) {
        const [rows] = await pool.query(
            'SELECT id, created_at, request_config, result FROM fridge_history WHERE user_id = ? AND id = ?',
            [userId, id]
        );
        const row = rows[0];
        if (!row) return null;
        return { ...row, request_config: parseJson(row.request_config), result: parseJson(row.result) };
    }

    async delete(userId, id) {
        const [result] = await pool.query('DELETE FROM fridge_history WHERE user_id = ? AND id = ?', [userId, id]);
        return result.affectedRows > 0;
    }
}

module.exports = new FridgeHistoryRepository();
