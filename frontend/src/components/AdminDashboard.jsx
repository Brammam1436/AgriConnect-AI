import { useEffect, useState } from "react";
import api from "../api/api";
import "./AdminDashboard.css";

function AdminDashboard({ onLogout }) {
    // ==========================================
    // NAVIGATION
    // ==========================================

    const [activePage, setActivePage] = useState("dashboard");

    // ==========================================
    // DASHBOARD STATISTICS
    // ==========================================

    const [stats, setStats] = useState({
        total_users: 0,
        total_farmers: 0,
        total_customers: 0,
        total_products: 0,
        total_orders: 0,
        total_payments: 0,
    });

    // ==========================================
    // USERS
    // ==========================================

    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const [editingUser, setEditingUser] = useState(null);

    const [editForm, setEditForm] = useState({
        email: "",
        phone: "",
        role: "",
    });

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    const [editingProduct, setEditingProduct] = useState(null);

    const [productEditForm, setProductEditForm] = useState({
        name: "",
        category: "",
        description: "",
        price_per_kg: "",
        available_quantity: "",
        unit: "",
        is_available: true,
    });

    // ==========================================
    // ORDERS
    // ==========================================

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

    const [orderStatusLoading, setOrderStatusLoading] = useState(false);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState("");

    // ==========================================
    // PAYMENTS
    // ==========================================

    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    // ==========================================
    // ADMIN PROFILE
    // ==========================================

    const [adminProfile, setAdminProfile] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);

    const [profileEditing, setProfileEditing] = useState(false);

    const [profileForm, setProfileForm] = useState({
        username: "",
        email: "",
        phone: "",
    });

    const [profileUpdateLoading, setProfileUpdateLoading] =
        useState(false);

    // ==========================================
    // PASSWORD
    // ==========================================

    const [passwordChanging, setPasswordChanging] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [passwordUpdateLoading, setPasswordUpdateLoading] =
        useState(false);

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [notificationsLoading, setNotificationsLoading] =
        useState(false);

    // ==========================================
    // GENERAL LOADING
    // ==========================================

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // ==========================================
    // MESSAGE
    // ==========================================

    const [message, setMessage] = useState("");

    // ==========================================
    // MENU ITEMS
    // ==========================================

    const MENU_ITEMS = [
        {
            id: "dashboard",
            icon: "🏠",
            label: "Dashboard",
        },
        {
            id: "users",
            icon: "👥",
            label: "Users",
        },
        {
            id: "products",
            icon: "🥕",
            label: "Products",
        },
        {
            id: "orders",
            icon: "📦",
            label: "Orders",
        },
        {
            id: "payments",
            icon: "💳",
            label: "Payments",
        },
        {
            id: "notifications",
            icon: "🔔",
            label: "Notifications",
        },
    ];

    // ==========================================
    // HELPER - EXTRACT LIST FROM API RESPONSE
    // ==========================================

    const extractList = (data, keys = []) => {
        if (Array.isArray(data)) {
            return data;
        }

        for (const key of keys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        if (Array.isArray(data?.results)) {
            return data.results;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
        }

        return [];
    };

    // ==========================================
    // FETCH DASHBOARD STATS
    // ==========================================

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get(
                "/api/auth/admin/dashboard/"
            );

            console.log(
                "ADMIN DASHBOARD API:",
                response.data
            );

            const data = response.data || {};

            setStats({
                total_users:
                    Number(data.total_users ?? 0),

                total_farmers:
                    Number(data.total_farmers ?? 0),

                total_customers:
                    Number(data.total_customers ?? 0),

                total_products:
                    Number(data.total_products ?? 0),

                total_orders:
                    Number(data.total_orders ?? 0),

                total_payments:
                    Number(data.total_payments ?? 0),
            });
        } catch (error) {
            console.error(
                "Admin dashboard stats error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load admin dashboard statistics."
            );
        }
    };

    // ==========================================
    // FETCH USERS
    // ==========================================
    // IMPORTANT:
    // This function was missing in the previous file.
    // ==========================================

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);

            const response = await api.get(
                "/api/auth/admin/users/"
            );

            console.log(
                "ADMIN USERS API:",
                response.data
            );

            const userData = extractList(
                response.data,
                ["users", "data"]
            );

            console.log(
                "ADMIN USERS LIST:",
                userData
            );

            setUsers(userData);
        } catch (error) {
            console.error(
                "Fetch users error:",
                error
            );

            setUsers([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load users."
            );
        } finally {
            setUsersLoading(false);
        }
    };

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);

            const response = await api.get(
                "/api/auth/admin/products/"
            );

            console.log(
                "ADMIN PRODUCTS API:",
                response.data
            );

            const productData = extractList(
                response.data,
                ["products", "data"]
            );

            console.log(
                "ADMIN PRODUCTS LIST:",
                productData
            );

            setProducts(productData);
        } catch (error) {
            console.error(
                "Fetch products error:",
                error
            );

            setProducts([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load products."
            );
        } finally {
            setProductsLoading(false);
        }
    };

    // ==========================================
    // FETCH ORDERS
    // ==========================================

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);

            const response = await api.get(
                "/api/auth/admin/orders/"
            );

            console.log(
                "ADMIN ORDERS API:",
                response.data
            );

            const orderData = extractList(
                response.data,
                ["orders", "data"]
            );

            console.log(
                "ADMIN ORDERS LIST:",
                orderData
            );

            setOrders(orderData);
        } catch (error) {
            console.error(
                "Fetch orders error:",
                error
            );

            setOrders([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load orders."
            );
        } finally {
            setOrdersLoading(false);
        }
    };

    // ==========================================
    // FETCH PAYMENTS
    // ==========================================

    const fetchPayments = async () => {
        try {
            setPaymentsLoading(true);

            const response = await api.get(
                "/api/auth/admin/payments/"
            );

            console.log(
                "ADMIN PAYMENTS API:",
                response.data
            );

            const paymentData = extractList(
                response.data,
                ["payments", "data"]
            );

            console.log(
                "ADMIN PAYMENTS LIST:",
                paymentData
            );

            setPayments(paymentData);
        } catch (error) {
            console.error(
                "Fetch payments error:",
                error
            );

            setPayments([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load payments."
            );
        } finally {
            setPaymentsLoading(false);
        }
    };

    // ==========================================
    // FETCH ADMIN PROFILE
    // ==========================================

    const fetchAdminProfile = async () => {
        try {
            const response = await api.get(
                "/api/auth/me/"
            );

            console.log(
                "ADMIN PROFILE API:",
                response.data
            );

            const user =
                response.data?.user ||
                response.data?.data?.user ||
                response.data?.data ||
                response.data;

            if (user && user.id) {
                setAdminProfile(user);

                setProfileForm({
                    username: user.username || "",
                    email: user.email || "",
                    phone: user.phone || "",
                });

                localStorage.setItem(
                    "current_username",
                    user.username || "Admin"
                );
            } else {
                console.warn(
                    "Admin profile data not found:",
                    response.data
                );
            }
        } catch (error) {
            console.error(
                "Admin profile error:",
                error
            );
        }
    };

    // ==========================================
    // FETCH NOTIFICATIONS
    // ==========================================

    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);

            const response = await api.get(
                "/api/notifications/"
            );

            console.log(
                "ADMIN NOTIFICATIONS API:",
                response.data
            );

            const notificationData = extractList(
                response.data,
                ["notifications", "data"]
            );

            setNotifications(notificationData);

            const unreadCount = notificationData.filter(
                (notification) =>
                    notification.is_read === false ||
                    notification.is_read === 0
            ).length;

            setUnreadNotifications(unreadCount);
        } catch (error) {
            console.error(
                "Fetch notifications error:",
                error
            );
        } finally {
            setNotificationsLoading(false);
        }
    };

    // ==========================================
    // NOTIFICATION POLLING
    // ==========================================

    useEffect(() => {
        const notificationInterval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => {
            clearInterval(notificationInterval);
        };
    }, []);

    // ==========================================
    // MARK NOTIFICATION READ
    // ==========================================

    const handleMarkNotificationRead = async (
        notificationId
    ) => {
        try {
            await api.put(
                `/api/notifications/${notificationId}/read/`
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === notificationId
                        ? {
                              ...notification,
                              is_read: true,
                          }
                        : notification
                )
            );

            setUnreadNotifications((previous) =>
                Math.max(previous - 1, 0)
            );
        } catch (error) {
            console.error(
                "Mark notification read error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to mark notification as read."
            );
        }
    };

    // ==========================================
    // MARK ALL NOTIFICATIONS READ
    // ==========================================

    const handleMarkAllNotificationsRead = async () => {
        try {
            setActionLoading(true);

            await api.put(
                "/api/notifications/read-all/"
            );

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );

            setUnreadNotifications(0);

            setMessage(
                "✅ All notifications marked as read."
            );
        } catch (error) {
            console.error(
                "Mark all notifications read error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to mark all notifications as read."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        let isMounted = true;

        const loadAdminDashboard = async () => {
            try {
                await Promise.allSettled([
                    fetchDashboardStats(),
                    fetchUsers(),
                    fetchProducts(),
                    fetchOrders(),
                    fetchPayments(),
                    fetchAdminProfile(),
                    fetchNotifications(),
                ]);

                if (isMounted) {
                    setLoading(false);
                }
            } catch (error) {
                console.error(
                    "Admin dashboard initialization error:",
                    error
                );

                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadAdminDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    // ==========================================
    // NAVIGATION
    // ==========================================

    const handleNavigation = (page) => {
        setActivePage(page);
        setMessage("");

        setEditingUser(null);
        setEditingProduct(null);
        setSelectedOrder(null);
        setSelectedOrderStatus("");
    };

    // ==========================================
    // EDIT USER
    // ==========================================

    const handleEditClick = (user) => {
        setEditingUser(user);

        setEditForm({
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "",
        });

        setMessage("");
    };

    const handleEditChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // UPDATE USER
    // ==========================================

    const handleUpdateUser = async (event) => {
        event.preventDefault();

        if (!editingUser) {
            return;
        }

        try {
            setActionLoading(true);

            await api.put(
                `/api/auth/admin/users/${editingUser.id}/`,
                editForm
            );

            setMessage(
                "✅ User updated successfully."
            );

            setEditingUser(null);

            setEditForm({
                email: "",
                phone: "",
                role: "",
            });

            await fetchUsers();
            await fetchDashboardStats();
        } catch (error) {
            console.error(
                "Update user error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to update user."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // CANCEL USER EDIT
    // ==========================================

    const handleCancelEdit = () => {
        setEditingUser(null);

        setEditForm({
            email: "",
            phone: "",
            role: "",
        });

        setMessage("");
    };

    // ==========================================
    // DELETE USER
    // ==========================================

    const handleDeleteUser = async (user) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete user "${user.username}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);

            await api.delete(
                `/api/auth/admin/users/${user.id}/`
            );

            setMessage(
                `✅ User "${user.username}" deleted successfully.`
            );

            if (
                editingUser &&
                editingUser.id === user.id
            ) {
                setEditingUser(null);

                setEditForm({
                    email: "",
                    phone: "",
                    role: "",
                });
            }

            await fetchUsers();
            await fetchDashboardStats();
        } catch (error) {
            console.error(
                "Delete user error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to delete user."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // EDIT PRODUCT
    // ==========================================

    const handleProductEditClick = (product) => {
        setEditingProduct(product);

        setProductEditForm({
            name: product.name || "",
            category: product.category || "",
            description: product.description || "",
            price_per_kg:
                product.price_per_kg ?? "",
            available_quantity:
                product.available_quantity ?? "",
            unit: product.unit || "kg",
            is_available:
                product.is_available ?? true,
        });

        setMessage("");
    };

    const handleProductEditChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setProductEditForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    // ==========================================
    // UPDATE PRODUCT
    // ==========================================

    const handleUpdateProduct = async (event) => {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        try {
            setActionLoading(true);

            await api.put(
                `/api/auth/admin/products/${editingProduct.id}/`,
                productEditForm
            );

            setMessage(
                "✅ Product updated successfully."
            );

            setEditingProduct(null);

            await fetchProducts();
            await fetchDashboardStats();
        } catch (error) {
            console.error(
                "Update product error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to update product."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    const handleDeleteProduct = async (product) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete product "${product.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);

            await api.delete(
                `/api/auth/admin/products/${product.id}/`
            );

            setMessage(
                `✅ Product "${product.name}" deleted successfully.`
            );

            if (
                editingProduct &&
                editingProduct.id === product.id
            ) {
                setEditingProduct(null);
            }

            await fetchProducts();
            await fetchDashboardStats();
        } catch (error) {
            console.error(
                "Delete product error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to delete product."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // VIEW ORDER
    // ==========================================

    const handleViewOrder = async (orderId) => {
        try {
            setOrderDetailsLoading(true);
            setMessage("");

            const response = await api.get(
                `/api/auth/admin/orders/${orderId}/`
            );

            console.log(
                "ADMIN ORDER DETAILS API:",
                response.data
            );

            const orderData =
                response.data?.order ||
                response.data;

            setSelectedOrder(orderData);

            setSelectedOrderStatus(
                orderData?.status || ""
            );
        } catch (error) {
            console.error(
                "View order error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Failed to fetch order details."
            );
        } finally {
            setOrderDetailsLoading(false);
        }
    };

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    const handleUpdateOrderStatus = async () => {
        if (!selectedOrder) {
            return;
        }

        if (!selectedOrderStatus) {
            setMessage(
                "Please select an order status."
            );
            return;
        }

        if (
            selectedOrderStatus ===
            selectedOrder.status
        ) {
            setMessage(
                "Please select a different status."
            );
            return;
        }

        try {
            setOrderStatusLoading(true);
            setMessage("");

            const response = await api.put(
                `/api/orders/${selectedOrder.id}/status/`,
                {
                    status: selectedOrderStatus,
                }
            );

            const data = response.data;

            const updatedOrder =
                data?.order ||
                data?.updated_order ||
                data;

            const finalStatus =
                updatedOrder?.status ||
                selectedOrderStatus;

            setSelectedOrder(
                (previousOrder) => ({
                    ...previousOrder,
                    ...updatedOrder,
                    status: finalStatus,
                })
            );

            setSelectedOrderStatus(
                finalStatus
            );

            setMessage(
                "✅ Order status updated successfully."
            );

            await fetchOrders();
            await fetchDashboardStats();
            await fetchNotifications();
        } catch (error) {
            console.error(
                "Update order status error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to update order status."
            );
        } finally {
            setOrderStatusLoading(false);
        }
    };

    // ==========================================
    // PROFILE FORM
    // ==========================================

    const handleProfileFormChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setProfileForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // UPDATE ADMIN PROFILE
    // ==========================================

    const handleUpdateAdminProfile = async (
        event
    ) => {
        event.preventDefault();

        try {
            setProfileUpdateLoading(true);
            setMessage("");

            const response = await api.put(
                "/api/auth/me/",
                {
                    username:
                        profileForm.username,
                    email:
                        profileForm.email,
                    phone:
                        profileForm.phone,
                }
            );

            console.log(
                "UPDATED ADMIN PROFILE:",
                response.data
            );

            const updatedProfile =
                response.data?.user ||
                response.data?.data?.user ||
                response.data;

            setAdminProfile(
                updatedProfile
            );

            setProfileForm({
                username:
                    updatedProfile?.username ||
                    "",
                email:
                    updatedProfile?.email ||
                    "",
                phone:
                    updatedProfile?.phone ||
                    "",
            });

            if (updatedProfile?.username) {
                localStorage.setItem(
                    "current_username",
                    updatedProfile.username
                );
            }

            setProfileEditing(false);

            setMessage(
                "✅ Admin profile updated successfully."
            );
        } catch (error) {
            console.error(
                "Update admin profile error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to update admin profile."
            );
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    // ==========================================
    // PASSWORD FORM
    // ==========================================

    const handlePasswordFormChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setPasswordForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // CHANGE ADMIN PASSWORD
    // ==========================================

    const handleChangeAdminPassword = async (
        event
    ) => {
        event.preventDefault();

        if (
            !passwordForm.old_password ||
            !passwordForm.new_password ||
            !passwordForm.confirm_password
        ) {
            setMessage(
                "Please fill all password fields."
            );
            return;
        }

        if (
            passwordForm.new_password !==
            passwordForm.confirm_password
        ) {
            setMessage(
                "New password and confirm password do not match."
            );
            return;
        }

        if (
            passwordForm.new_password.length <
            8
        ) {
            setMessage(
                "New password must contain at least 8 characters."
            );
            return;
        }

        try {
            setPasswordUpdateLoading(true);
            setMessage("");

            await api.post(
                "/api/auth/change-password/",
                {
                    old_password:
                        passwordForm.old_password,

                    new_password:
                        passwordForm.new_password,

                    confirm_password:
                        passwordForm.confirm_password,
                }
            );

            setPasswordForm({
                old_password: "",
                new_password: "",
                confirm_password: "",
            });

            setPasswordChanging(false);

            setMessage(
                "✅ Password changed successfully."
            );
        } catch (error) {
            console.error(
                "Change admin password error:",
                error
            );

            const errorData =
                error.response?.data;

            setMessage(
                errorData?.detail ||
                    errorData?.error ||
                    errorData?.old_password?.[0] ||
                    errorData?.new_password?.[0] ||
                    errorData?.confirm_password?.[0] ||
                    "Unable to change password."
            );
        } finally {
            setPasswordUpdateLoading(false);
        }
    };

    // ==========================================
    // STAT CARD
    // ==========================================

    const StatCard = ({
        icon,
        title,
        value,
    }) => {
        return (
            <div className="admin-stat-card">
                <div className="admin-stat-icon">
                    {icon}
                </div>

                <div className="admin-stat-content">
                    <span>{title}</span>

                    <strong>
                        {value}
                    </strong>
                </div>
            </div>
        );
    };

    // ==========================================
    // DASHBOARD PAGE
    // ==========================================

    const renderDashboard = () => {
        return (
            <>
                <div className="admin-welcome-card">
                    <div>
                        <span className="admin-welcome-label">
                            ADMIN PANEL
                        </span>

                        <h1>
                            Welcome back,{" "}
                            {adminProfile?.username ||
                                "Admin"} 👋
                        </h1>

                        <p>
                            Manage your AgriConnect AI
                            marketplace from one place.
                        </p>
                    </div>

                    <div className="admin-welcome-icon">
                        🌱
                    </div>
                </div>

                <div className="admin-stats-grid">
                    <StatCard
                        icon="👥"
                        title="Total Users"
                        value={
                            stats.total_users
                        }
                    />

                    <StatCard
                        icon="👨‍🌾"
                        title="Total Farmers"
                        value={
                            stats.total_farmers
                        }
                    />

                    <StatCard
                        icon="🛒"
                        title="Total Customers"
                        value={
                            stats.total_customers
                        }
                    />

                    <StatCard
                        icon="🥕"
                        title="Total Products"
                        value={
                            stats.total_products
                        }
                    />

                    <StatCard
                        icon="📦"
                        title="Total Orders"
                        value={
                            stats.total_orders
                        }
                    />

                    <StatCard
                        icon="💳"
                        title="Total Payments"
                        value={
                            stats.total_payments
                        }
                    />
                </div>

                <div className="admin-section">
                    <div className="admin-section-header">
                        <div>
                            <span className="admin-section-label">
                                SYSTEM OVERVIEW
                            </span>

                            <h2>
                                Marketplace Management
                            </h2>
                        </div>
                    </div>

                    <div className="admin-overview-grid">
                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "users"
                                )
                            }
                        >
                            <span>👥</span>

                            <div>
                                <strong>
                                    User Management
                                </strong>

                                <small>
                                    Manage customers,
                                    farmers and users
                                </small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "products"
                                )
                            }
                        >
                            <span>🥕</span>

                            <div>
                                <strong>
                                    Product Management
                                </strong>

                                <small>
                                    Manage marketplace
                                    products
                                </small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "orders"
                                )
                            }
                        >
                            <span>📦</span>

                            <div>
                                <strong>
                                    Order Management
                                </strong>

                                <small>
                                    Track and update
                                    customer orders
                                </small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "payments"
                                )
                            }
                        >
                            <span>💳</span>

                            <div>
                                <strong>
                                    Payment Management
                                </strong>

                                <small>
                                    Monitor marketplace
                                    payments
                                </small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "notifications"
                                )
                            }
                        >
                            <span>🔔</span>

                            <div>
                                <strong>
                                    Notifications
                                </strong>

                                <small>
                                    View system and
                                    marketplace alerts
                                </small>
                            </div>
                        </button>
                    </div>
                </div>
            </>
        );
    };

    // ==========================================
    // USERS PAGE
    // ==========================================

    const renderUsers = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            ADMINISTRATION
                        </span>

                        <h1>
                            👥 User Management
                        </h1>

                        <p>
                            View and manage registered
                            AgriConnect AI users.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    {usersLoading ? (
                        <div className="admin-empty-state">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-empty-state">
                            No users found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>
                                            Username
                                        </th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map(
                                        (user) => (
                                            <tr
                                                key={
                                                    user.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        user.id
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            user.username
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        user.email ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        user.phone ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    <span className="role-badge">
                                                        {
                                                            user.role
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="admin-action-buttons">
                                                        <button
                                                            type="button"
                                                            className="admin-edit-button"
                                                            onClick={() =>
                                                                handleEditClick(
                                                                    user
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admin-delete-button"
                                                            onClick={() =>
                                                                handleDeleteUser(
                                                                    user
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {editingUser &&
                    renderEditUser()}
            </>
        );
    };

    // ==========================================
    // EDIT USER
    // ==========================================

    const renderEditUser = () => {
        return (
            <div className="admin-edit-section">
                <div className="admin-edit-header">
                    <div>
                        <span>
                            USER ACCOUNT
                        </span>

                        <h2>
                            ✏️ Edit User
                        </h2>
                    </div>
                </div>

                <form
                    onSubmit={
                        handleUpdateUser
                    }
                    className="admin-form-grid"
                >
                    <div className="admin-form-group">
                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={
                                editingUser.username
                            }
                            disabled
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={
                                editForm.email
                            }
                            onChange={
                                handleEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Phone
                        </label>

                        <input
                            type="text"
                            name="phone"
                            value={
                                editForm.phone
                            }
                            onChange={
                                handleEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Role
                        </label>

                        <select
                            name="role"
                            value={
                                editForm.role
                            }
                            onChange={
                                handleEditChange
                            }
                        >
                            <option value="CUSTOMER">
                                CUSTOMER
                            </option>

                            <option value="FARMER">
                                FARMER
                            </option>

                            <option value="DELIVERY_PARTNER">
                                DELIVERY PARTNER
                            </option>

                            <option value="ADMIN">
                                ADMIN
                            </option>
                        </select>
                    </div>

                    <div className="admin-form-actions admin-full-width">
                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                actionLoading
                            }
                        >
                            {actionLoading
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            className="admin-cancel-button"
                            onClick={
                                handleCancelEdit
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // ==========================================
    // PRODUCTS PAGE
    // ==========================================

    const renderProducts = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            MARKETPLACE
                        </span>

                        <h1>
                            🥕 Product Management
                        </h1>

                        <p>
                            Manage products listed by
                            farmers.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    {productsLoading ? (
                        <div className="admin-empty-state">
                            Loading products...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="admin-empty-state">
                            No products found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Farmer</th>
                                        <th>Price/kg</th>
                                        <th>Quantity</th>
                                        <th>Unit</th>
                                        <th>
                                            Available
                                        </th>
                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {products.map(
                                        (product) => (
                                            <tr
                                                key={
                                                    product.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        product.id
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            product.name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        product.category
                                                    }
                                                </td>

                                                <td>
                                                    {product.farmer_username ||
                                                        product.farmer_name ||
                                                        product.farmer?.username ||
                                                        product.farmer ||
                                                        "N/A"}
                                                </td>

                                                <td>
                                                    ₹
                                                    {
                                                        product.price_per_kg
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        product.available_quantity
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        product.unit
                                                    }
                                                </td>

                                                <td>
                                                    {product.is_available
                                                        ? "✅ Yes"
                                                        : "❌ No"}
                                                </td>

                                                <td>
                                                    <div className="admin-action-buttons">
                                                        <button
                                                            type="button"
                                                            className="admin-edit-button"
                                                            onClick={() =>
                                                                handleProductEditClick(
                                                                    product
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="admin-delete-button"
                                                            onClick={() =>
                                                                handleDeleteProduct(
                                                                    product
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {editingProduct &&
                    renderEditProduct()}
            </>
        );
    };

    // ==========================================
    // EDIT PRODUCT
    // ==========================================

    const renderEditProduct = () => {
        return (
            <div className="admin-edit-section">
                <div className="admin-edit-header">
                    <div>
                        <span>
                            PRODUCT MANAGEMENT
                        </span>

                        <h2>
                            ✏️ Edit Product
                        </h2>
                    </div>
                </div>

                <form
                    onSubmit={
                        handleUpdateProduct
                    }
                    className="admin-form-grid"
                >
                    <div className="admin-form-group">
                        <label>
                            Product Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={
                                productEditForm.name
                            }
                            onChange={
                                handleProductEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Category
                        </label>

                        <select
                            name="category"
                            value={
                                productEditForm.category
                            }
                            onChange={
                                handleProductEditChange
                            }
                        >
                            <option value="VEGETABLE">
                                Vegetable
                            </option>

                            <option value="FRUIT">
                                Fruit
                            </option>

                            <option value="GRAIN">
                                Grain
                            </option>

                            <option value="PULSE">
                                Pulse
                            </option>

                            <option value="SPICE">
                                Spice
                            </option>

                            <option value="OTHER">
                                Other
                            </option>
                        </select>
                    </div>

                    <div className="admin-form-group admin-full-width">
                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={
                                productEditForm.description
                            }
                            onChange={
                                handleProductEditChange
                            }
                            rows="4"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Price per kg
                        </label>

                        <input
                            type="number"
                            name="price_per_kg"
                            step="0.01"
                            value={
                                productEditForm.price_per_kg
                            }
                            onChange={
                                handleProductEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Available Quantity
                        </label>

                        <input
                            type="number"
                            name="available_quantity"
                            step="0.01"
                            value={
                                productEditForm.available_quantity
                            }
                            onChange={
                                handleProductEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Unit
                        </label>

                        <input
                            type="text"
                            name="unit"
                            value={
                                productEditForm.unit
                            }
                            onChange={
                                handleProductEditChange
                            }
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>
                            Availability
                        </label>

                        <select
                            name="is_available"
                            value={
                                productEditForm.is_available
                                    ? "true"
                                    : "false"
                            }
                            onChange={(event) =>
                                setProductEditForm(
                                    (previous) => ({
                                        ...previous,
                                        is_available:
                                            event
                                                .target
                                                .value ===
                                            "true",
                                    })
                                )
                            }
                        >
                            <option value="true">
                                Yes
                            </option>

                            <option value="false">
                                No
                            </option>
                        </select>
                    </div>

                    <div className="admin-form-actions admin-full-width">
                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                actionLoading
                            }
                        >
                            {actionLoading
                                ? "Updating..."
                                : "Update Product"}
                        </button>

                        <button
                            type="button"
                            className="admin-cancel-button"
                            onClick={() => {
                                setEditingProduct(
                                    null
                                );
                                setMessage("");
                            }}
                            disabled={
                                actionLoading
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // ==========================================
    // ORDERS PAGE
    // ==========================================

    const renderOrders = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            ORDER OPERATIONS
                        </span>

                        <h1>
                            📦 Order Management
                        </h1>

                        <p>
                            Monitor customer orders and
                            update delivery status.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    {ordersLoading ? (
                        <div className="admin-empty-state">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="admin-empty-state">
                            No orders found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>
                                            Customer
                                        </th>
                                        <th>
                                            Total
                                        </th>
                                        <th>
                                            Status
                                        </th>
                                        <th>
                                            Created
                                        </th>
                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map(
                                        (order) => (
                                            <tr
                                                key={
                                                    order.id
                                                }
                                            >
                                                <td>
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </td>

                                                <td>
                                                    {order.customer_username ||
                                                        order.customer_name ||
                                                        order.customer?.username ||
                                                        order.customer?.email ||
                                                        order.customer ||
                                                        "N/A"}
                                                </td>

                                                <td>
                                                    ₹
                                                    {order.total_amount ??
                                                        order.total_price ??
                                                        order.total ??
                                                        "0.00"}
                                                </td>

                                                <td>
                                                    <span className="order-status-badge">
                                                        {
                                                            order.status
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {order.created_at
                                                        ? new Date(
                                                              order.created_at
                                                          ).toLocaleString()
                                                        : "N/A"}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-edit-button"
                                                        onClick={() =>
                                                            handleViewOrder(
                                                                order.id
                                                            )
                                                        }
                                                        disabled={
                                                            orderDetailsLoading
                                                        }
                                                    >
                                                        {orderDetailsLoading
                                                            ? "Loading..."
                                                            : "View"}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedOrder &&
                    renderOrderDetails()}
            </>
        );
    };

    // ==========================================
    // ORDER DETAILS
    // ==========================================

    const renderOrderDetails = () => {
        const orderItems =
            selectedOrder.items ||
            selectedOrder.order_items ||
            [];

        return (
            <div className="admin-edit-section">
                <div className="admin-edit-header">
                    <div>
                        <span>
                            ORDER DETAILS
                        </span>

                        <h2>
                            📋 Order #
                            {selectedOrder.id}
                        </h2>
                    </div>
                </div>

                <div className="admin-order-summary">
                    <p>
                        <strong>
                            Customer:
                        </strong>{" "}
                        {selectedOrder.customer_username ||
                            selectedOrder.customer_name ||
                            selectedOrder.customer
                                ?.username ||
                            selectedOrder.customer
                                ?.email ||
                            selectedOrder.customer ||
                            "N/A"}
                    </p>

                    <p>
                        <strong>
                            Current Status:
                        </strong>{" "}
                        {selectedOrder.status ||
                            "N/A"}
                    </p>

                    <p>
                        <strong>
                            Total Amount:
                        </strong>{" "}
                        ₹
                        {selectedOrder.total_amount ??
                            selectedOrder.total_price ??
                            selectedOrder.total ??
                            "0.00"}
                    </p>

                    <p>
                        <strong>
                            Created:
                        </strong>{" "}
                        {selectedOrder.created_at
                            ? new Date(
                                  selectedOrder.created_at
                              ).toLocaleString()
                            : "N/A"}
                    </p>

                    {selectedOrder.delivery_address_line1 && (
                        <>
                            <p>
                                <strong>
                                    Delivery Name:
                                </strong>{" "}
                                {selectedOrder.delivery_name ||
                                    "N/A"}
                            </p>

                            <p>
                                <strong>
                                    Delivery Phone:
                                </strong>{" "}
                                {selectedOrder.delivery_phone ||
                                    "N/A"}
                            </p>

                            <p>
                                <strong>
                                    Delivery Address:
                                </strong>{" "}
                                {
                                    selectedOrder.delivery_address_line1
                                }

                                {selectedOrder.delivery_address_line2
                                    ? `, ${selectedOrder.delivery_address_line2}`
                                    : ""}

                                {selectedOrder.delivery_city
                                    ? `, ${selectedOrder.delivery_city}`
                                    : ""}

                                {selectedOrder.delivery_state
                                    ? `, ${selectedOrder.delivery_state}`
                                    : ""}

                                {selectedOrder.delivery_postal_code
                                    ? ` - ${selectedOrder.delivery_postal_code}`
                                    : ""}

                                {selectedOrder.delivery_country
                                    ? `, ${selectedOrder.delivery_country}`
                                    : ""}
                            </p>
                        </>
                    )}
                </div>

                <div className="admin-order-status-section">
                    <h3>
                        🔄 Update Order Status
                    </h3>

                    <div className="admin-form-group">
                        <label>
                            Change Status
                        </label>

                        <select
                            value={
                                selectedOrderStatus
                            }
                            onChange={(event) =>
                                setSelectedOrderStatus(
                                    event.target.value
                                )
                            }
                            disabled={
                                orderStatusLoading
                            }
                        >
                            <option value="">
                                Select Status
                            </option>

                            <option value="PENDING">
                                PENDING
                            </option>

                            <option value="CONFIRMED">
                                CONFIRMED
                            </option>

                            <option value="PROCESSING">
                                PROCESSING
                            </option>

                            <option value="SHIPPED">
                                SHIPPED
                            </option>

                            <option value="DELIVERED">
                                DELIVERED
                            </option>

                            <option value="CANCELLED">
                                CANCELLED
                            </option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className="admin-save-button"
                        onClick={
                            handleUpdateOrderStatus
                        }
                        disabled={
                            orderStatusLoading ||
                            !selectedOrderStatus ||
                            selectedOrderStatus ===
                                selectedOrder.status
                        }
                    >
                        {orderStatusLoading
                            ? "Updating..."
                            : "Update Status"}
                    </button>
                </div>

                <h3 className="admin-subheading">
                    🛒 Order Items
                </h3>

                {orderItems.length > 0 ? (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Quantity
                                    </th>

                                    <th>
                                        Price/kg
                                    </th>

                                    <th>
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {orderItems.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                item.id ||
                                                `${selectedOrder.id}-${index}`
                                            }
                                        >
                                            <td>
                                                {item.product_name ||
                                                    item.product
                                                        ?.name ||
                                                    item.product ||
                                                    "N/A"}
                                            </td>

                                            <td>
                                                {item.quantity ??
                                                    "N/A"}
                                            </td>

                                            <td>
                                                ₹
                                                {item.price_per_kg ??
                                                    item.price ??
                                                    "0.00"}
                                            </td>

                                            <td>
                                                ₹
                                                {item.subtotal ??
                                                    item.total_price ??
                                                    item.total ??
                                                    "0.00"}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>
                        No items found.
                    </p>
                )}

                <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => {
                        setSelectedOrder(
                            null
                        );

                        setSelectedOrderStatus(
                            ""
                        );

                        setMessage("");
                    }}
                    disabled={
                        orderStatusLoading
                    }
                >
                    Close
                </button>
            </div>
        );
    };

    // ==========================================
    // PAYMENTS PAGE
    // ==========================================

    const renderPayments = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            FINANCIAL MANAGEMENT
                        </span>

                        <h1>
                            💳 Payment Management
                        </h1>

                        <p>
                            Monitor customer payment
                            transactions.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    {paymentsLoading ? (
                        <div className="admin-empty-state">
                            Loading payments...
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="admin-empty-state">
                            No payments found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>
                                            Customer
                                        </th>
                                        <th>
                                            Order
                                        </th>
                                        <th>
                                            Amount
                                        </th>
                                        <th>
                                            Status
                                        </th>
                                        <th>
                                            Created
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payments.map(
                                        (payment) => (
                                            <tr
                                                key={
                                                    payment.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        payment.id
                                                    }
                                                </td>

                                                <td>
                                                    {payment.customer_username ||
                                                        payment.customer_name ||
                                                        payment.customer?.username ||
                                                        payment.customer ||
                                                        payment.username ||
                                                        "N/A"}
                                                </td>

                                                <td>
                                                    #
                                                    {payment.order_id ||
                                                        payment.order ||
                                                        "N/A"}
                                                </td>

                                                <td>
                                                    ₹
                                                    {payment.amount !==
                                                    undefined
                                                        ? Number(
                                                              payment.amount
                                                          ).toFixed(
                                                              2
                                                          )
                                                        : "0.00"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`admin-payment-status ${
                                                            payment.status
                                                                ? payment.status.toLowerCase()
                                                                : ""
                                                        }`}
                                                    >
                                                        {payment.status ||
                                                            "N/A"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {payment.created_at
                                                        ? new Date(
                                                              payment.created_at
                                                          ).toLocaleString()
                                                        : "N/A"}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ==========================================
    // NOTIFICATIONS PAGE
    // ==========================================

    const renderNotifications = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            SYSTEM COMMUNICATION
                        </span>

                        <h1>
                            🔔 Notifications
                        </h1>

                        <p>
                            View marketplace alerts and
                            account notifications.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    <div className="admin-section-header">
                        <div>
                            <span className="admin-section-label">
                                NOTIFICATION CENTER
                            </span>

                            <h2>
                                {
                                    unreadNotifications
                                }{" "}
                                Unread
                            </h2>
                        </div>

                        {notifications.length >
                            0 &&
                            unreadNotifications >
                                0 && (
                                <button
                                    type="button"
                                    className="admin-save-button"
                                    onClick={
                                        handleMarkAllNotificationsRead
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {actionLoading
                                        ? "Updating..."
                                        : "Mark All as Read"}
                                </button>
                            )}
                    </div>

                    {notificationsLoading ? (
                        <div className="admin-empty-state">
                            Loading notifications...
                        </div>
                    ) : notifications.length ===
                      0 ? (
                        <div className="admin-empty-state">
                            No notifications found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Notification
                                        </th>

                                        <th>
                                            Message
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {notifications.map(
                                        (
                                            notification
                                        ) => {
                                            const isRead =
                                                notification.is_read ===
                                                    true ||
                                                notification.is_read ===
                                                    1;

                                            return (
                                                <tr
                                                    key={
                                                        notification.id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {notification.title ||
                                                                notification.notification_type ||
                                                                "Notification"}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {notification.message ||
                                                            notification.text ||
                                                            notification.description ||
                                                            "-"}
                                                    </td>

                                                    <td>
                                                        <span className="role-badge">
                                                            {isRead
                                                                ? "READ"
                                                                : "UNREAD"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {notification.created_at
                                                            ? new Date(
                                                                  notification.created_at
                                                              ).toLocaleString()
                                                            : notification.timestamp
                                                            ? new Date(
                                                                  notification.timestamp
                                                              ).toLocaleString()
                                                            : "N/A"}
                                                    </td>

                                                    <td>
                                                        {!isRead ? (
                                                            <button
                                                                type="button"
                                                                className="admin-edit-button"
                                                                onClick={() =>
                                                                    handleMarkNotificationRead(
                                                                        notification.id
                                                                    )
                                                                }
                                                            >
                                                                Mark Read
                                                            </button>
                                                        ) : (
                                                            <span>
                                                                ✅ Read
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ==========================================
    // PROFILE MODAL
    // ==========================================

    const renderProfileModal = () => {
        if (!profileOpen) {
            return null;
        }

        return (
            <div
                className="admin-profile-overlay"
                onClick={() =>
                    setProfileOpen(false)
                }
            >
                <div
                    className="admin-profile-modal"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >
                    <button
                        type="button"
                        className="admin-profile-close"
                        onClick={() =>
                            setProfileOpen(false)
                        }
                        aria-label="Close profile"
                    >
                        ×
                    </button>

                    <div className="admin-profile-avatar">
                        👨‍💼
                    </div>

                    <h2>
                        {adminProfile?.username ||
                            "Admin"}
                    </h2>

                    <p className="admin-profile-role">
                        ADMINISTRATOR
                    </p>

                    {!profileEditing &&
                    !passwordChanging ? (
                        <>
                            <div className="admin-profile-info">
                                <div>
                                    <span>
                                        Username
                                    </span>

                                    <strong>
                                        {adminProfile?.username ||
                                            "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {adminProfile?.email ||
                                            "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Phone
                                    </span>

                                    <strong>
                                        {adminProfile?.phone ||
                                            "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Role
                                    </span>

                                    <strong>
                                        {adminProfile?.role ||
                                            "ADMIN"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Account ID
                                    </span>

                                    <strong>
                                        {adminProfile?.id ||
                                            "-"}
                                    </strong>
                                </div>
                            </div>

                            <div className="admin-form-actions">
                                <button
                                    type="button"
                                    className="admin-save-button"
                                    onClick={() => {
                                        setProfileForm({
                                            username:
                                                adminProfile?.username ||
                                                "",
                                            email:
                                                adminProfile?.email ||
                                                "",
                                            phone:
                                                adminProfile?.phone ||
                                                "",
                                        });

                                        setProfileEditing(
                                            true
                                        );

                                        setPasswordChanging(
                                            false
                                        );
                                    }}
                                >
                                    ✏️ Edit Profile
                                </button>

                                <button
                                    type="button"
                                    className="admin-edit-button"
                                    onClick={() => {
                                        setPasswordChanging(
                                            true
                                        );

                                        setProfileEditing(
                                            false
                                        );
                                    }}
                                >
                                    🔐 Change Password
                                </button>
                            </div>
                        </>
                    ) : profileEditing ? (
                        <form
                            onSubmit={
                                handleUpdateAdminProfile
                            }
                            className="admin-form-grid"
                        >
                            <div className="admin-form-group admin-full-width">
                                <label>
                                    Username
                                </label>

                                <input
                                    type="text"
                                    name="username"
                                    value={
                                        profileForm.username
                                    }
                                    onChange={
                                        handleProfileFormChange
                                    }
                                    required
                                />
                            </div>

                            <div className="admin-form-group admin-full-width">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        profileForm.email
                                    }
                                    onChange={
                                        handleProfileFormChange
                                    }
                                />
                            </div>

                            <div className="admin-form-group admin-full-width">
                                <label>
                                    Phone
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={
                                        profileForm.phone
                                    }
                                    onChange={
                                        handleProfileFormChange
                                    }
                                />
                            </div>

                            <div className="admin-form-actions admin-full-width">
                                <button
                                    type="submit"
                                    className="admin-save-button"
                                    disabled={
                                        profileUpdateLoading
                                    }
                                >
                                    {profileUpdateLoading
                                        ? "Saving..."
                                        : "Save Profile"}
                                </button>

                                <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={() =>
                                        setProfileEditing(
                                            false
                                        )
                                    }
                                    disabled={
                                        profileUpdateLoading
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={
                                handleChangeAdminPassword
                            }
                            className="admin-form-grid"
                        >
                            <div className="admin-edit-header admin-full-width">
                                <div>
                                    <span>
                                        SECURITY
                                    </span>

                                    <h2>
                                        🔐 Change Password
                                    </h2>
                                </div>
                            </div>

                            <div className="admin-form-group admin-full-width">
                                <label>
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    name="old_password"
                                    value={
                                        passwordForm.old_password
                                    }
                                    onChange={
                                        handlePasswordFormChange
                                    }
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <div className="admin-form-group admin-full-width">
                                <label>
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    name="new_password"
                                    value={
                                        passwordForm.new_password
                                    }
                                    onChange={
                                        handlePasswordFormChange
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="admin-form-group admin-full-width">
                                <label>
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={
                                        passwordForm.confirm_password
                                    }
                                    onChange={
                                        handlePasswordFormChange
                                    }
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="admin-form-actions admin-full-width">
                                <button
                                    type="submit"
                                    className="admin-save-button"
                                    disabled={
                                        passwordUpdateLoading
                                    }
                                >
                                    {passwordUpdateLoading
                                        ? "Updating..."
                                        : "Change Password"}
                                </button>

                                <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={() => {
                                        setPasswordChanging(
                                            false
                                        );

                                        setPasswordForm({
                                            old_password:
                                                "",
                                            new_password:
                                                "",
                                            confirm_password:
                                                "",
                                        });
                                    }}
                                    disabled={
                                        passwordUpdateLoading
                                    }
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <button
                        type="button"
                        className="admin-profile-close-button"
                        onClick={() =>
                            setProfileOpen(false)
                        }
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    // ==========================================
    // LOADING SCREEN
    // ==========================================

    if (loading) {
        return (
            <div className="admin-loading-screen">
                <div className="admin-loading-card">
                    <div className="admin-loading-icon">
                        🌱
                    </div>

                    <h1>
                        AgriConnect AI
                    </h1>

                    <h2>
                        Admin Dashboard
                    </h2>

                    <p>
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // MAIN ADMIN DASHBOARD
    // ==========================================

    return (
        <div className="admin-dashboard">

            {/* ==================================
                HEADER
            ================================== */}

            <header className="admin-header">

                <div className="admin-header-brand">

                    <div className="admin-logo">
                        🌱
                    </div>

                    <div>
                        <h1>
                            AgriConnect AI
                        </h1>

                        <span>
                            Admin Panel
                        </span>
                    </div>

                </div>

                <div className="admin-header-right">

                    <button
                        type="button"
                        className="admin-profile-button"
                        onClick={() =>
                            setProfileOpen(true)
                        }
                    >
                        <span className="admin-profile-button-icon">
                            👨‍💼
                        </span>

                        <span>
                            {adminProfile?.username ||
                                "Admin"}
                        </span>

                        <span>
                            ▾
                        </span>
                    </button>

                </div>

            </header>

            {/* ==================================
                SIDEBAR
            ================================== */}

            <aside className="admin-sidebar">

                <div className="admin-sidebar-title">
                    <span>
                        ADMIN MENU
                    </span>
                </div>

                <nav className="admin-sidebar-nav">

                    {MENU_ITEMS.map(
                        (item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`admin-sidebar-item ${
                                    activePage ===
                                    item.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleNavigation(
                                        item.id
                                    )
                                }
                            >
                                <span className="admin-sidebar-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>

                                {item.id ===
                                    "notifications" &&
                                    unreadNotifications >
                                        0 && (
                                        <span
                                            style={{
                                                marginLeft:
                                                    "auto",
                                                minWidth:
                                                    "22px",
                                                height:
                                                    "22px",
                                                padding:
                                                    "0 6px",
                                                borderRadius:
                                                    "999px",
                                                display:
                                                    "inline-flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "center",
                                                fontSize:
                                                    "12px",
                                                fontWeight:
                                                    "700",
                                            }}
                                        >
                                            {
                                                unreadNotifications
                                            }
                                        </span>
                                    )}
                            </button>
                        )
                    )}

                </nav>

                <div className="admin-sidebar-bottom">

                    <button
                        type="button"
                        className="admin-sidebar-item profile"
                        onClick={() =>
                            setProfileOpen(true)
                        }
                    >
                        <span className="admin-sidebar-icon">
                            ⚙️
                        </span>

                        <span>
                            Profile
                        </span>
                    </button>

                    <button
                        type="button"
                        className="admin-sidebar-item logout"
                        onClick={onLogout}
                    >
                        <span className="admin-sidebar-icon">
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>
                    </button>

                </div>

            </aside>

            {/* ==================================
                MAIN CONTENT
            ================================== */}

            <main className="admin-main">

                {message && (
                    <div className="admin-message">
                        <span>
                            {message}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setMessage("")
                            }
                            aria-label="Close message"
                        >
                            ×
                        </button>
                    </div>
                )}

                {activePage ===
                    "dashboard" &&
                    renderDashboard()}

                {activePage ===
                    "users" &&
                    renderUsers()}

                {activePage ===
                    "products" &&
                    renderProducts()}

                {activePage ===
                    "orders" &&
                    renderOrders()}

                {activePage ===
                    "payments" &&
                    renderPayments()}

                {activePage ===
                    "notifications" &&
                    renderNotifications()}

            </main>

            {/* ==================================
                PROFILE MODAL
            ================================== */}

            {renderProfileModal()}

        </div>
    );
}

export default AdminDashboard;