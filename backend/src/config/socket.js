/**
 * =================================================================
 * SOCKET.IO CONFIGURATION
 * =================================================================
 * Cấu hình Socket.io Server với xác thực JWT.
 * Quản lý map userId → socketId để gửi thông báo realtime tới
 * đúng người dùng đang online.
 * =================================================================
 */

const { Server } = require('socket.io');
const JWTService = require('../services/jwt.service');

let io = null;

// Map lưu trữ userId → Set<socketId> (1 user có thể mở nhiều tab)
const onlineUsers = new Map();

/**
 * Khởi tạo Socket.io Server và gắn vào HTTP server
 * @param {import('http').Server} httpServer
 * @returns {Server} io instance
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // ========================
    // MIDDLEWARE: Xác thực JWT
    // ========================
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error('Authentication error - Token không tồn tại'));
            }

            const decoded = JWTService.verifyToken(token);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error - Token không hợp lệ'));
        }
    });

    // ========================
    // CONNECTION HANDLER
    // ========================
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`🔌 Socket connected: User ${userId} (socket: ${socket.id})`);

        // Thêm socket vào map online users
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Join room riêng theo userId để dễ emit
        socket.join(`user_${userId}`);

        // ========================
        // DISCONNECT HANDLER
        // ========================
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: User ${userId} (reason: ${reason})`);
            
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                }
            }
        });
    });

    console.log('✅ Socket.io Server đã khởi tạo thành công!');
    return io;
};

/**
 * Lấy instance Socket.io đã khởi tạo
 * @returns {Server}
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo! Hãy gọi initSocket() trước.');
    }
    return io;
};

/**
 * Gửi sự kiện tới một user cụ thể (tất cả tab/device)
 * @param {number} userId
 * @param {string} event
 * @param {object} data
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

/**
 * Kiểm tra user có đang online không
 * @param {number} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
    return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    isUserOnline,
};
