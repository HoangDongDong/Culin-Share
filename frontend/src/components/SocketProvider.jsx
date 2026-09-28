/**
 * =================================================================
 * SOCKET PROVIDER
 * =================================================================
 * Provider component bọc toàn bộ App để quản lý kết nối Socket.io.
 * - Kết nối/ngắt socket khi user login/logout
 * - Lắng nghe sự kiện 'new_notification' từ server
 * - Dispatch notification vào Redux store
 * - Hiển thị Toast popup khi nhận notification mới
 * =================================================================
 */

import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { addRealtimeNotification, fetchUnreadCount } from '../store/notificationSlice';
import ToastNotification, { showNotificationToast } from './ToastNotification';

const SocketProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);
    const socketRef = useRef(null);

    useEffect(() => {
        // Lấy token từ Redux state hoặc localStorage
        const authToken = token || localStorage.getItem('token');

        if (user && authToken) {
            // Kết nối socket khi user đã login
            const socket = connectSocket(authToken);
            socketRef.current = socket;

            // Lắng nghe notification realtime
            socket.on('new_notification', (notification) => {
                console.log('📬 Nhận notification realtime:', notification);

                // Thêm vào Redux store
                dispatch(addRealtimeNotification(notification));

                // Hiển thị Toast popup
                showNotificationToast(notification);
            });

            // Fetch unread count khi kết nối thành công
            socket.on('connect', () => {
                dispatch(fetchUnreadCount());
            });
        }

        // Cleanup: ngắt socket khi user logout hoặc component unmount
        return () => {
            const socket = getSocket();
            if (socket) {
                socket.off('new_notification');
                socket.off('connect');
            }
            if (!user) {
                disconnectSocket();
                socketRef.current = null;
            }
        };
    }, [user, token, dispatch]);

    // Ngắt socket khi user logout (user === null)
    useEffect(() => {
        if (!user && socketRef.current) {
            disconnectSocket();
            socketRef.current = null;
        }
    }, [user]);

    return (
        <>
            {children}
            <ToastNotification />
        </>
    );
};

export default SocketProvider;
