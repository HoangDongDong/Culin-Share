const pool = require('../config/database');

class ContactRepository {
    async create({ name, email, phone = null, subject, message }) {
        const [result] = await pool.query(
            `INSERT INTO contact_messages (name, email, phone, subject, message)
             VALUES (?, ?, ?, ?, ?)`,
            [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, subject.trim(), message.trim()]
        );
        return {
            id: result.insertId,
            name,
            email,
            phone,
            subject,
            message,
            status: 'pending',
            created_at: new Date()
        };
    }

    async findAll({ page = 1, limit = 20, status = null }) {
        const offset = (Number(page) - 1) * Number(limit);
        const params = [];
        let where = '1=1';

        if (status && ['pending', 'read', 'resolved'].includes(status)) {
            where += ' AND status = ?';
            params.push(status);
        }

        const [items] = await pool.query(
            `SELECT id, name, email, phone, subject, message, status, created_at
             FROM contact_messages
             WHERE ${where}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM contact_messages WHERE ${where}`,
            params
        );

        return { items, total, page: Number(page), limit: Number(limit) };
    }

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT id, name, email, phone, subject, message, status, created_at
             FROM contact_messages WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async updateStatus(id, status) {
        if (!['pending', 'read', 'resolved'].includes(status)) {
            throw Object.assign(new Error('Trạng thái không hợp lệ'), { statusCode: 400 });
        }
        await pool.query(
            `UPDATE contact_messages SET status = ? WHERE id = ?`,
            [status, id]
        );
        return this.findById(id);
    }
}

module.exports = new ContactRepository();
