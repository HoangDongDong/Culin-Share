/**
 * =================================================================
 * UPLOAD MIDDLEWARE (Cloudinary version)
 * =================================================================
 * Cấu hình multer và multer-storage-cloudinary để xử lý tải file
 * trực tiếp lên mây Cloudinary.
 * =================================================================
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cấu hình lưu trữ Cloudinary chung
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isAvatar = file.fieldname === 'avatar';
        const folderName = isAvatar ? 'mamngon/avatars' : 'mamngon/recipes';
        
        return {
            folder: folderName,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            public_id: `${file.fieldname}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
    }
});

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
