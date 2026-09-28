const pool = require('../config/database');

class CategoryRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
        return rows[0] || null;
    }
}

module.exports = new CategoryRepository();
