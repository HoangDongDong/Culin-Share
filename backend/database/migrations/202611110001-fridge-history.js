module.exports = {
    async up(connection) {
        await connection.query(`CREATE TABLE IF NOT EXISTS fridge_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            request_config JSON NOT NULL,
            result JSON NOT NULL,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            INDEX idx_fridge_history_user (user_id, id),
            CONSTRAINT fk_fridge_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    }
};
