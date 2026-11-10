module.exports = {
    async up(connection) {
        // Tạo bảng contact_messages để lưu tin nhắn liên hệ, phản hồi từ người dùng
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                phone VARCHAR(30) NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('pending', 'read', 'resolved') NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_contact_created_at (created_at),
                INDEX idx_contact_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }
};
