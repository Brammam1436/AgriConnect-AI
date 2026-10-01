import { useEffect, useState } from "react";
import api from "../api/api";

function FarmerNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/api/notifications/"
            );

            setNotifications(
                response.data.notifications
            );

            setUnreadCount(
                response.data.unread_count
            );
        } catch (err) {
            console.error(
                "Farmer notification fetch error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(
                `/api/notifications/${notificationId}/read/`
            );

            await fetchNotifications();
        } catch (err) {
            console.error(
                "Mark notification as read error:",
                err
            );
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put(
                "/api/notifications/read-all/"
            );

            await fetchNotifications();
        } catch (err) {
            console.error(
                "Mark all notifications as read error:",
                err
            );
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "ORDER_CREATED":
                return "🛒";

            case "PAYMENT_SUCCESS":
                return "💳";

            case "PAYMENT_FAILED":
                return "❌";

            case "ORDER_CONFIRMED":
                return "✅";

            case "ORDER_PROCESSING":
                return "⚙️";

            case "ORDER_SHIPPED":
                return "🚚";

            case "ORDER_DELIVERED":
                return "📦";

            case "ORDER_CANCELLED":
                return "🚫";

            default:
                return "🔔";
        }
    };

    const formatDate = (dateString) => {
        return new Date(
            dateString
        ).toLocaleString();
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) {
        return (
            <div className="notifications-container">
                <div className="notification-loading">
                    <div className="notification-loading-icon">
                        🔔
                    </div>

                    <h2>
                        Farmer Notifications
                    </h2>

                    <p>
                        Loading your notifications...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-container">
                <div className="notification-error">
                    <div className="notification-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Farmer Notifications
                    </h2>

                    <p className="error-text">
                        {error}
                    </p>

                    <button
                        className="notification-retry-button"
                        onClick={fetchNotifications}
                    >
                        🔄 Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-container">
            <div className="notifications-header">

                <div className="notifications-title-section">

                    <div className="notification-bell-wrapper">
                        <span className="notification-bell">
                            🔔
                        </span>

                        {unreadCount > 0 && (
                            <span className="notification-count-badge">
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2>
                            Farmer Notifications
                        </h2>

                        <p>
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${
                                      unreadCount > 1
                                          ? "s"
                                          : ""
                                  }`
                                : "You're all caught up!"}
                        </p>
                    </div>

                </div>

                {unreadCount > 0 && (
                    <button
                        className="mark-all-read-button"
                        onClick={markAllAsRead}
                    >
                        ✓ Mark All as Read
                    </button>
                )}

            </div>

            {notifications.length === 0 ? (

                <div className="empty-notifications">

                    <div className="empty-notification-icon">
                        🔔
                    </div>

                    <h3>
                        No Notifications
                    </h3>

                    <p>
                        You don't have any
                        notifications yet.
                    </p>

                </div>

            ) : (

                <div className="notifications-list">

                    {notifications.map(
                        (notification) => (

                            <div
                                key={notification.id}
                                className={`notification-card ${
                                    notification.is_read
                                        ? "notification-read"
                                        : "notification-unread"
                                }`}
                                onClick={() => {
                                    if (
                                        !notification.is_read
                                    ) {
                                        markAsRead(
                                            notification.id
                                        );
                                    }
                                }}
                            >

                                <div className="notification-icon">
                                    {getNotificationIcon(
                                        notification.notification_type
                                    )}
                                </div>

                                <div className="notification-content">

                                    <div className="notification-title-row">

                                        <h3>
                                            {notification.title}
                                        </h3>

                                        {!notification.is_read && (
                                            <span className="notification-new-badge">
                                                NEW
                                            </span>
                                        )}

                                    </div>

                                    <p>
                                        {notification.message}
                                    </p>

                                    <span className="notification-date">
                                        {formatDate(
                                            notification.created_at
                                        )}
                                    </span>

                                </div>

                                {!notification.is_read && (
                                    <div className="notification-unread-dot">
                                    </div>
                                )}

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );
}

export default FarmerNotifications;