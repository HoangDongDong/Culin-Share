/**
 * =================================================================
 * UPLOAD MIDDLEWARE (Cloudinary version)
 * =================================================================
 * Cấu hình multer và multer-storage-cloudinary để xử lý tải file
 * trực tiếp lên mây Cloudinary.
 * =================================================================
 */

const multer = require('multer');
const createStorage = require('./cloudinaryStorage');
const cloudinary = require('../config/cloudinary');

// Cấu hình lưu trữ Cloudinary chung
const storage = createStorage(cloudinary);

// Kiểm tra loại file đầu vào
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh (jpeg, jpg, png, gif, webp)!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: fileFilter
});

module.exports = upload;
