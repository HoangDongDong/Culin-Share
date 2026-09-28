/**
 * =================================================================
 * CLOUDINARY CONFIGURATION
 * =================================================================
 * Khởi tạo kết nối tới Cloudinary sử dụng credentials từ .env.
 * =================================================================
 */

const cloudinary = require('cloudinary').v2;

// Kiểm tra cấu hình môi trường
const isConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET;

if (!isConfigured) {
    console.warn('⚠️  Cloudinary chưa được cấu hình. Hãy thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file .env');
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

module.exports = cloudinary;
