/**
 * =================================================================
 * SOCKET.IO CLIENT
 * =================================================================
 * Quản lý kết nối Socket.io tới backend server.
 * Gửi JWT token khi connect để xác thực.
 * =================================================================
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let socket = null;

/**
 * Kết nối Socket.io tới server với JWT token
 * @param {string} token - JWT token từ localStorage
 * @returns {object} socket instance
 */
export const connectSocket = (token) => {
    if (socket?.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('🔌 Socket.io connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.io disconnected:', reason);
    });

    return socket;
};

/**
 * Ngắt kết nối Socket.io
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket.io đã ngắt kết nối');
    }
};

/**
 * Lấy instance Socket.io hiện tại
 * @returns {object|null}
 */
export const getSocket = () => socket;
