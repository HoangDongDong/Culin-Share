/**
 * =================================================================
 * TOAST NOTIFICATION COMPONENT
 * =================================================================
 * Hiển thị thông báo nổi (toast) tức thì khi user đang online
 * và nhận notification realtime từ Socket.io.
 * Sử dụng react-hot-toast cho animation mượt mà.
 * =================================================================
 */

import toast, { Toaster } from 'react-hot-toast';
import { getImageUrl } from '../services/api';

/**
 * Hiển thị toast notification cho một notification realtime
 * @param {object} notification - Notification object từ server
 */
export const showNotificationToast = (notification) => {
    const { type, sender_name, sender_avatar, message } = notification;

    // Icon theo loại notification
    const iconMap = {
        comment: 'chat_bubble',
        review: 'star',
        follow: 'person_add',
    };

    // Màu accent theo loại
    const colorMap = {
        comment: '#3b82f6',  // blue
        review: '#f59e0b',   // amber
        follow: '#8b5cf6',   // purple
    };

    const icon = iconMap[type] || 'notifications';
    const accentColor = colorMap[type] || '#3b82f6';

    toast.custom(
        (t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-sm w-full pointer-events-auto overflow-hidden`}
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.97), rgba(40, 40, 55, 0.97))',
                    borderRadius: '16px',
                    border: `1px solid ${accentColor}33`,
                    boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${accentColor}15`,
                    backdropFilter: 'blur(20px)',
                }}
            >
                <div className="flex items-start gap-3 p-4">
                    {/* Accent line */}
                    <div
                        style={{
                            width: '3px',
                            minHeight: '40px',
                            borderRadius: '2px',
                            background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}55)`,
                            flexShrink: 0,
                        }}
                    />

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-10 h-10 rounded-full overflow-hidden"
                            style={{ border: `2px solid ${accentColor}44` }}
                        >
                            {sender_avatar ? (
                                <img
                                    src={getImageUrl(sender_avatar)}
                                    alt={sender_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                                    style={{ background: accentColor }}
                                >
                                    {(sender_name || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Icon overlay */}
                        <div
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                                background: accentColor,
                                boxShadow: `0 2px 8px ${accentColor}66`,
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: '12px', color: 'white' }}
                            >
                                {icon}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                            {sender_name || 'Người dùng'}
                        </p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            {message}
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-shrink-0 p-1 rounded-full transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                        onMouseEnter={(e) => (e.target.style.color = 'rgba(255,255,255,0.7)')}
                        onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.3)')}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            close
                        </span>
                    </button>
                </div>
            </div>
        ),
        {
            duration: 5000,
            position: 'top-right',
        }
    );
};

/**
 * Component Toaster container – đặt 1 lần trong App
 */
const ToastNotification = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 5000,
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                },
            }}
            containerStyle={{
                top: 80,
                right: 16,
            }}
        />
    );
};

export default ToastNotification;
