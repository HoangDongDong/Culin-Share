const pool = require('../config/database');

class FollowRepository {
    async create(followerId, followingId) {
        const [result] = await pool.query(
            'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );
        return result.insertId;
    }

    async delete(followerId, followingId) {
        await pool.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );
    }

    async getFollowers(userId) {
        const sql = `
            SELECT f.follower_id AS id, u.username, u.full_name, u.avatar_url
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await pool.query(sql, [userId]);
        return rows;
    }

    async getFollowing(userId) {
        const sql = `
            SELECT f.following_id AS id, u.username, u.full_name, u.avatar_url
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await pool.query(sql, [userId]);
        return rows;
    }

    async isFollowing(followerId, followingId) {
        const [rows] = await pool.query(
            'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );
        return rows.length > 0;
    }
}

module.exports = new FollowRepository();
