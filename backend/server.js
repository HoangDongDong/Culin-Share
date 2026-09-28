/**
 * =================================================================
 * SERVER.JS - Entry Point
 * =================================================================
 * Khởi tạo Express server, load middleware, và kết nối database.
 * =================================================================
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./src/config/socket');

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const recipeRoutes = require('./src/routes/recipe.routes');
const categoryRoutes = require('./src/routes/category.routes');
const reviewRoutes = require('./src/routes/review.routes');
const commentRoutes = require('./src/routes/comment.routes');
const savedRecipeRoutes = require('./src/routes/savedRecipe.routes');
const followRoutes = require('./src/routes/follow.routes');
const aiRoutes = require('./src/routes/ai.routes');
const adminRoutes = require('./src/routes/admin.routes');
const notificationRoutes = require('./src/routes/notification.routes');

const pool = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// GLOBAL MIDDLEWARES
// ========================

// Cho phép Cross-Origin requests từ frontend (cấu hình qua env)
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request không có origin (ví dụ: Postman, curl)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin '${origin}' không được phép`), false);
    },
    credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// Ảnh được lưu trên Cloudinary — không cần serve static /uploads nữa


// ========================
// ROUTES
// ========================

// Auth routes: /api/login, /api/register, /api/verify-otp, ...
app.use('/api', authRoutes);

// Recipe routes
app.use('/api', recipeRoutes);

// Category routes
app.use('/api', categoryRoutes);

// Review routes
app.use('/api', reviewRoutes);

// Comment routes
app.use('/api', commentRoutes);

// Saved recipe routes
app.use('/api', savedRecipeRoutes);

// Follow routes
app.use('/api', followRoutes);

// AI routes
app.use('/api', aiRoutes);

// Admin routes
app.use('/api', adminRoutes);

// Notification routes
app.use('/api', notificationRoutes);

// User routes: /user/profile, /admin/profile, ...
app.use('/', userRoutes);

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Server is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// ========================
// GLOBAL ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err.message);
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ========================
// START SERVER
// ========================
// Tạo HTTP server từ Express app
const server = http.createServer(app);

// Khởi tạo Socket.io trên HTTP server
initSocket(server);

const startServer = async () => {
    try {
        // Test kết nối database
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();

        // Khởi động server (dùng HTTP server thay vì app.listen)
        server.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
            console.log(`🔌 Socket.io đã sẵn sàng cho kết nối realtime`);
            console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Không thể kết nối database:', error.message);
        process.exit(1);
    }
};

startServer();
