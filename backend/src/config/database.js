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
const databaseOptions = require('./databaseOptions');

// Tạo connection pool với cấu hình từ .env
const pool = mysql.createPool({
    ...databaseOptions(),

    // Pool configuration
    waitForConnections: true,  // Đợi khi tất cả connections đang bận
    connectionLimit: 5,        // Giới hạn pool cho mỗi instance
    queueLimit: 0,             // Không giới hạn hàng đợi
    enableKeepAlive: true,     // Giữ kết nối sống
    keepAliveInitialDelay: 0   // Bắt đầu keep-alive ngay lập tức
});

module.exports = pool;
