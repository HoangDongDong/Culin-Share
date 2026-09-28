/**
 * =================================================================
 * NOTIFICATION BELL COMPONENT
 * =================================================================
 * Component chuông thông báo hiển thị trên Header.
 * - Icon chuông với badge đỏ (số chưa đọc)
 * - Dropdown panel hiển thị danh sách thông báo
 * - Click outside để đóng dropdown
 * - Hỗ trợ đánh dấu đã đọc / đánh dấu tất cả
 * =================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllRead,
} from '../store/notificationSlice';
import { getImageUrl } from '../services/api';

/**
 * Tính thời gian tương đối (vd: "2 phút trước", "1 giờ trước")
 */
const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

/**
 * Icon và màu theo loại notification
 */
const typeConfig = {
    comment: { icon: 'chat_bubble', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    review: { icon: 'star', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    follow: { icon: 'person_add', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    new_recipe: { icon: 'restaurant_menu', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
};

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount, status } = useSelector((state) => state.notification);
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications & unread count khi user đã login
    useEffect(() => {
        if (user) {
            dispatch(fetchUnreadCount());
        }
    }, [user, dispatch]);

    // Load danh sách khi mở dropdown
    useEffect(() => {
        if (isOpen && user) {
            dispatch(fetchNotifications(1));
        }
    }, [isOpen, user, dispatch]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleMarkAllRead = () => {
        dispatch(markAllRead());
    };

    const handleNotificationClick = (notif) => {
        if (!notif.is_read) {
            dispatch(markNotificationRead(notif.id));
        }
        setIsOpen(false);
        if (notif.type === 'comment' || notif.type === 'review' || notif.type === 'new_recipe') {
            if (notif.recipe_id) {
                navigate(`/recipe/${notif.recipe_id}`);
            }
        } else if (notif.type === 'follow') {
            if (notif.sender_id) {
                navigate(`/chef/${notif.sender_id}`);
            }
        }
    };

    // Nếu chưa login, hiển thị chuông đơn giản (không click được)
    if (!user) {
        return (
            <button className="material-symbols-outlined text-secondary hover:text-primary transition-all active:scale-95 p-2 rounded-full hover:bg-surface-container-low select-none">
                notifications
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                id="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                className="relative material-symbols-outlined text-secondary hover:text-primary transition-all active:scale-95 p-2 rounded-full hover:bg-surface-container-low select-none"
                style={{ fontSize: '24px' }}
            >
                notifications
                {/* Badge số chưa đọc */}
                {unreadCount > 0 && (
                    <span
                        className="absolute flex items-center justify-center font-bold text-white select-none"
                        style={{
                            top: '4px',
                            right: '4px',
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '9px',
                            fontSize: '10px',
                            padding: '0 4px',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                            animation: 'pulse 2s infinite',
                            lineHeight: '1',
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    id="notification-dropdown"
                    className="absolute right-0 mt-3 z-50"
                    style={{
                        width: '380px',
                        maxHeight: '480px',
                        background: 'var(--surface-container-lowest, #fff)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        animation: 'fadeSlideIn 0.2s ease-out',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4"
                        style={{
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            background: 'linear-gradient(to right, rgba(var(--primary-rgb, 139, 92, 246), 0.04), transparent)',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-on-surface">Thông báo</h3>
                            {unreadCount > 0 && (
                                <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        fontSize: '11px',
                                    }}
                                >
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div
                        className="overflow-y-auto"
                        style={{ maxHeight: '400px' }}
                    >
                        {status === 'loading' && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <div
                                    className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
                                    style={{ animation: 'spin 0.8s linear infinite' }}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <span
                                    className="material-symbols-outlined text-on-surface-variant/30 mb-3"
                                    style={{ fontSize: '48px' }}
                                >
                                    notifications_off
                                </span>
                                <p className="text-sm text-on-surface-variant/50 text-center">
                                    Chưa có thông báo nào
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const config = typeConfig[notif.type] || typeConfig.comment;
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                                        style={{
                                            background: notif.is_read
                                                ? 'transparent'
                                                : 'rgba(var(--primary-rgb, 139, 92, 246), 0.04)',
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = notif.is_read
                                                ? 'transparent'
                                                : 'rgba(var(--primary-rgb, 139, 92, 246), 0.04)';
                                        }}
                                    >
                                        {/* Avatar + Type icon */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20">
                                                {notif.sender_avatar ? (
                                                    <img
                                                        src={getImageUrl(notif.sender_avatar)}
                                                        alt={notif.sender_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                                                        style={{ background: config.color }}
                                                    >
                                                        {(notif.sender_name || '?')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                                                style={{
                                                    background: config.bg,
                                                    borderColor: 'var(--surface-container-lowest, #fff)',
                                                }}
                                            >
                                                <span
                                                    className="material-symbols-outlined"
                                                    style={{ fontSize: '11px', color: config.color }}
                                                >
                                                    {config.icon}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-on-surface leading-snug">
                                                <span className="font-semibold">{notif.sender_name || notif.sender_username}</span>
                                                {' '}
                                                <span className="text-on-surface-variant">{notif.message}</span>
                                            </p>
                                            <p
                                                className="text-xs mt-1 font-medium"
                                                style={{ color: notif.is_read ? 'var(--on-surface-variant)' : config.color }}
                                            >
                                                {getRelativeTime(notif.created_at)}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.is_read && (
                                            <div
                                                className="flex-shrink-0 mt-2 w-2.5 h-2.5 rounded-full"
                                                style={{
                                                    background: config.color,
                                                    boxShadow: `0 0 8px ${config.color}66`,
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Inline keyframes */}
            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default NotificationBell;
