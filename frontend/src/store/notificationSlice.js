/**
 * =================================================================
 * NOTIFICATION REDUX SLICE
 * =================================================================
 * Quản lý state thông báo: danh sách, số chưa đọc, trạng thái
 * loading. Hỗ trợ cả REST API lẫn realtime event từ Socket.io.
 * =================================================================
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    fetchNotificationsApi,
    fetchUnreadCountApi,
    markAsReadApi,
    markAllAsReadApi,
} from '../services/notificationApi';

// ========================
// ASYNC THUNKS
// ========================

/** Lấy danh sách thông báo (phân trang) */
export const fetchNotifications = createAsyncThunk(
    'notification/fetchNotifications',
    async (page = 1, { rejectWithValue }) => {
        try {
            const response = await fetchNotificationsApi(page);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi lấy thông báo');
        }
    }
);

/** Lấy số thông báo chưa đọc */
export const fetchUnreadCount = createAsyncThunk(
    'notification/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchUnreadCountApi();
            return response.data.unreadCount;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi đếm thông báo');
        }
    }
);

/** Đánh dấu 1 thông báo đã đọc */
export const markNotificationRead = createAsyncThunk(
    'notification/markRead',
    async (notificationId, { rejectWithValue }) => {
        try {
            await markAsReadApi(notificationId);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi đánh dấu đã đọc');
        }
    }
);

/** Đánh dấu tất cả đã đọc */
export const markAllRead = createAsyncThunk(
    'notification/markAllRead',
    async (_, { rejectWithValue }) => {
        try {
            await markAllAsReadApi();
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi đánh dấu tất cả đã đọc');
        }
    }
);

// ========================
// SLICE
// ========================

const initialState = {
    notifications: [],
    unreadCount: 0,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    page: 1,
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        /** Thêm notification mới từ Socket.io (realtime) */
        addRealtimeNotification(state, action) {
            // Thêm vào đầu danh sách
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
        /** Reset toàn bộ state notifications */
        resetNotifications(state) {
            state.notifications = [];
            state.unreadCount = 0;
            state.status = 'idle';
            state.error = null;
            state.page = 1;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { notifications, unreadCount, page } = action.payload;
                if (page === 1) {
                    state.notifications = notifications;
                } else {
                    // Append thêm khi load more (tránh duplicate)
                    const existingIds = new Set(state.notifications.map((n) => n.id));
                    const newNotifs = notifications.filter((n) => !existingIds.has(n.id));
                    state.notifications.push(...newNotifs);
                }
                state.unreadCount = unreadCount;
                state.page = page;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Fetch unread count
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            // Mark as read
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const notifId = action.payload;
                const notif = state.notifications.find((n) => n.id === notifId);
                if (notif && !notif.is_read) {
                    notif.is_read = 1;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            // Mark all read
            .addCase(markAllRead.fulfilled, (state) => {
                state.notifications.forEach((n) => {
                    n.is_read = 1;
                });
                state.unreadCount = 0;
            });
    },
});

export const { addRealtimeNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
