import { useEffect, useState } from "react";
import api from "../api/api";
import "./DeliveryPartnerDashboard.css";

const MENU_ITEMS = [
    {
        id: "dashboard",
        icon: "🏠",
        label: "Dashboard",
    },
    {
        id: "orders",
        icon: "📦",
        label: "Assigned Orders",
    },
    {
        id: "active",
        icon: "🚚",
        label: "Active Deliveries",
    },
    {
        id: "completed",
        icon: "✅",
        label: "Completed Deliveries",
    },
    {
        id: "notifications",
        icon: "🔔",
        label: "Notifications",
    },
    {
        id: "profile",
        icon: "👤",
        label: "My Profile",
    },
];

const DELIVERY_STAGES = [
    {
        status: "CONFIRMED",
        label: "Order Confirmed",
        icon: "📋",
        description: "The order has been confirmed.",
    },
    {
        status: "PROCESSING",
        label: "Processing",
        icon: "⚙️",
        description: "The order is being prepared.",
    },
    {
        status: "SHIPPED",
        label: "Shipped",
        icon: "🚚",
        description: "The order has been handed over for delivery.",
    },
    {
        status: "DELIVERED",
        label: "Delivered",
        icon: "✅",
        description: "The order was delivered successfully.",
    },
];

function DeliveryPartnerDashboard({ onLogout }) {
    const [activePage, setActivePage] = useState("dashboard");

    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState(null);

    const [unreadCount, setUnreadCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [notificationsLoading, setNotificationsLoading] =
        useState(false);

    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [message, setMessage] = useState("");

    const [partnerName, setPartnerName] = useState(
        localStorage.getItem("current_username") ||
            "Delivery Partner"
    );

    const [selectedOrder, setSelectedOrder] = useState(null);

    // =========================================================
    // PROFILE EDITING STATE
    // =========================================================

    const [isEditingProfile, setIsEditingProfile] =
        useState(false);

    const [profileSaving, setProfileSaving] =
        useState(false);

    const [profileMessage, setProfileMessage] =
        useState("");

    const [profileError, setProfileError] =
        useState("");

    const [profileForm, setProfileForm] = useState({
        username: "",
        email: "",
        phone: "",
    });

    // =========================================================
    // CHANGE PASSWORD STATE
    // =========================================================

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [passwordSaving, setPasswordSaving] =
        useState(false);

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    // =========================================================
    // FETCH DELIVERY PARTNER PROFILE
    // =========================================================

    const fetchProfile = async () => {
        try {
            const response = await api.get(
                "/api/auth/me/"
            );

            const user =
                response.data?.user ||
                response.data;

            if (user) {
                setProfile(user);

                if (user.username) {
                    setPartnerName(user.username);

                    localStorage.setItem(
                        "current_username",
                        user.username
                    );
                }

                setProfileForm({
                    username: user.username || "",
                    email: user.email || "",
                    phone: user.phone || "",
                });
            }
        } catch (error) {
            console.error(
                "Delivery partner profile error:",
                error
            );
        }
    };

    // =========================================================
    // FETCH ASSIGNED ORDERS
    // =========================================================

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setMessage("");

            const response = await api.get(
                "/api/orders/delivery/"
            );

            const data = response.data;

            let orderList = [];

            if (Array.isArray(data)) {
                orderList = data;
            } else if (Array.isArray(data?.orders)) {
                orderList = data.orders;
            } else if (Array.isArray(data?.results)) {
                orderList = data.results;
            }

            setOrders(orderList);

            setSelectedOrder((currentOrder) => {
                if (!currentOrder) {
                    return null;
                }

                const updatedOrder = orderList.find(
                    (order) =>
                        order.id === currentOrder.id
                );

                return updatedOrder || null;
            });
        } catch (error) {
            console.error(
                "Delivery orders error:",
                error
            );

            setOrders([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load assigned orders."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FETCH NOTIFICATIONS
    // =========================================================

    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);

            const response = await api.get(
                "/api/notifications/"
            );

            setNotifications(
                response.data?.notifications || []
            );

            setUnreadCount(
                Number(
                    response.data?.unread_count || 0
                )
            );
        } catch (error) {
            console.error(
                "Delivery notification error:",
                error
            );
        } finally {
            setNotificationsLoading(false);
        }
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        fetchNotifications();

        const interval = setInterval(() => {
            fetchOrders();
            fetchNotifications();
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // =========================================================
    // ORDER DETAILS
    // =========================================================

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setMessage("");
    };

    const handleCloseOrderDetails = () => {
        if (updatingOrderId === null) {
            setSelectedOrder(null);
        }
    };

    // =========================================================
    // MARK NOTIFICATION AS READ
    // =========================================================

    const handleMarkNotificationRead = async (
        notificationId
    ) => {
        try {
            const notificationUrl =
                "/api/notifications/" +
                notificationId +
                "/read/";

            await api.put(notificationUrl);

            await fetchNotifications();
        } catch (error) {
            console.error(
                "Mark notification read error:",
                error
            );
        }
    };

    // =========================================================
    // MARK ORDER AS DELIVERED
    // =========================================================

    const handleMarkAsDelivered = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to mark Order #" +
                orderId +
                " as delivered?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingOrderId(orderId);
            setMessage("");

            const deliveryStatusUrl =
                "/api/orders/delivery/" +
                orderId +
                "/status/";

            const response = await api.put(
                deliveryStatusUrl,
                {
                    status: "DELIVERED",
                }
            );

            console.log(
                "Order delivered successfully:",
                response.data
            );

            setMessage(
                "Order #" +
                    orderId +
                    " has been marked as delivered successfully."
            );

            await fetchOrders();
            await fetchNotifications();

            setSelectedOrder(null);
        } catch (error) {
            console.error(
                "Mark order delivered error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to mark the order as delivered."
            );
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // =========================================================
    // PROFILE FORM CHANGE
    // =========================================================

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        setProfileMessage("");
        setProfileError("");
    };

    // =========================================================
    // START PROFILE EDITING
    // =========================================================

    const handleEditProfile = () => {
        const user = profile || {};

        setProfileForm({
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
        });

        setProfileMessage("");
        setProfileError("");

        setIsEditingProfile(true);
    };

    // =========================================================
    // CANCEL PROFILE EDITING
    // =========================================================

    const handleCancelProfileEdit = () => {
        const user = profile || {};

        setProfileForm({
            username: user.username || "",
            email: user.email || "",
            phone: user.phone || "",
        });

        setProfileMessage("");
        setProfileError("");

        setIsEditingProfile(false);
    };

    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        const username =
            profileForm.username.trim();

        const email =
            profileForm.email.trim();

        const phone =
            profileForm.phone.trim();

        if (!username) {
            setProfileError(
                "Username is required."
            );
            setProfileMessage("");
            return;
        }

        if (!email) {
            setProfileError(
                "Email is required."
            );
            setProfileMessage("");
            return;
        }

        try {
            setProfileSaving(true);
            setProfileMessage("");
            setProfileError("");

            const response = await api.put(
                "/api/auth/me/",
                {
                    username,
                    email,
                    phone,
                }
            );

            const updatedUser =
                response.data?.user ||
                response.data;

            if (updatedUser) {
                setProfile(updatedUser);

                if (updatedUser.username) {
                    setPartnerName(
                        updatedUser.username
                    );

                    localStorage.setItem(
                        "current_username",
                        updatedUser.username
                    );
                }

                setProfileForm({
                    username:
                        updatedUser.username || "",
                    email:
                        updatedUser.email || "",
                    phone:
                        updatedUser.phone || "",
                });
            } else {
                await fetchProfile();
            }

            setProfileMessage(
                "Profile updated successfully."
            );

            setProfileError("");
            setIsEditingProfile(false);
        } catch (error) {
            console.error(
                "Profile update error:",
                error
            );

            const data =
                error.response?.data;

            let errorMessage =
                "Unable to update your profile.";

            if (data) {
                if (data.username) {
                    errorMessage =
                        Array.isArray(
                            data.username
                        )
                            ? data.username[0]
                            : data.username;
                } else if (data.email) {
                    errorMessage =
                        Array.isArray(
                            data.email
                        )
                            ? data.email[0]
                            : data.email;
                } else if (data.phone) {
                    errorMessage =
                        Array.isArray(
                            data.phone
                        )
                            ? data.phone[0]
                            : data.phone;
                } else if (data.detail) {
                    errorMessage =
                        data.detail;
                } else if (data.error) {
                    errorMessage =
                        data.error;
                }
            }

            setProfileError(errorMessage);
            setProfileMessage("");
        } finally {
            setProfileSaving(false);
        }
    };

    // =========================================================
    // PASSWORD FORM CHANGE
    // =========================================================

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));

        setPasswordMessage("");
        setPasswordError("");
    };

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const handleChangePassword = async (event) => {
        event.preventDefault();

        const currentPassword =
            passwordForm.current_password.trim();

        const newPassword =
            passwordForm.new_password;

        const confirmPassword =
            passwordForm.confirm_password;

        if (!currentPassword) {
            setPasswordError(
                "Current password is required."
            );
            setPasswordMessage("");
            return;
        }

        if (!newPassword) {
            setPasswordError(
                "New password is required."
            );
            setPasswordMessage("");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "New password must contain at least 8 characters."
            );
            setPasswordMessage("");
            return;
        }

        if (!confirmPassword) {
            setPasswordError(
                "Please confirm your new password."
            );
            setPasswordMessage("");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(
                "New password and confirm password do not match."
            );
            setPasswordMessage("");
            return;
        }

        try {
            setPasswordSaving(true);
            setPasswordMessage("");
            setPasswordError("");

            const response = await api.post(
                "/api/auth/change-password/",
                {
                    current_password:
                        currentPassword,
                    new_password:
                        newPassword,
                    confirm_password:
                        confirmPassword,
                }
            );

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });

            setPasswordMessage(
                response.data?.message ||
                    "Password changed successfully."
            );

            setPasswordError("");
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            const data =
                error.response?.data;

            let errorMessage =
                "Unable to change your password.";

            if (data) {
                if (data.current_password) {
                    errorMessage =
                        Array.isArray(
                            data.current_password
                        )
                            ? data.current_password[0]
                            : data.current_password;
                } else if (data.new_password) {
                    errorMessage =
                        Array.isArray(
                            data.new_password
                        )
                            ? data.new_password[0]
                            : data.new_password;
                } else if (data.confirm_password) {
                    errorMessage =
                        Array.isArray(
                            data.confirm_password
                        )
                            ? data.confirm_password[0]
                            : data.confirm_password;
                } else if (data.detail) {
                    errorMessage =
                        data.detail;
                } else if (data.error) {
                    errorMessage =
                        data.error;
                }
            }

            setPasswordError(errorMessage);
            setPasswordMessage("");
        } finally {
            setPasswordSaving(false);
        }
    };

    // =========================================================
    // ORDER HELPERS
    // =========================================================

    const activeOrders = orders.filter(
        (order) => order.status === "SHIPPED"
    );

    const completedOrders = orders.filter(
        (order) => order.status === "DELIVERED"
    );

    const totalAssigned = orders.length;

    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (status) => {
        switch (status) {
            case "CONFIRMED":
                return "delivery-status confirmed";

            case "PROCESSING":
                return "delivery-status processing";

            case "SHIPPED":
                return "delivery-status shipped";

            case "DELIVERED":
                return "delivery-status delivered";

            case "CANCELLED":
                return "delivery-status cancelled";

            default:
                return "delivery-status";
        }
    };

    // =========================================================
    // DELIVERY TIMELINE
    // =========================================================

    const getTimelineStageClass = (
        orderStatus,
        stageStatus
    ) => {
        const stageIndex =
            DELIVERY_STAGES.findIndex(
                (stage) =>
                    stage.status === stageStatus
            );

        const currentIndex =
            DELIVERY_STAGES.findIndex(
                (stage) =>
                    stage.status === orderStatus
            );

        if (orderStatus === "CANCELLED") {
            return "delivery-timeline-stage cancelled";
        }

        if (
            currentIndex !== -1 &&
            stageIndex < currentIndex
        ) {
            return "delivery-timeline-stage completed";
        }

        if (
            currentIndex !== -1 &&
            stageIndex === currentIndex
        ) {
            return "delivery-timeline-stage current";
        }

        return "delivery-timeline-stage upcoming";
    };

    // =========================================================
    // FORMAT DELIVERY ADDRESS
    // =========================================================

    const getDeliveryAddress = (order) => {
        const addressParts = [];

        if (order.delivery_address_line1) {
            addressParts.push(
                order.delivery_address_line1
            );
        }

        if (order.delivery_address_line2) {
            addressParts.push(
                order.delivery_address_line2
            );
        }

        if (order.delivery_city) {
            addressParts.push(
                order.delivery_city
            );
        }

        if (order.delivery_state) {
            addressParts.push(
                order.delivery_state
            );
        }

        if (order.delivery_postal_code) {
            addressParts.push(
                order.delivery_postal_code
            );
        }

        if (order.delivery_country) {
            addressParts.push(
                order.delivery_country
            );
        }

        return addressParts.length > 0
            ? addressParts.join(", ")
            : "Address not available";
    };

    // =========================================================
    // ORDER DETAILS MODAL
    // =========================================================

    const renderOrderDetailsModal = () => {
        if (!selectedOrder) {
            return null;
        }

        const order = selectedOrder;
        const items = order.items || [];

        const isUpdating =
            updatingOrderId === order.id;

        return (
            <div
                className="delivery-modal-overlay"
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        handleCloseOrderDetails();
                    }
                }}
            >
                <div
                    className="delivery-order-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delivery-order-modal-title"
                >
                    <div className="delivery-modal-header">
                        <div>
                            <span className="delivery-modal-label">
                                ORDER DETAILS
                            </span>

                            <h2 id="delivery-order-modal-title">
                                Order #{order.id}
                            </h2>

                            <p>
                                Complete delivery information
                            </p>
                        </div>

                        <button
                            type="button"
                            className="delivery-modal-close"
                            onClick={
                                handleCloseOrderDetails
                            }
                            disabled={isUpdating}
                            aria-label="Close order details"
                        >
                            ×
                        </button>
                    </div>

                    <div className="delivery-modal-status-section">
                        <div>
                            <span>
                                Current Status
                            </span>

                            <strong>
                                {order.status}
                            </strong>
                        </div>

                        <span
                            className={getStatusClass(
                                order.status
                            )}
                        >
                            {order.status}
                        </span>
                    </div>

                    <div className="delivery-modal-section">
                        <div className="delivery-modal-section-title">
                            🚚 Delivery Progress
                        </div>

                        <div
                            className={
                                order.status ===
                                "CANCELLED"
                                    ? "delivery-timeline cancelled"
                                    : "delivery-timeline"
                            }
                        >
                            {DELIVERY_STAGES.map(
                                (stage, index) => (
                                    <div
                                        className={getTimelineStageClass(
                                            order.status,
                                            stage.status
                                        )}
                                        key={
                                            stage.status
                                        }
                                    >
                                        <div className="delivery-timeline-marker">
                                            {stage.icon}
                                        </div>

                                        <div className="delivery-timeline-content">
                                            <strong>
                                                {
                                                    stage.label
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    stage.description
                                                }
                                            </span>
                                        </div>

                                        {index <
                                            DELIVERY_STAGES.length -
                                                1 && (
                                            <div className="delivery-timeline-line"></div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>

                        {order.status ===
                            "CANCELLED" && (
                            <div className="delivery-timeline-cancelled-message">
                                ❌ This order has been
                                cancelled.
                            </div>
                        )}
                    </div>

                    <div className="delivery-modal-section">
                        <div className="delivery-modal-section-title">
                            👤 Customer Information
                        </div>

                        <div className="delivery-modal-grid">
                            <div className="delivery-modal-info">
                                <span>
                                    Customer
                                </span>

                                <strong>
                                    {order.customer_username ||
                                        "Customer"}
                                </strong>
                            </div>

                            <div className="delivery-modal-info">
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {order.delivery_phone ||
                                        "N/A"}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="delivery-modal-section">
                        <div className="delivery-modal-section-title">
                            📍 Delivery Information
                        </div>

                        <div className="delivery-modal-grid">
                            <div className="delivery-modal-info">
                                <span>
                                    Recipient Name
                                </span>

                                <strong>
                                    {order.delivery_name ||
                                        "N/A"}
                                </strong>
                            </div>

                            <div className="delivery-modal-info">
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {order.delivery_phone ||
                                        "N/A"}
                                </strong>
                            </div>
                        </div>

                        <div className="delivery-modal-address">
                            <span>
                                Full Address
                            </span>

                            <p>
                                {getDeliveryAddress(
                                    order
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="delivery-modal-section">
                        <div className="delivery-modal-section-title">
                            📦 Order Items
                        </div>

                        {items.length > 0 ? (
                            <div className="delivery-modal-items">
                                {items.map((item) => (
                                    <div
                                        className="delivery-modal-item"
                                        key={item.id}
                                    >
                                        <div className="delivery-modal-item-main">
                                            <strong>
                                                {item.product_name ||
                                                    "Product"}
                                            </strong>

                                            <span>
                                                Quantity:{" "}
                                                {Number(
                                                    item.quantity ||
                                                        0
                                                ).toFixed(
                                                    2
                                                )}{" "}
                                                kg
                                            </span>
                                        </div>

                                        <div className="delivery-modal-item-price">
                                            <span>
                                                ₹
                                                {Number(
                                                    item.price_per_kg ||
                                                        0
                                                ).toFixed(
                                                    2
                                                )}
                                                /kg
                                            </span>

                                            <strong>
                                                ₹
                                                {Number(
                                                    item.subtotal ||
                                                        0
                                                ).toFixed(
                                                    2
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="delivery-empty-text">
                                No items available.
                            </p>
                        )}
                    </div>

                    <div className="delivery-modal-summary">
                        <div>
                            <span>
                                Order Date
                            </span>

                            <strong>
                                {order.created_at
                                    ? new Date(
                                          order.created_at
                                      ).toLocaleString()
                                    : "N/A"}
                            </strong>
                        </div>

                        <div className="delivery-modal-total">
                            <span>
                                Total Amount
                            </span>

                            <strong>
                                ₹
                                {Number(
                                    order.total_amount ||
                                        0
                                ).toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <div className="delivery-modal-actions">
                        <button
                            type="button"
                            className="delivery-modal-secondary-button"
                            onClick={
                                handleCloseOrderDetails
                            }
                            disabled={isUpdating}
                        >
                            Close
                        </button>

                        {order.status ===
                            "SHIPPED" && (
                            <button
                                type="button"
                                className="delivery-modal-deliver-button"
                                onClick={() =>
                                    handleMarkAsDelivered(
                                        order.id
                                    )
                                }
                                disabled={isUpdating}
                            >
                                {isUpdating
                                    ? "Updating..."
                                    : "✅ Mark as Delivered"}
                            </button>
                        )}

                        {order.status ===
                            "DELIVERED" && (
                            <div className="delivery-modal-completed">
                                ✅ Delivery Completed
                            </div>
                        )}

                        {order.status ===
                            "CANCELLED" && (
                            <div className="delivery-modal-cancelled">
                                ❌ Order Cancelled
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================
    // ORDER CARD
    // =========================================================

    const renderOrderCard = (order) => {
        const items = order.items || [];

        const isUpdating =
            updatingOrderId === order.id;

        return (
            <div
                className="delivery-order-card"
                key={order.id}
            >
                <div className="delivery-order-header">
                    <div>
                        <span className="delivery-order-label">
                            ORDER
                        </span>

                        <h3>
                            #{order.id}
                        </h3>
                    </div>

                    <span
                        className={getStatusClass(
                            order.status
                        )}
                    >
                        {order.status}
                    </span>
                </div>

                <div className="delivery-order-info">
                    <div className="delivery-info-item">
                        <span>
                            Customer
                        </span>

                        <strong>
                            {order.customer_username ||
                                "Customer"}
                        </strong>
                    </div>

                    <div className="delivery-info-item">
                        <span>
                            Total Amount
                        </span>

                        <strong>
                            ₹
                            {Number(
                                order.total_amount || 0
                            ).toFixed(2)}
                        </strong>
                    </div>

                    <div className="delivery-info-item">
                        <span>
                            Delivery Name
                        </span>

                        <strong>
                            {order.delivery_name ||
                                "N/A"}
                        </strong>
                    </div>

                    <div className="delivery-info-item">
                        <span>
                            Phone
                        </span>

                        <strong>
                            {order.delivery_phone ||
                                "N/A"}
                        </strong>
                    </div>
                </div>

                <div className="delivery-address-box">
                    <span>
                        📍 Delivery Address
                    </span>

                    <p>
                        {order.delivery_address_line1 ||
                            ""}

                        {order.delivery_address_line2
                            ? ", " +
                              order.delivery_address_line2
                            : ""}

                        {order.delivery_city
                            ? ", " +
                              order.delivery_city
                            : ""}

                        {order.delivery_state
                            ? ", " +
                              order.delivery_state
                            : ""}

                        {order.delivery_postal_code
                            ? " - " +
                              order.delivery_postal_code
                            : ""}
                    </p>
                </div>

                <div className="delivery-items-section">
                    <div className="delivery-items-title">
                        📦 Order Items
                    </div>

                    {items.length > 0 ? (
                        <div className="delivery-items-list">
                            {items.map((item) => (
                                <div
                                    className="delivery-item-row"
                                    key={item.id}
                                >
                                    <span>
                                        {item.product_name ||
                                            "Product"}
                                    </span>

                                    <span>
                                        {Number(
                                            item.quantity || 0
                                        ).toFixed(2)}{" "}
                                        kg
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            item.subtotal || 0
                                        ).toFixed(2)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="delivery-empty-text">
                            No items available.
                        </p>
                    )}
                </div>

                <div className="delivery-order-footer">
                    <span>
                        Created:{" "}
                        {order.created_at
                            ? new Date(
                                  order.created_at
                              ).toLocaleString()
                            : "N/A"}
                    </span>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            type="button"
                            className="delivery-view-details-button"
                            onClick={() =>
                                handleViewOrderDetails(
                                    order
                                )
                            }
                        >
                            👁 View Details
                        </button>

                        {order.status === "SHIPPED" && (
                            <>
                                <span className="delivery-action-hint">
                                    🚚 Ready for delivery
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleMarkAsDelivered(
                                            order.id
                                        )
                                    }
                                    disabled={isUpdating}
                                    style={{
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "10px 16px",
                                        fontWeight: "600",
                                        cursor: isUpdating
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: isUpdating
                                            ? 0.7
                                            : 1,
                                    }}
                                >
                                    {isUpdating
                                        ? "Updating..."
                                        : "✅ Mark as Delivered"}
                                </button>
                            </>
                        )}

                        {order.status === "DELIVERED" && (
                            <span className="delivery-action-success">
                                ✅ Delivery completed
                            </span>
                        )}

                        {order.status === "CANCELLED" && (
                            <span className="delivery-action-cancelled">
                                ❌ Order cancelled
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================
    // DASHBOARD
    // =========================================================

    const renderDashboard = () => {
        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            DELIVERY OVERVIEW
                        </span>

                        <h2>
                            Welcome, {partnerName} 👋
                        </h2>

                        <p>
                            Manage your assigned deliveries
                            from one place.
                        </p>
                    </div>
                </div>

                <div className="delivery-stats">
                    <div className="delivery-stat-card">
                        <div className="delivery-stat-icon">
                            📦
                        </div>

                        <div>
                            <span>
                                Total Assigned
                            </span>

                            <strong>
                                {totalAssigned}
                            </strong>
                        </div>
                    </div>

                    <div className="delivery-stat-card">
                        <div className="delivery-stat-icon">
                            🚚
                        </div>

                        <div>
                            <span>
                                Active Deliveries
                            </span>

                            <strong>
                                {activeOrders.length}
                            </strong>
                        </div>
                    </div>

                    <div className="delivery-stat-card">
                        <div className="delivery-stat-icon">
                            ✅
                        </div>

                        <div>
                            <span>
                                Completed
                            </span>

                            <strong>
                                {completedOrders.length}
                            </strong>
                        </div>
                    </div>

                    <div className="delivery-stat-card">
                        <div className="delivery-stat-icon">
                            🔔
                        </div>

                        <div>
                            <span>
                                Unread Notifications
                            </span>

                            <strong>
                                {unreadCount}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="delivery-section">
                    <div className="delivery-section-header">
                        <div>
                            <span>
                                RECENT ASSIGNMENTS
                            </span>

                            <h3>
                                Assigned Orders
                            </h3>
                        </div>

                        <button
                            type="button"
                            className="delivery-outline-button"
                            onClick={() =>
                                setActivePage("orders")
                            }
                        >
                            View All
                        </button>
                    </div>

                    {loading ? (
                        <div className="delivery-loading">
                            Loading assigned orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="delivery-empty">
                            <div>📦</div>

                            <h3>
                                No orders assigned
                            </h3>

                            <p>
                                New delivery assignments
                                will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="delivery-order-list">
                            {orders
                                .slice(0, 3)
                                .map(renderOrderCard)}
                        </div>
                    )}
                </div>
            </>
        );
    };

    // =========================================================
    // ASSIGNED ORDERS
    // =========================================================

    const renderOrders = () => {
        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            DELIVERY MANAGEMENT
                        </span>

                        <h2>
                            Assigned Orders
                        </h2>

                        <p>
                            View every order assigned
                            to you.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="delivery-refresh-button"
                        onClick={fetchOrders}
                        disabled={loading}
                    >
                        🔄{" "}
                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                {message && (
                    <div className="delivery-message">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="delivery-loading">
                        Loading assigned orders...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="delivery-empty">
                        <div>📦</div>

                        <h3>
                            No assigned orders
                        </h3>

                        <p>
                            Orders assigned by the
                            administrator will appear
                            here.
                        </p>
                    </div>
                ) : (
                    <div className="delivery-order-list">
                        {orders.map(renderOrderCard)}
                    </div>
                )}
            </>
        );
    };

    // =========================================================
    // ACTIVE DELIVERIES
    // =========================================================

    const renderActiveDeliveries = () => {
        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            IN PROGRESS
                        </span>

                        <h2>
                            Active Deliveries
                        </h2>

                        <p>
                            Orders that are ready
                            for delivery.
                        </p>
                    </div>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="delivery-empty">
                        <div>🚚</div>

                        <h3>
                            No active deliveries
                        </h3>

                        <p>
                            SHIPPED orders will appear
                            here.
                        </p>
                    </div>
                ) : (
                    <div className="delivery-order-list">
                        {activeOrders.map(
                            renderOrderCard
                        )}
                    </div>
                )}
            </>
        );
    };

    // =========================================================
    // COMPLETED DELIVERIES
    // =========================================================

    const renderCompletedDeliveries = () => {
        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            DELIVERY HISTORY
                        </span>

                        <h2>
                            Completed Deliveries
                        </h2>

                        <p>
                            Successfully delivered
                            orders.
                        </p>
                    </div>
                </div>

                {completedOrders.length === 0 ? (
                    <div className="delivery-empty">
                        <div>✅</div>

                        <h3>
                            No completed deliveries
                        </h3>

                        <p>
                            Completed deliveries will
                            appear here.
                        </p>
                    </div>
                ) : (
                    <div className="delivery-order-list">
                        {completedOrders.map(
                            renderOrderCard
                        )}
                    </div>
                )}
            </>
        );
    };

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    const renderNotifications = () => {
        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            COMMUNICATIONS
                        </span>

                        <h2>
                            Notifications
                        </h2>

                        <p>
                            Stay updated about your
                            delivery assignments.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="delivery-refresh-button"
                        onClick={fetchNotifications}
                        disabled={
                            notificationsLoading
                        }
                    >
                        🔄{" "}
                        {notificationsLoading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                {notificationsLoading ? (
                    <div className="delivery-loading">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="delivery-empty">
                        <div>🔔</div>

                        <h3>
                            No notifications
                        </h3>

                        <p>
                            You are all caught up.
                        </p>
                    </div>
                ) : (
                    <div className="delivery-notification-list">
                        {notifications.map(
                            (notification) => (
                                <div
                                    key={
                                        notification.id
                                    }
                                    className={
                                        notification.is_read
                                            ? "delivery-notification read"
                                            : "delivery-notification unread"
                                    }
                                >
                                    <div className="delivery-notification-icon">
                                        {notification.notification_type ===
                                        "DELIVERY_ASSIGNED"
                                            ? "📦"
                                            : "🔔"}
                                    </div>

                                    <div className="delivery-notification-content">
                                        <div className="delivery-notification-top">
                                            <h3>
                                                {
                                                    notification.title
                                                }
                                            </h3>

                                            {!notification.is_read && (
                                                <span>
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        <p>
                                            {
                                                notification.message
                                            }
                                        </p>

                                        <small>
                                            {notification.created_at
                                                ? new Date(
                                                      notification.created_at
                                                  ).toLocaleString()
                                                : ""}
                                        </small>

                                        {!notification.is_read && (
                                            <button
                                                type="button"
                                                className="delivery-read-button"
                                                onClick={() =>
                                                    handleMarkNotificationRead(
                                                        notification.id
                                                    )
                                                }
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </>
        );
    };

    // =========================================================
    // MY PROFILE
    // =========================================================

    const renderProfile = () => {
        const user = profile || {};

        const username =
            user.username ||
            partnerName ||
            "Delivery Partner";

        const email =
            user.email ||
            "Not provided";

        const phone =
            user.phone ||
            "Not provided";

        const userId =
            user.id !== undefined &&
            user.id !== null
                ? user.id
                : "N/A";

        const accountStatus =
            user.is_active === false
                ? "Inactive"
                : "Active";

        return (
            <>
                <div className="delivery-page-heading">
                    <div>
                        <span>
                            ACCOUNT
                        </span>

                        <h2>
                            My Profile
                        </h2>

                        <p>
                            View and manage your delivery
                            partner account information.
                        </p>
                    </div>

                    {!isEditingProfile && (
                        <button
                            type="button"
                            className="delivery-refresh-button"
                            onClick={fetchProfile}
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>

                {profileMessage && (
                    <div className="delivery-message">
                        ✅ {profileMessage}
                    </div>
                )}

                {profileError && (
                    <div className="delivery-message">
                        ❌ {profileError}
                    </div>
                )}

                {!isEditingProfile ? (
                    <div className="delivery-profile-page-card">
                        <div className="delivery-profile-page-header">
                            <div
                                className="delivery-profile-page-avatar"
                                style={{
                                    flexShrink: 0,
                                    width: "76px",
                                    minWidth: "76px",
                                    height: "76px",
                                    minHeight: "76px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {username
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="delivery-profile-page-heading-info">
                                <span className="delivery-profile-page-label">
                                    DELIVERY PARTNER
                                </span>

                                <h3>
                                    {username}
                                </h3>

                                <p>
                                    {email}
                                </p>
                            </div>

                            <span
                                className={
                                    accountStatus ===
                                    "Active"
                                        ? "delivery-profile-active"
                                        : "delivery-profile-inactive"
                                }
                            >
                                ● {accountStatus}
                            </span>
                        </div>

                        <div className="delivery-profile-info-grid">
                            <div className="delivery-profile-info-box">
                                <span>
                                    User ID
                                </span>

                                <strong>
                                    {userId}
                                </strong>
                            </div>

                            <div className="delivery-profile-info-box">
                                <span>
                                    Username
                                </span>

                                <strong>
                                    {username}
                                </strong>
                            </div>

                            <div className="delivery-profile-info-box">
                                <span>
                                    Email
                                </span>

                                <strong>
                                    {email}
                                </strong>
                            </div>

                            <div className="delivery-profile-info-box">
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {phone}
                                </strong>
                            </div>

                            <div className="delivery-profile-info-box">
                                <span>
                                    Role
                                </span>

                                <strong>
                                    Delivery Partner
                                </strong>
                            </div>

                            <div className="delivery-profile-info-box">
                                <span>
                                    Account Status
                                </span>

                                <strong>
                                    {accountStatus}
                                </strong>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "flex-end",
                                marginTop: "24px",
                            }}
                        >
                            <button
                                type="button"
                                className="delivery-view-details-button"
                                onClick={
                                    handleEditProfile
                                }
                                style={{
                                    padding:
                                        "11px 20px",
                                }}
                            >
                                ✏️ Edit Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* EDIT PROFILE */}

                        <div className="delivery-profile-page-card">
                            <div className="delivery-profile-page-header">
                                <div
                                    className="delivery-profile-page-avatar"
                                    style={{
                                        flexShrink: 0,
                                        width: "76px",
                                        minWidth: "76px",
                                        height: "76px",
                                        minHeight: "76px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {(
                                        profileForm.username ||
                                        partnerName ||
                                        "D"
                                    )
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="delivery-profile-page-heading-info">
                                    <span className="delivery-profile-page-label">
                                        EDIT PROFILE
                                    </span>

                                    <h3>
                                        Update Your Information
                                    </h3>

                                    <p>
                                        Change your account
                                        details below.
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={
                                    handleSaveProfile
                                }
                                style={{
                                    marginTop: "28px",
                                }}
                            >
                                <div
                                    className="delivery-profile-info-grid"
                                    style={{
                                        marginTop: 0,
                                    }}
                                >
                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="delivery-profile-username"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            Username
                                        </label>

                                        <input
                                            id="delivery-profile-username"
                                            type="text"
                                            name="username"
                                            value={
                                                profileForm.username
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            disabled={
                                                profileSaving
                                            }
                                            autoComplete="username"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>

                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="delivery-profile-email"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="delivery-profile-email"
                                            type="email"
                                            name="email"
                                            value={
                                                profileForm.email
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            disabled={
                                                profileSaving
                                            }
                                            autoComplete="email"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>

                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="delivery-profile-phone"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            Phone
                                        </label>

                                        <input
                                            id="delivery-profile-phone"
                                            type="tel"
                                            name="phone"
                                            value={
                                                profileForm.phone
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            disabled={
                                                profileSaving
                                            }
                                            autoComplete="tel"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>

                                    <div className="delivery-profile-info-box">
                                        <span>
                                            Role
                                        </span>

                                        <strong>
                                            Delivery Partner
                                        </strong>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "flex-end",
                                        alignItems:
                                            "center",
                                        gap: "12px",
                                        flexWrap:
                                            "wrap",
                                        marginTop: "24px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        className="delivery-modal-secondary-button"
                                        onClick={
                                            handleCancelProfileEdit
                                        }
                                        disabled={
                                            profileSaving
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="delivery-modal-deliver-button"
                                        disabled={
                                            profileSaving
                                        }
                                    >
                                        {profileSaving
                                            ? "Saving..."
                                            : "💾 Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* CHANGE PASSWORD */}

                        <div
                            className="delivery-profile-page-card"
                            style={{
                                marginTop: "24px",
                            }}
                        >
                            <div className="delivery-profile-page-header">
                                <div
                                    className="delivery-profile-page-avatar"
                                    style={{
                                        flexShrink: 0,
                                        width: "76px",
                                        minWidth: "76px",
                                        height: "76px",
                                        minHeight: "76px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    🔐
                                </div>

                                <div className="delivery-profile-page-heading-info">
                                    <span className="delivery-profile-page-label">
                                        SECURITY
                                    </span>

                                    <h3>
                                        Change Password
                                    </h3>

                                    <p>
                                        Update your account
                                        password securely.
                                    </p>
                                </div>
                            </div>

                            {passwordMessage && (
                                <div
                                    className="delivery-message"
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >
                                    ✅ {passwordMessage}
                                </div>
                            )}

                            {passwordError && (
                                <div
                                    className="delivery-message"
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >
                                    ❌ {passwordError}
                                </div>
                            )}

                            <form
                                onSubmit={
                                    handleChangePassword
                                }
                                style={{
                                    marginTop: "24px",
                                }}
                            >
                                <div
                                    className="delivery-profile-info-grid"
                                    style={{
                                        marginTop: 0,
                                    }}
                                >
                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="current-password"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            Current Password
                                        </label>

                                        <input
                                            id="current-password"
                                            type="password"
                                            name="current_password"
                                            value={
                                                passwordForm.current_password
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            disabled={
                                                passwordSaving
                                            }
                                            autoComplete="current-password"
                                            placeholder="Enter current password"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>

                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="new-password"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            New Password
                                        </label>

                                        <input
                                            id="new-password"
                                            type="password"
                                            name="new_password"
                                            value={
                                                passwordForm.new_password
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            disabled={
                                                passwordSaving
                                            }
                                            autoComplete="new-password"
                                            placeholder="Minimum 8 characters"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>

                                    <div className="delivery-profile-info-box">
                                        <label
                                            htmlFor="confirm-password"
                                            style={{
                                                display:
                                                    "block",
                                                marginBottom:
                                                    "8px",
                                            }}
                                        >
                                            Confirm New Password
                                        </label>

                                        <input
                                            id="confirm-password"
                                            type="password"
                                            name="confirm_password"
                                            value={
                                                passwordForm.confirm_password
                                            }
                                            onChange={
                                                handlePasswordChange
                                            }
                                            disabled={
                                                passwordSaving
                                            }
                                            autoComplete="new-password"
                                            placeholder="Re-enter new password"
                                            style={{
                                                width:
                                                    "100%",
                                                boxSizing:
                                                    "border-box",
                                                padding:
                                                    "11px 12px",
                                                border:
                                                    "1px solid #d9e2dc",
                                                borderRadius:
                                                    "8px",
                                                outline:
                                                    "none",
                                                fontSize:
                                                    "14px",
                                                background:
                                                    "#ffffff",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "flex-end",
                                        marginTop: "24px",
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="delivery-modal-deliver-button"
                                        disabled={
                                            passwordSaving
                                        }
                                    >
                                        {passwordSaving
                                            ? "Changing Password..."
                                            : "🔐 Change Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}

                {/* DELIVERY STATISTICS */}

                <div className="delivery-section">
                    <div className="delivery-section-header">
                        <div>
                            <span>
                                DELIVERY PERFORMANCE
                            </span>

                            <h3>
                                My Delivery Statistics
                            </h3>
                        </div>
                    </div>

                    <div className="delivery-stats">
                        <div className="delivery-stat-card">
                            <div className="delivery-stat-icon">
                                📦
                            </div>

                            <div>
                                <span>
                                    Total Assigned
                                </span>

                                <strong>
                                    {totalAssigned}
                                </strong>
                            </div>
                        </div>

                        <div className="delivery-stat-card">
                            <div className="delivery-stat-icon">
                                🚚
                            </div>

                            <div>
                                <span>
                                    Active Deliveries
                                </span>

                                <strong>
                                    {activeOrders.length}
                                </strong>
                            </div>
                        </div>

                        <div className="delivery-stat-card">
                            <div className="delivery-stat-icon">
                                ✅
                            </div>

                            <div>
                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {completedOrders.length}
                                </strong>
                            </div>
                        </div>

                        <div className="delivery-stat-card">
                            <div className="delivery-stat-icon">
                                🔔
                            </div>

                            <div>
                                <span>
                                    Unread Notifications
                                </span>

                                <strong>
                                    {unreadCount}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // =========================================================
    // MAIN CONTENT
    // =========================================================

    const renderMainContent = () => {
        switch (activePage) {
            case "orders":
                return renderOrders();

            case "active":
                return renderActiveDeliveries();

            case "completed":
                return renderCompletedDeliveries();

            case "notifications":
                return renderNotifications();

            case "profile":
                return renderProfile();

            case "dashboard":
            default:
                return renderDashboard();
        }
    };

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="delivery-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="delivery-header">
                <div className="delivery-brand-section">
                    <div className="delivery-brand-icon">
                        🌱
                    </div>

                    <div>
                        <h1>
                            AgriConnect AI
                        </h1>

                        <p>
                            Farmer-to-Customer Marketplace
                        </p>
                    </div>
                </div>

                <div className="delivery-header-right">

                    {/* HEADER NOTIFICATIONS */}

                    <button
                        type="button"
                        className="delivery-header-notification"
                        onClick={() => {
                            setActivePage(
                                "notifications"
                            );

                            fetchNotifications();
                        }}
                        aria-label="Open notifications"
                    >
                        🔔

                        {unreadCount > 0 && (
                            <span className="delivery-notification-badge">
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* HEADER PROFILE */}

                    <button
                        type="button"
                        className="delivery-profile"
                        onClick={() =>
                            setActivePage("profile")
                        }
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: "12px",
                            minWidth: "180px",
                            width: "auto",
                            height: "52px",
                            padding: "6px 12px 6px 6px",
                            margin: 0,
                            border: "1px solid #e1e8e3",
                            borderRadius: "12px",
                            background: "#ffffff",
                            boxSizing: "border-box",
                            flexShrink: 0,
                            overflow: "hidden",
                            cursor: "pointer",
                        }}
                    >
                        <div
                            className="delivery-avatar"
                            style={{
                                width: "40px",
                                minWidth: "40px",
                                height: "40px",
                                minHeight: "40px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: "16px",
                                fontWeight: "700",
                                lineHeight: "1",
                            }}
                        >
                            {partnerName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "center",
                                minWidth: 0,
                                flex: 1,
                                overflow: "hidden",
                                textAlign: "left",
                            }}
                        >
                            <strong
                                style={{
                                    display: "block",
                                    width: "100%",
                                    fontSize: "14px",
                                    lineHeight: "18px",
                                    fontWeight: "700",
                                    color: "#26352b",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {partnerName}
                            </strong>

                            <span
                                style={{
                                    display: "block",
                                    width: "100%",
                                    marginTop: "2px",
                                    fontSize: "11px",
                                    lineHeight: "15px",
                                    color: "#7a877e",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                Delivery Partner
                            </span>
                        </div>
                    </button>
                </div>
            </header>

            {/* =================================================
                BODY
            ================================================= */}

            <div className="delivery-layout">

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside
                    className="delivery-sidebar"
                    style={{
                        position: "static",
                        top: "auto",
                        left: "auto",
                        margin: 0,
                        transform: "none",
                    }}
                >
                    <div className="delivery-sidebar-title">
                        DELIVERY MENU
                    </div>

                    <nav>
                        {MENU_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={
                                    activePage ===
                                    item.id
                                        ? "delivery-sidebar-item active"
                                        : "delivery-sidebar-item"
                                }
                                onClick={() => {
                                    setActivePage(
                                        item.id
                                    );

                                    if (
                                        item.id ===
                                        "notifications"
                                    ) {
                                        fetchNotifications();
                                    }

                                    if (
                                        item.id ===
                                        "profile"
                                    ) {
                                        setProfileMessage(
                                            ""
                                        );

                                        setProfileError(
                                            ""
                                        );

                                        setPasswordMessage(
                                            ""
                                        );

                                        setPasswordError(
                                            ""
                                        );

                                        setIsEditingProfile(
                                            false
                                        );

                                        fetchProfile();
                                    }
                                }}
                            >
                                <span className="delivery-sidebar-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>

                                {item.id ===
                                    "notifications" &&
                                    unreadCount > 0 && (
                                        <span className="delivery-sidebar-badge">
                                            {unreadCount >
                                            99
                                                ? "99+"
                                                : unreadCount}
                                        </span>
                                    )}
                            </button>
                        ))}
                    </nav>

                    {/* LOGOUT */}

                    <div className="delivery-sidebar-bottom">
                        <button
                            type="button"
                            className="delivery-sidebar-item logout"
                            onClick={onLogout}
                        >
                            <span className="delivery-sidebar-icon">
                                🚪
                            </span>

                            <span>
                                Logout
                            </span>
                        </button>
                    </div>
                </aside>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main
                    className="delivery-main"
                    style={{
                        position: "static",
                        top: "auto",
                        margin: 0,
                        transform: "none",
                    }}
                >
                    <div
                        className="delivery-main-content"
                        style={{
                            position: "relative",
                            top: "-30px",
                        }}
                    >
                        <div className="delivery-dashboard-status">
                            <span className="delivery-status-dot"></span>

                            Delivery Partner Dashboard
                        </div>

                        {renderMainContent()}
                    </div>
                </main>
            </div>

            {/* =================================================
                ORDER DETAILS MODAL
            ================================================= */}

            {renderOrderDetailsModal()}
        </div>
    );
}

export default DeliveryPartnerDashboard;