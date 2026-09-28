/**
 * =================================================================
 * DATABASE CONFIGURATION
 * =================================================================
 * Tạo connection pool MySQL sử dụng mysql2/promise.
 * Pool giúp quản lý nhiều kết nối hiệu quả, tránh tạo kết nối mới
 * cho mỗi truy vấn.
 * =================================================================
 */

const mysql = require('mysql2/promise');

// Tạo connection pool với cấu hình từ .env
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'CulinShare',

    // Pool configuration
    waitForConnections: true,  // Đợi khi tất cả connections đang bận
    connectionLimit: 10,       // Số connection tối đa trong pool
    queueLimit: 0,             // Không giới hạn hàng đợi
    enableKeepAlive: true,     // Giữ kết nối sống
    keepAliveInitialDelay: 0   // Bắt đầu keep-alive ngay lập tức
});

module.exports = pool;
