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
        total_delivery_partners: 0,
        active_delivery_partners: 0,
        inactive_delivery_partners: 0,
        total_products: 0,
        total_orders: 0,
        total_payments: 0,
        active_users: 0,
        verified_farmers: 0,
        pending_farmers: 0,
        pending_orders: 0,
        delivered_orders: 0,
        successful_payments: 0,
        total_revenue: "0.00",
    });

    // ==========================================
    // USERS
    // ==========================================

    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("ALL");
    const [userStatusFilter, setUserStatusFilter] = useState("ALL");
    const [selectedUser, setSelectedUser] = useState(null);
    const [userActionId, setUserActionId] = useState(null);

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
    // FARMER VERIFICATION
    // ==========================================

    const [farmerProfiles, setFarmerProfiles] = useState([]);
    const [farmerVerificationLoading, setFarmerVerificationLoading] = useState(false);
    const [farmerVerificationActionId, setFarmerVerificationActionId] = useState(null);
    const [farmerVerificationSearch, setFarmerVerificationSearch] = useState("");
    const [farmerVerificationFilter, setFarmerVerificationFilter] = useState("ALL");

    // ==========================================
    // DELIVERY PARTNER MANAGEMENT
    // ==========================================

    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [deliveryPartnersLoading, setDeliveryPartnersLoading] = useState(false);
    const [deliveryPartnerActionId, setDeliveryPartnerActionId] = useState(null);
    const [deliveryPartnerSearch, setDeliveryPartnerSearch] = useState("");
    const [deliveryPartnerFilter, setDeliveryPartnerFilter] = useState("ALL");
    const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState(null);
    const [deliveryPartnerRejectOpen, setDeliveryPartnerRejectOpen] = useState(false);
    const [deliveryPartnerRejectionReason, setDeliveryPartnerRejectionReason] = useState("");
    const [deliveryPartnerRejectLoading, setDeliveryPartnerRejectLoading] = useState(false);

    // ==========================================
    // ORDERS
    // ==========================================

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

    const [orderStatusLoading, setOrderStatusLoading] = useState(false);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState("");

    // Delivery partner assignment
    const [deliveryAssignmentLoading, setDeliveryAssignmentLoading] = useState(false);
    const [selectedDeliveryPartnerId, setSelectedDeliveryPartnerId] = useState("");
    const [orderDeliveryAssignments, setOrderDeliveryAssignments] = useState({});

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
    const [notificationSearch, setNotificationSearch] = useState("");
    const [notificationFilter, setNotificationFilter] = useState("ALL");
    const [selectedNotification, setSelectedNotification] = useState(null);

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
            id: "farmer-verification",
            icon: "🛡️",
            label: "Farmer Verification",
        },
        {
            id: "delivery-partners",
            icon: "🚚",
            label: "Delivery Partners",
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

                total_delivery_partners:
                    Number(data.total_delivery_partners ?? 0),

                active_delivery_partners:
                    Number(data.active_delivery_partners ?? 0),

                inactive_delivery_partners:
                    Number(data.inactive_delivery_partners ?? 0),

                total_products:
                    Number(data.total_products ?? 0),

                total_orders:
                    Number(data.total_orders ?? 0),

                total_payments:
                    Number(data.total_payments ?? 0),

                active_users:
                    Number(data.active_users ?? 0),

                verified_farmers:
                    Number(data.verified_farmers ?? 0),

                pending_farmers:
                    Number(data.pending_farmers ?? 0),

                pending_orders:
                    Number(data.pending_orders ?? 0),

                delivered_orders:
                    Number(data.delivered_orders ?? 0),

                successful_payments:
                    Number(data.successful_payments ?? 0),

                total_revenue:
                    data.total_revenue ?? "0.00",
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

            const deliveryPartners = userData.filter(
                (user) => user.role === "DELIVERY_PARTNER"
            );

            setStats((previous) => ({
                ...previous,
                total_delivery_partners: deliveryPartners.length,
                active_delivery_partners: deliveryPartners.filter(
                    (user) => user.is_active === true
                ).length,
                inactive_delivery_partners: deliveryPartners.filter(
                    (user) => user.is_active === false
                ).length,
            }));
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
    // FETCH DELIVERY PARTNERS
    // ==========================================

    const fetchDeliveryPartners = async () => {
        try {
            setDeliveryPartnersLoading(true);

            const response = await api.get(
                "/api/auth/admin/delivery-partners/"
            );

            const partnerData = extractList(
                response.data,
                ["delivery_partners", "partners", "data"]
            );

            setDeliveryPartners(partnerData);
        } catch (error) {
            console.error(
                "Fetch delivery partners error:",
                error
            );

            setDeliveryPartners([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Unable to load delivery partner applications."
            );
        } finally {
            setDeliveryPartnersLoading(false);
        }
    };

    // ==========================================
    // APPROVE DELIVERY PARTNER
    // ==========================================

    const handleApproveDeliveryPartner = async (partner) => {
        const confirmed = window.confirm(
            `Approve delivery partner "${partner.full_name || partner.username || "this partner"}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeliveryPartnerActionId(partner.id);
            setMessage("");

            const response = await api.put(
                `/api/auth/admin/delivery-partners/${partner.id}/approve/`
            );

            const updatedPartner =
                response.data?.delivery_partner || null;

            setDeliveryPartners((previous) =>
                previous.map((item) =>
                    item.id === partner.id
                        ? {
                              ...item,
                              ...(updatedPartner || {}),
                              approval_status: "APPROVED",
                              is_active: true,
                              rejection_reason: "",
                          }
                        : item
                )
            );

            setSelectedDeliveryPartner((previous) =>
                previous?.id === partner.id
                    ? {
                          ...previous,
                          ...(updatedPartner || {}),
                          approval_status: "APPROVED",
                          is_active: true,
                          rejection_reason: "",
                      }
                    : previous
            );

            setStats((previous) => ({
                ...previous,
                active_delivery_partners: Math.max(
                    previous.active_delivery_partners +
                        (partner.is_active ? 0 : 1),
                    0
                ),
                inactive_delivery_partners: Math.max(
                    previous.inactive_delivery_partners -
                        (partner.is_active ? 0 : 1),
                    0
                ),
            }));

            setMessage(
                response.data?.message ||
                    "✅ Delivery partner approved successfully."
            );

            await fetchUsers();
            await fetchDashboardStats();
            await fetchNotifications();
        } catch (error) {
            console.error(
                "Approve delivery partner error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Unable to approve delivery partner."
            );
        } finally {
            setDeliveryPartnerActionId(null);
        }
    };

    // ==========================================
    // OPEN DELIVERY PARTNER REJECTION
    // ==========================================

    const handleOpenDeliveryPartnerReject = (partner) => {
        setSelectedDeliveryPartner(partner);
        setDeliveryPartnerRejectionReason(
            partner.rejection_reason || ""
        );
        setDeliveryPartnerRejectOpen(true);
        setMessage("");
    };

    // ==========================================
    // REJECT DELIVERY PARTNER
    // ==========================================

    const handleRejectDeliveryPartner = async (event) => {
        event.preventDefault();

        if (!selectedDeliveryPartner) {
            return;
        }

        const reason = deliveryPartnerRejectionReason.trim();

        if (!reason) {
            setMessage("Please enter a rejection reason.");
            return;
        }

        try {
            setDeliveryPartnerRejectLoading(true);
            setDeliveryPartnerActionId(selectedDeliveryPartner.id);
            setMessage("");

            const response = await api.put(
                `/api/auth/admin/delivery-partners/${selectedDeliveryPartner.id}/reject/`,
                {
                    rejection_reason: reason,
                }
            );

            const updatedPartner =
                response.data?.delivery_partner || null;

            setDeliveryPartners((previous) =>
                previous.map((item) =>
                    item.id === selectedDeliveryPartner.id
                        ? {
                              ...item,
                              ...(updatedPartner || {}),
                              approval_status: "REJECTED",
                              is_active: false,
                              rejection_reason: reason,
                          }
                        : item
                )
            );

            setSelectedDeliveryPartner((previous) =>
                previous
                    ? {
                          ...previous,
                          ...(updatedPartner || {}),
                          approval_status: "REJECTED",
                          is_active: false,
                          rejection_reason: reason,
                      }
                    : previous
            );

            setStats((previous) => ({
                ...previous,
                active_delivery_partners: Math.max(
                    previous.active_delivery_partners -
                        (selectedDeliveryPartner.is_active ? 1 : 0),
                    0
                ),
                inactive_delivery_partners:
                    previous.inactive_delivery_partners +
                    (selectedDeliveryPartner.is_active ? 1 : 0),
            }));

            setDeliveryPartnerRejectOpen(false);
            setDeliveryPartnerRejectionReason("");

            setMessage(
                response.data?.message ||
                    "❌ Delivery partner rejected successfully."
            );

            await fetchUsers();
            await fetchDashboardStats();
            await fetchNotifications();
        } catch (error) {
            console.error(
                "Reject delivery partner error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.response?.data?.rejection_reason?.[0] ||
                    "Unable to reject delivery partner."
            );
        } finally {
            setDeliveryPartnerRejectLoading(false);
            setDeliveryPartnerActionId(null);
        }
    };

    // ==========================================
    // DELIVERY PARTNER FILTERING
    // ==========================================

    const filteredDeliveryPartners = deliveryPartners.filter((partner) => {
        const search = deliveryPartnerSearch
            .trim()
            .toLowerCase();

        const matchesSearch =
            !search ||
            [
                partner.full_name,
                partner.username,
                partner.email,
                partner.phone,
                partner.vehicle_type,
                partner.vehicle_number,
                partner.driving_license_number,
                partner.city,
                partner.district,
                partner.state,
                String(partner.id),
                String(partner.user_id),
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(search)
            );

        const matchesFilter =
            deliveryPartnerFilter === "ALL" ||
            partner.approval_status === deliveryPartnerFilter;

        return matchesSearch && matchesFilter;
    });

    // ==========================================
    // DELIVERY PARTNER MANAGEMENT PAGE
    // ==========================================

    const renderDeliveryPartners = () => {
        const pendingCount = deliveryPartners.filter(
            (partner) => partner.approval_status === "PENDING"
        ).length;
        const approvedCount = deliveryPartners.filter(
            (partner) => partner.approval_status === "APPROVED"
        ).length;
        const rejectedCount = deliveryPartners.filter(
            (partner) => partner.approval_status === "REJECTED"
        ).length;

        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            DELIVERY OPERATIONS
                        </span>

                        <h1>
                            🚚 Delivery Partner Management
                        </h1>

                        <p>
                            Review delivery partner applications and manage approval status.
                        </p>
                    </div>
                </div>

                <div className="admin-stats-grid">
                    <StatCard
                        icon="🚚"
                        title="Total Partners"
                        value={deliveryPartners.length}
                    />
                    <StatCard
                        icon="⏳"
                        title="Pending"
                        value={pendingCount}
                    />
                    <StatCard
                        icon="✅"
                        title="Approved"
                        value={approvedCount}
                    />
                    <StatCard
                        icon="❌"
                        title="Rejected"
                        value={rejectedCount}
                    />
                </div>

                <div className="admin-section">
                    <div
                        className="admin-section-header"
                        style={{
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <span className="admin-section-label">
                                DELIVERY PARTNER APPLICATIONS
                            </span>

                            <h2>
                                {filteredDeliveryPartners.length} Partner(s)
                            </h2>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <input
                                type="search"
                                value={deliveryPartnerSearch}
                                onChange={(event) =>
                                    setDeliveryPartnerSearch(event.target.value)
                                }
                                placeholder="Search name, username, vehicle, phone or location..."
                                style={{
                                    flex: "1 1 300px",
                                    minWidth: "220px",
                                }}
                            />

                            <select
                                value={deliveryPartnerFilter}
                                onChange={(event) =>
                                    setDeliveryPartnerFilter(event.target.value)
                                }
                                style={{
                                    minWidth: "150px",
                                }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>

                            <button
                                type="button"
                                className="admin-save-button"
                                onClick={fetchDeliveryPartners}
                                disabled={deliveryPartnersLoading}
                            >
                                {deliveryPartnersLoading
                                    ? "Refreshing..."
                                    : "↻ Refresh"}
                            </button>
                        </div>
                    </div>

                    {deliveryPartnersLoading ? (
                        <div className="admin-empty-state">
                            Loading delivery partner applications...
                        </div>
                    ) : deliveryPartners.length === 0 ? (
                        <div className="admin-empty-state">
                            No delivery partner applications found.
                        </div>
                    ) : filteredDeliveryPartners.length === 0 ? (
                        <div className="admin-empty-state">
                            No delivery partners match the selected search or filter.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Partner</th>
                                        <th>Contact</th>
                                        <th>Vehicle</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredDeliveryPartners.map((partner) => (
                                        <tr key={partner.id}>
                                            <td>
                                                <strong>#{partner.id}</strong>
                                                <br />
                                                <small>
                                                    User ID: {partner.user_id || "N/A"}
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {partner.full_name || "N/A"}
                                                </strong>
                                                <br />
                                                <small>
                                                    @{partner.username || "N/A"}
                                                </small>
                                            </td>

                                            <td>
                                                {partner.phone || "N/A"}
                                                <br />
                                                <small>
                                                    {partner.email || "N/A"}
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {partner.vehicle_type || "N/A"}
                                                </strong>
                                                <br />
                                                {partner.vehicle_number || "N/A"}
                                            </td>

                                            <td>
                                                {partner.city || "N/A"}
                                                <br />
                                                {partner.district || "N/A"}
                                                {partner.state
                                                    ? `, ${partner.state}`
                                                    : ""}
                                                <br />
                                                PIN: {partner.postal_code || "N/A"}
                                            </td>

                                            <td>
                                                <span
                                                    className="order-status-badge"
                                                >
                                                    {partner.approval_status || "PENDING"}
                                                </span>
                                                <br />
                                                <small>
                                                    {partner.is_active
                                                        ? "Active account"
                                                        : "Inactive account"}
                                                </small>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="admin-edit-button"
                                                        onClick={() =>
                                                            setSelectedDeliveryPartner(partner)
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    {partner.approval_status !== "APPROVED" && (
                                                        <button
                                                            type="button"
                                                            className="admin-save-button"
                                                            onClick={() =>
                                                                handleApproveDeliveryPartner(partner)
                                                            }
                                                            disabled={
                                                                deliveryPartnerActionId ===
                                                                partner.id
                                                            }
                                                        >
                                                            {deliveryPartnerActionId === partner.id
                                                                ? "Updating..."
                                                                : "Approve"}
                                                        </button>
                                                    )}

                                                    {partner.approval_status !== "REJECTED" && (
                                                        <button
                                                            type="button"
                                                            className="admin-delete-button"
                                                            onClick={() =>
                                                                handleOpenDeliveryPartnerReject(partner)
                                                            }
                                                            disabled={
                                                                deliveryPartnerActionId ===
                                                                partner.id
                                                            }
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedDeliveryPartner && !deliveryPartnerRejectOpen && (
                    <div
                        onClick={() => setSelectedDeliveryPartner(null)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1200,
                            background: "rgba(0, 0, 0, 0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px",
                            overflowY: "auto",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                width: "100%",
                                maxWidth: "700px",
                                maxHeight: "88vh",
                                overflowY: "auto",
                                background: "#ffffff",
                                borderRadius: "18px",
                                padding: "28px",
                                boxSizing: "border-box",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: "16px",
                                    marginBottom: "22px",
                                }}
                            >
                                <div>
                                    <span className="admin-section-label">
                                        DELIVERY PARTNER DETAILS
                                    </span>
                                    <h2>
                                        🚚 {selectedDeliveryPartner.full_name || "Delivery Partner"}
                                    </h2>
                                    <p>
                                        @{selectedDeliveryPartner.username || "N/A"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="close-details-button"
                                    onClick={() => setSelectedDeliveryPartner(null)}
                                    aria-label="Close delivery partner details"
                                >
                                    ✕
                                </button>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "14px",
                                }}
                            >
                                {[
                                    ["Email", selectedDeliveryPartner.email],
                                    ["Phone", selectedDeliveryPartner.phone],
                                    ["Vehicle Type", selectedDeliveryPartner.vehicle_type],
                                    ["Vehicle Number", selectedDeliveryPartner.vehicle_number],
                                    ["Driving Licence", selectedDeliveryPartner.driving_license_number],
                                    ["Address", selectedDeliveryPartner.address_line1],
                                    ["Address Line 2", selectedDeliveryPartner.address_line2],
                                    ["City", selectedDeliveryPartner.city],
                                    ["District", selectedDeliveryPartner.district],
                                    ["State", selectedDeliveryPartner.state],
                                    ["Postal Code", selectedDeliveryPartner.postal_code],
                                    ["Approval Status", selectedDeliveryPartner.approval_status],
                                    ["Account Status", selectedDeliveryPartner.is_active ? "ACTIVE" : "INACTIVE"],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        style={{
                                            padding: "14px",
                                            borderRadius: "12px",
                                            background: "#f7f7f7",
                                        }}
                                    >
                                        <small style={{ display: "block", marginBottom: "5px", opacity: 0.7 }}>
                                            {label}
                                        </small>
                                        <strong style={{ overflowWrap: "anywhere" }}>
                                            {value || "N/A"}
                                        </strong>
                                    </div>
                                ))}
                            </div>

                            {selectedDeliveryPartner.rejection_reason && (
                                <div
                                    style={{
                                        marginTop: "18px",
                                        padding: "16px",
                                        borderRadius: "12px",
                                        background: "#fff4f4",
                                    }}
                                >
                                    <strong>Rejection Reason</strong>
                                    <p style={{ marginBottom: 0 }}>
                                        {selectedDeliveryPartner.rejection_reason}
                                    </p>
                                </div>
                            )}

                            <div
                                className="admin-form-actions"
                                style={{ marginTop: "24px" }}
                            >
                                {selectedDeliveryPartner.approval_status !== "APPROVED" && (
                                    <button
                                        type="button"
                                        className="admin-save-button"
                                        onClick={() =>
                                            handleApproveDeliveryPartner(selectedDeliveryPartner)
                                        }
                                        disabled={
                                            deliveryPartnerActionId ===
                                            selectedDeliveryPartner.id
                                        }
                                    >
                                        {deliveryPartnerActionId === selectedDeliveryPartner.id
                                            ? "Updating..."
                                            : "✅ Approve Partner"}
                                    </button>
                                )}

                                {selectedDeliveryPartner.approval_status !== "REJECTED" && (
                                    <button
                                        type="button"
                                        className="admin-delete-button"
                                        onClick={() =>
                                            handleOpenDeliveryPartnerReject(selectedDeliveryPartner)
                                        }
                                        disabled={
                                            deliveryPartnerActionId ===
                                            selectedDeliveryPartner.id
                                        }
                                    >
                                        ❌ Reject Partner
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={() => setSelectedDeliveryPartner(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {deliveryPartnerRejectOpen && selectedDeliveryPartner && (
                    <div
                        onClick={() => {
                            if (!deliveryPartnerRejectLoading) {
                                setDeliveryPartnerRejectOpen(false);
                            }
                        }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1300,
                            background: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px",
                            boxSizing: "border-box",
                        }}
                    >
                        <form
                            onSubmit={handleRejectDeliveryPartner}
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                width: "100%",
                                maxWidth: "520px",
                                background: "#ffffff",
                                borderRadius: "18px",
                                padding: "28px",
                                boxSizing: "border-box",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                            }}
                        >
                            <span className="admin-section-label">
                                APPLICATION REVIEW
                            </span>
                            <h2>
                                ❌ Reject Delivery Partner
                            </h2>
                            <p>
                                Enter a clear reason for rejecting <strong>{selectedDeliveryPartner.full_name || selectedDeliveryPartner.username}</strong>.
                            </p>

                            <div className="admin-form-group admin-full-width">
                                <label htmlFor="delivery-partner-rejection-reason">
                                    Rejection Reason
                                </label>
                                <textarea
                                    id="delivery-partner-rejection-reason"
                                    value={deliveryPartnerRejectionReason}
                                    onChange={(event) =>
                                        setDeliveryPartnerRejectionReason(event.target.value)
                                    }
                                    placeholder="Explain what information or documents need to be corrected..."
                                    rows={5}
                                    required
                                    disabled={deliveryPartnerRejectLoading}
                                    style={{
                                        width: "100%",
                                        resize: "vertical",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div className="admin-form-actions" style={{ marginTop: "20px" }}>
                                <button
                                    type="submit"
                                    className="admin-delete-button"
                                    disabled={deliveryPartnerRejectLoading}
                                >
                                    {deliveryPartnerRejectLoading
                                        ? "Rejecting..."
                                        : "Reject Partner"}
                                </button>

                                <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={() => setDeliveryPartnerRejectOpen(false)}
                                    disabled={deliveryPartnerRejectLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </>
        );
    };

    // ==========================================
    // FETCH ORDERS
    // ==========================================

    const fetchFarmerProfiles = async () => {
        try {
            setFarmerVerificationLoading(true);

            const response = await api.get(
                "/api/farmers/admin/verification/"
            );

            const farmerData = extractList(
                response.data,
                ["farmers", "profiles", "data"]
            );

            setFarmerProfiles(farmerData);
        } catch (error) {
            console.error(
                "Fetch farmer verification error:",
                error
            );

            setFarmerProfiles([]);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Unable to load farmer verification data."
            );
        } finally {
            setFarmerVerificationLoading(false);
        }
    };

    // ==========================================
    // UPDATE FARMER VERIFICATION
    // ==========================================

    const handleFarmerVerification = async (farmerId, isVerified) => {
        try {
            setFarmerVerificationActionId(farmerId);
            setMessage("");

            const response = await api.put(
                `/api/farmers/admin/verification/${farmerId}/`,
                {
                    is_verified: isVerified,
                }
            );

            const updatedFarmer = response.data?.farmer;

            setFarmerProfiles((previous) =>
                previous.map((farmer) =>
                    farmer.id === farmerId
                        ? updatedFarmer || {
                              ...farmer,
                              is_verified: isVerified,
                          }
                        : farmer
                )
            );

            setMessage(
                response.data?.message ||
                    (isVerified
                        ? "Farmer verified successfully."
                        : "Farmer verification rejected.")
            );
        } catch (error) {
            console.error(
                "Update farmer verification error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Unable to update farmer verification."
            );
        } finally {
            setFarmerVerificationActionId(null);
        }
    };

    // ==========================================
    // FARMER VERIFICATION FILTERING
    // ==========================================

    const filteredFarmerProfiles = farmerProfiles.filter((farmer) => {
        const search = farmerVerificationSearch
            .trim()
            .toLowerCase();

        const matchesSearch =
            !search ||
            String(farmer.farm_name || "")
                .toLowerCase()
                .includes(search) ||
            String(farmer.phone || "")
                .toLowerCase()
                .includes(search) ||
            String(farmer.village || "")
                .toLowerCase()
                .includes(search) ||
            String(farmer.district || "")
                .toLowerCase()
                .includes(search) ||
            String(farmer.state || "")
                .toLowerCase()
                .includes(search);

        const matchesFilter =
            farmerVerificationFilter === "ALL" ||
            (farmerVerificationFilter === "PENDING" &&
                !farmer.is_verified) ||
            (farmerVerificationFilter === "VERIFIED" &&
                farmer.is_verified);

        return matchesSearch && matchesFilter;
    });

    // ==========================================
    // FARMER VERIFICATION
    // ==========================================

    const renderFarmerVerification = () => {
        return (
            <>
                <div className="admin-page-heading">
                    <div>
                        <span>
                            TRUST &amp; SAFETY
                        </span>

                        <h1>
                            🛡️ Farmer Verification
                        </h1>

                        <p>
                            Review registered farmers and manage their verification status.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    <div
                        className="admin-section-header"
                        style={{
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <span className="admin-section-label">
                                FARMER KYC REVIEW
                            </span>

                            <h2>
                                {farmerProfiles.length} Registered Farmers
                            </h2>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                value={farmerVerificationSearch}
                                onChange={(event) =>
                                    setFarmerVerificationSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search farmers..."
                                style={{
                                    minWidth: "220px",
                                }}
                            />

                            <select
                                value={farmerVerificationFilter}
                                onChange={(event) =>
                                    setFarmerVerificationFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="VERIFIED">Verified</option>
                            </select>

                            <button
                                type="button"
                                className="admin-save-button"
                                onClick={fetchFarmerProfiles}
                                disabled={farmerVerificationLoading}
                            >
                                {farmerVerificationLoading
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {farmerVerificationLoading ? (
                        <div className="admin-empty-state">
                            Loading farmer verification records...
                        </div>
                    ) : filteredFarmerProfiles.length === 0 ? (
                        <div className="admin-empty-state">
                            No farmer verification records found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Farm / Farmer</th>
                                        <th>Contact</th>
                                        <th>Location</th>
                                        <th>Farm Details</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredFarmerProfiles.map((farmer) => (
                                        <tr key={farmer.id}>
                                            <td>#{farmer.id}</td>

                                            <td>
                                                <strong>
                                                    {farmer.farm_name || "N/A"}
                                                </strong>
                                                <br />
                                                <small>
                                                    User ID: {farmer.user || "N/A"}
                                                </small>
                                            </td>

                                            <td>
                                                {farmer.phone || "N/A"}
                                            </td>

                                            <td>
                                                {farmer.village || "N/A"}
                                                <br />
                                                {farmer.district || "N/A"}
                                                {farmer.state
                                                    ? `, ${farmer.state}`
                                                    : ""}
                                                <br />
                                                PIN: {farmer.pincode || "N/A"}
                                            </td>

                                            <td>
                                                {farmer.farms?.length || 0} farm(s)
                                            </td>

                                            <td>
                                                <span
                                                    className="order-status-badge"
                                                >
                                                    {farmer.is_verified
                                                        ? "VERIFIED"
                                                        : "PENDING"}
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {farmer.is_verified ? (
                                                        <button
                                                            type="button"
                                                            className="admin-delete-button"
                                                            onClick={() =>
                                                                handleFarmerVerification(
                                                                    farmer.id,
                                                                    false
                                                                )
                                                            }
                                                            disabled={
                                                                farmerVerificationActionId ===
                                                                farmer.id
                                                            }
                                                        >
                                                            {farmerVerificationActionId ===
                                                            farmer.id
                                                                ? "Updating..."
                                                                : "Reject"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="admin-save-button"
                                                            onClick={() =>
                                                                handleFarmerVerification(
                                                                    farmer.id,
                                                                    true
                                                                )
                                                            }
                                                            disabled={
                                                                farmerVerificationActionId ===
                                                                farmer.id
                                                            }
                                                        >
                                                            {farmerVerificationActionId ===
                                                            farmer.id
                                                                ? "Updating..."
                                                                : "Verify"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </>
        );
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
                    fetchDeliveryPartners(),
                    fetchFarmerProfiles(),
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
        setSelectedDeliveryPartnerId("");

        if (page !== "farmer-verification") {
            setFarmerVerificationSearch("");
            setFarmerVerificationFilter("ALL");
        }

        if (page !== "users") {
            setUserSearch("");
            setUserRoleFilter("ALL");
            setUserStatusFilter("ALL");
            setSelectedUser(null);
        }

        if (page !== "notifications") {
            setNotificationSearch("");
            setNotificationFilter("ALL");
            setSelectedNotification(null);
        }

        if (page !== "delivery-partners") {
            setDeliveryPartnerSearch("");
            setDeliveryPartnerFilter("ALL");
            setSelectedDeliveryPartner(null);
            setDeliveryPartnerRejectOpen(false);
            setDeliveryPartnerRejectionReason("");
        }
    };

    // ==========================================
    // FILTER USERS
    // ==========================================

    const filteredUsers = users.filter((user) => {
        const search = userSearch.trim().toLowerCase();

        const matchesSearch = !search || [
            user.username,
            user.email,
            user.phone,
            user.role,
            String(user.id),
        ].some((value) =>
            String(value || "").toLowerCase().includes(search)
        );

        const matchesRole =
            userRoleFilter === "ALL" ||
            user.role === userRoleFilter;

        const matchesStatus =
            userStatusFilter === "ALL" ||
            (userStatusFilter === "ACTIVE" && user.is_active === true) ||
            (userStatusFilter === "INACTIVE" && user.is_active === false);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // ==========================================
    // VIEW USER DETAILS
    // ==========================================

    const handleViewUser = async (user) => {
        try {
            setUserActionId(user.id);

            const response = await api.get(
                `/api/auth/admin/users/${user.id}/`
            );

            setSelectedUser(
                response.data?.user || response.data || user
            );
        } catch (error) {
            console.error("View user error:", error);
            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load user details."
            );
        } finally {
            setUserActionId(null);
        }
    };

    // ==========================================
    // ACTIVATE / DEACTIVATE USER
    // ==========================================

    const handleToggleUserStatus = async (user) => {
        const nextStatus = !user.is_active;

        const confirmed = window.confirm(
            `Are you sure you want to ${
                nextStatus ? "activate" : "deactivate"
            } user "${user.username}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUserActionId(user.id);

            const response = await api.put(
                `/api/auth/admin/users/${user.id}/`,
                { is_active: nextStatus }
            );

            const updatedUser =
                response.data?.user || null;

            setUsers((previous) =>
                previous.map((item) =>
                    item.id === user.id
                        ? {
                              ...item,
                              ...(updatedUser || {}),
                              is_active: nextStatus,
                          }
                        : item
                )
            );

            if (selectedUser?.id === user.id) {
                setSelectedUser((previous) => ({
                    ...previous,
                    ...(updatedUser || {}),
                    is_active: nextStatus,
                }));
            }

            setMessage(
                `✅ User "${user.username}" ${
                    nextStatus ? "activated" : "deactivated"
                } successfully.`
            );

            if (user.role === "DELIVERY_PARTNER") {
                setStats((previous) => ({
                    ...previous,
                    active_delivery_partners: nextStatus
                        ? previous.active_delivery_partners + 1
                        : Math.max(previous.active_delivery_partners - 1, 0),
                    inactive_delivery_partners: nextStatus
                        ? Math.max(previous.inactive_delivery_partners - 1, 0)
                        : previous.inactive_delivery_partners + 1,
                }));
            }
        } catch (error) {
            console.error(
                "Toggle user status error:",
                error
            );

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to update user status."
            );
        } finally {
            setUserActionId(null);
        }
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

            const existingPartner =
                orderData?.delivery_partner ||
                orderData?.assigned_delivery_partner ||
                null;

            const existingPartnerId =
                orderData?.delivery_partner_id ||
                existingPartner?.id ||
                existingPartner?.user_id ||
                "";

            if (existingPartner) {
                setOrderDeliveryAssignments((previous) => ({
                    ...previous,
                    [orderData.id]: existingPartner,
                }));
            }

            setSelectedDeliveryPartnerId(
                existingPartnerId ? String(existingPartnerId) : ""
            );

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
    // ASSIGN DELIVERY PARTNER TO ORDER
    // ==========================================

    const handleAssignDeliveryPartner = async () => {
        if (!selectedOrder) {
            return;
        }

        if (!selectedDeliveryPartnerId) {
            setMessage("Please select a delivery partner.");
            return;
        }

        const partner = deliveryPartners.find(
            (item) => String(item.user_id) === String(selectedDeliveryPartnerId)
        );

        if (!partner) {
            setMessage("Selected delivery partner was not found.");
            return;
        }

        if (partner.approval_status !== "APPROVED" || partner.is_active !== true) {
            setMessage("Only approved and active delivery partners can be assigned.");
            return;
        }

        try {
            setDeliveryAssignmentLoading(true);
            setMessage("");

            const response = await api.put(
                `/api/orders/${selectedOrder.id}/assign-delivery/`,
                {
                    delivery_partner_id: Number(selectedDeliveryPartnerId),
                }
            );

            const responseOrder =
                response.data?.order ||
                response.data?.updated_order ||
                null;

            const assignedPartner =
                response.data?.delivery_partner ||
                responseOrder?.delivery_partner ||
                partner;

            setOrderDeliveryAssignments((previous) => ({
                ...previous,
                [selectedOrder.id]: assignedPartner,
            }));

            setSelectedOrder((previousOrder) => ({
                ...previousOrder,
                ...(responseOrder || {}),
                delivery_partner: assignedPartner,
                delivery_partner_id:
                    assignedPartner?.user_id ||
                    assignedPartner?.id ||
                    Number(selectedDeliveryPartnerId),
            }));

            setSelectedDeliveryPartnerId(String(partner.user_id));

            setMessage(
                response.data?.message ||
                    `✅ Order #${selectedOrder.id} assigned to ${
                        partner.full_name || partner.username || "delivery partner"
                    } successfully.`
            );

            await fetchOrders();
            await fetchNotifications();
        } catch (error) {
            console.error("Assign delivery partner error:", error);

            setMessage(
                error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    "Unable to assign delivery partner to this order."
            );
        } finally {
            setDeliveryAssignmentLoading(false);
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
                        icon="🚚"
                        title="Delivery Partners"
                        value={
                            stats.total_delivery_partners
                        }
                    />

                    <StatCard
                        icon="🟢"
                        title="Active Delivery Partners"
                        value={
                            stats.active_delivery_partners
                        }
                    />

                    <StatCard
                        icon="⚪"
                        title="Inactive Delivery Partners"
                        value={
                            stats.inactive_delivery_partners
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

                    <StatCard
                        icon="🟢"
                        title="Active Users"
                        value={
                            stats.active_users
                        }
                    />

                    <StatCard
                        icon="✅"
                        title="Verified Farmers"
                        value={
                            stats.verified_farmers
                        }
                    />

                    <StatCard
                        icon="⏳"
                        title="Pending Farmers"
                        value={
                            stats.pending_farmers
                        }
                    />

                    <StatCard
                        icon="📋"
                        title="Pending Orders"
                        value={
                            stats.pending_orders
                        }
                    />

                    <StatCard
                        icon="🚚"
                        title="Delivered Orders"
                        value={
                            stats.delivered_orders
                        }
                    />

                    <StatCard
                        icon="💰"
                        title="Successful Payments"
                        value={
                            stats.successful_payments
                        }
                    />

                    <StatCard
                        icon="₹"
                        title="Total Revenue"
                        value={`₹${Number(stats.total_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                            onClick={() => {
                                handleNavigation("users");
                                setUserRoleFilter("DELIVERY_PARTNER");
                            }}
                        >
                            <span>🚚</span>

                            <div>
                                <strong>
                                    Delivery Partner Management
                                </strong>

                                <small>
                                    {stats.total_delivery_partners} partner(s) •{" "}
                                    {stats.active_delivery_partners} active •{" "}
                                    {stats.inactive_delivery_partners} inactive
                                </small>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="admin-overview-card"
                            onClick={() =>
                                handleNavigation(
                                    "delivery-partners"
                                )
                            }
                        >
                            <span>📝</span>

                            <div>
                                <strong>
                                    Delivery Applications
                                </strong>

                                <small>
                                    Review pending delivery partner registrations
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
                    <div
                        className="admin-section-header"
                        style={{
                            gap: "12px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <span className="admin-section-label">
                                USER DIRECTORY
                            </span>

                            <h2>
                                {userRoleFilter === "DELIVERY_PARTNER"
                                    ? `${stats.total_delivery_partners} Delivery Partners`
                                    : "All Registered Users"}
                            </h2>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(event) =>
                                    setUserSearch(event.target.value)
                                }
                                placeholder="Search username, email, phone, role or ID..."
                                style={{
                                    flex: "1 1 280px",
                                    minWidth: "220px",
                                }}
                            />

                            <select
                                value={userRoleFilter}
                                onChange={(event) =>
                                    setUserRoleFilter(event.target.value)
                                }
                                style={{
                                    minWidth: "160px",
                                }}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="CUSTOMER">Customer</option>
                                <option value="FARMER">Farmer</option>
                                <option value="DELIVERY_PARTNER">Delivery Partner</option>
                                <option value="ADMIN">Admin</option>
                            </select>

                            <select
                                value={userStatusFilter}
                                onChange={(event) =>
                                    setUserStatusFilter(event.target.value)
                                }
                                style={{
                                    minWidth: "150px",
                                }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>

                            <button
                                type="button"
                                className="admin-save-button"
                                onClick={fetchUsers}
                                disabled={usersLoading}
                            >
                                {usersLoading ? "Refreshing..." : "↻ Refresh"}
                            </button>
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="admin-empty-state">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="admin-empty-state">
                            No users found.
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="admin-empty-state">
                            No users match the selected search or filters.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>

                                            <td>
                                                <strong>
                                                    {user.username}
                                                </strong>
                                            </td>

                                            <td>
                                                {user.email || "-"}
                                            </td>

                                            <td>
                                                {user.phone || "-"}
                                            </td>

                                            <td>
                                                <span className="role-badge">
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className="order-status-badge"
                                                    style={{
                                                        background: user.is_active
                                                            ? "#e8f7ee"
                                                            : "#fdecec",
                                                        color: user.is_active
                                                            ? "#218739"
                                                            : "#c0392b",
                                                    }}
                                                >
                                                    {user.is_active
                                                        ? "ACTIVE"
                                                        : "INACTIVE"}
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    className="admin-action-buttons"
                                                    style={{
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="admin-edit-button"
                                                        onClick={() =>
                                                            handleViewUser(user)
                                                        }
                                                        disabled={
                                                            userActionId === user.id ||
                                                            actionLoading
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-edit-button"
                                                        onClick={() =>
                                                            handleEditClick(user)
                                                        }
                                                        disabled={
                                                            userActionId === user.id ||
                                                            actionLoading
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-save-button"
                                                        onClick={() =>
                                                            handleToggleUserStatus(user)
                                                        }
                                                        disabled={
                                                            userActionId === user.id ||
                                                            actionLoading ||
                                                            user.id === adminProfile?.id
                                                        }
                                                    >
                                                        {user.is_active
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-delete-button"
                                                        onClick={() =>
                                                            handleDeleteUser(user)
                                                        }
                                                        disabled={
                                                            userActionId === user.id ||
                                                            actionLoading
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedUser && (
                    <div className="admin-edit-section">
                        <div className="admin-edit-header">
                            <div>
                                <span>
                                    USER ACCOUNT
                                </span>

                                <h2>
                                    👤 User Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-delete-button"
                                onClick={() =>
                                    setSelectedUser(null)
                                }
                            >
                                Close
                            </button>
                        </div>

                        <div
                            className="admin-form-grid"
                            style={{
                                marginTop: "18px",
                            }}
                        >
                            <div className="admin-form-group">
                                <label>User ID</label>
                                <input
                                    type="text"
                                    value={selectedUser.id ?? ""}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={selectedUser.username || ""}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Email</label>
                                <input
                                    type="text"
                                    value={selectedUser.email || "-"}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={selectedUser.phone || "-"}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value={selectedUser.role || "-"}
                                    disabled
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Account Status</label>
                                <input
                                    type="text"
                                    value={
                                        selectedUser.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                )}

                {editingUser && renderEditUser()}
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
                                            Delivery Partner
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
                                                    {(() => {
                                                        const assigned =
                                                            order.delivery_partner ||
                                                            order.assigned_delivery_partner ||
                                                            orderDeliveryAssignments[order.id];

                                                        return assigned?.full_name ||
                                                            assigned?.username ||
                                                            (assigned?.id ? `Partner #${assigned.id}` : "Not Assigned");
                                                    })()}
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
    // ORDER DETAILS - POPUP MODAL
    // ==========================================

    const renderOrderDetails = () => {
        if (!selectedOrder) {
            return null;
        }

        const orderItems =
            selectedOrder.items ||
            selectedOrder.order_items ||
            [];

        const statusSteps = [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
        ];

        const currentStatus = selectedOrder.status || "PENDING";
        const currentStatusIndex = statusSteps.indexOf(currentStatus);

        const closeOrderDetails = () => {
            if (orderStatusLoading) {
                return;
            }

            setSelectedOrder(null);
            setSelectedOrderStatus("");
            setSelectedDeliveryPartnerId("");
            setMessage("");
        };

        return (
            <div
                className="customer-order-modal-overlay"
                onClick={closeOrderDetails}
                role="presentation"
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    background: "rgba(0, 0, 0, 0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                    overflowY: "auto",
                    boxSizing: "border-box",
                }}
            >
                <div
                    className="order-details customer-order-modal"
                    onClick={(event) => event.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-order-details-title"
                    style={{
                        width: "100%",
                        maxWidth: "900px",
                        maxHeight: "92vh",
                        overflowY: "auto",
                        margin: "auto",
                        position: "relative",
                        background: "#ffffff",
                        borderRadius: "18px",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                        padding: "28px",
                        boxSizing: "border-box",
                    }}
                >
                    {/* MODAL HEADER */}
                    <div
                        className="order-details-header"
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "20px",
                            marginBottom: "22px",
                        }}
                    >
                        <div>
                            <span className="customer-order-modal-label">
                                ORDER DETAILS
                            </span>
                            <h2 id="admin-order-details-title">
                                📦 Order #{selectedOrder.id}
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="close-details-button"
                            onClick={closeOrderDetails}
                            disabled={orderStatusLoading}
                            aria-label="Close order details"
                        >
                            ✕
                        </button>
                    </div>

                    {/* BASIC ORDER INFORMATION */}
                    <div
                        className="admin-order-summary"
                        style={{
                            marginBottom: "24px",
                        }}
                    >
                        <p>
                            <strong>Customer:</strong>{" "}
                            {selectedOrder.customer_username ||
                                selectedOrder.customer_name ||
                                selectedOrder.customer?.username ||
                                selectedOrder.customer?.email ||
                                selectedOrder.customer ||
                                "N/A"}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            <span className="order-status-badge">
                                {currentStatus}
                            </span>
                        </p>

                        <p>
                            <strong>Total Amount:</strong>{" "}
                            ₹
                            {selectedOrder.total_amount ??
                                selectedOrder.total_price ??
                                selectedOrder.total ??
                                "0.00"}
                        </p>

                        <p>
                            <strong>Created:</strong>{" "}
                            {selectedOrder.created_at
                                ? new Date(
                                      selectedOrder.created_at
                                  ).toLocaleString()
                                : "N/A"}
                        </p>
                    </div>

                    {/* ORDER TRACKING */}
                    <div
                        className="order-timeline"
                        style={{
                            marginBottom: "26px",
                        }}
                    >
                        <h3>📦 Order Tracking</h3>

                        {statusSteps.map((step, index) => {
                            const completed =
                                currentStatus !== "CANCELLED" &&
                                currentStatusIndex >= index;

                            return (
                                <div
                                    className={`timeline-step ${
                                        completed
                                            ? "timeline-completed"
                                            : ""
                                    }`}
                                    key={step}
                                >
                                    <div className="timeline-icon">
                                        {completed ? "✓" : "○"}
                                    </div>

                                    <div className="timeline-content">
                                        <strong>{step}</strong>

                                        {index < statusSteps.length - 1 && (
                                            <div className="timeline-line"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {currentStatus === "CANCELLED" && (
                            <div className="timeline-cancelled">
                                <div className="timeline-icon">✕</div>
                                <div className="timeline-content">
                                    <strong>ORDER CANCELLED</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DELIVERY ADDRESS */}
                    <div
                        className="order-delivery-address"
                        style={{
                            marginBottom: "26px",
                        }}
                    >
                        <div className="delivery-address-header">
                            <div className="delivery-address-icon">📍</div>
                            <div>
                                <h3>Delivery Address</h3>
                                <p>Address used for this order</p>
                            </div>
                        </div>

                        {selectedOrder.delivery_address_line1 ? (
                            <div className="delivery-address-content">
                                <div className="delivery-address-name-row">
                                    <strong>
                                        {selectedOrder.delivery_name || "N/A"}
                                    </strong>
                                    <span>
                                        {selectedOrder.delivery_phone || "N/A"}
                                    </span>
                                </div>

                                <p>
                                    {selectedOrder.delivery_address_line1}
                                </p>

                                {selectedOrder.delivery_address_line2 && (
                                    <p>
                                        {selectedOrder.delivery_address_line2}
                                    </p>
                                )}

                                <p>
                                    {selectedOrder.delivery_city || ""}
                                    {selectedOrder.delivery_city &&
                                    selectedOrder.delivery_state
                                        ? ", "
                                        : ""}
                                    {selectedOrder.delivery_state || ""}
                                    {selectedOrder.delivery_postal_code
                                        ? ` - ${selectedOrder.delivery_postal_code}`
                                        : ""}
                                </p>

                                {selectedOrder.delivery_country && (
                                    <p>
                                        {selectedOrder.delivery_country}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="delivery-address-unavailable">
                                <span>⚠️</span>
                                <p>
                                    Delivery address information is not
                                    available for this order.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PRODUCTS */}
                    <h3 className="admin-subheading">🛒 Products</h3>

                    {orderItems.length > 0 ? (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price/kg</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orderItems.map((item, index) => (
                                        <tr
                                            key={
                                                item.id ||
                                                `${selectedOrder.id}-${index}`
                                            }
                                        >
                                            <td>
                                                {item.product_name ||
                                                    item.product?.name ||
                                                    item.product ||
                                                    "N/A"}
                                            </td>
                                            <td>
                                                {item.quantity ?? "N/A"}
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>No items found.</p>
                    )}

                    {/* DELIVERY PARTNER ASSIGNMENT */}
                    <div
                        className="admin-order-status-section"
                        style={{
                            marginTop: "26px",
                            padding: "20px",
                            borderRadius: "14px",
                            background: "#f7faf8",
                            border: "1px solid #e1ebe4",
                        }}
                    >
                        <h3>🚚 Assign Delivery Partner</h3>

                        <p style={{ marginTop: "6px", marginBottom: "16px" }}>
                            Select an approved and active delivery partner for this order.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                            }}
                        >
                            <div
                                className="admin-form-group"
                                style={{ flex: "1 1 280px", marginBottom: 0 }}
                            >
                                <label htmlFor="admin-delivery-partner-select">
                                    Delivery Partner
                                </label>

                                <select
                                    id="admin-delivery-partner-select"
                                    value={selectedDeliveryPartnerId}
                                    onChange={(event) =>
                                        setSelectedDeliveryPartnerId(event.target.value)
                                    }
                                    disabled={deliveryAssignmentLoading}
                                >
                                    <option value="">
                                        Select Delivery Partner
                                    </option>

                                    {deliveryPartners
                                        .filter(
                                            (partner) =>
                                                partner.approval_status === "APPROVED" &&
                                                partner.is_active === true
                                        )
                                        .map((partner) => (
                                            <option
                                                key={partner.user_id || partner.id}
                                                value={partner.user_id || partner.id}
                                            >
                                                {partner.full_name || partner.username || `Partner #${partner.id}`}
                                                {partner.vehicle_number
                                                    ? ` • ${partner.vehicle_number}`
                                                    : ""}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                className="admin-save-button"
                                onClick={handleAssignDeliveryPartner}
                                disabled={
                                    deliveryAssignmentLoading ||
                                    !selectedDeliveryPartnerId
                                }
                            >
                                {deliveryAssignmentLoading
                                    ? "Assigning..."
                                    : "🚚 Assign Partner"}
                            </button>
                        </div>

                        {(() => {
                            const assigned =
                                selectedOrder.delivery_partner ||
                                selectedOrder.assigned_delivery_partner ||
                                orderDeliveryAssignments[selectedOrder.id];

                            return assigned ? (
                                <div
                                    style={{
                                        marginTop: "16px",
                                        padding: "12px 14px",
                                        borderRadius: "10px",
                                        background: "#eef8f1",
                                    }}
                                >
                                    <strong>Currently Assigned:</strong>{" "}
                                    {assigned.full_name ||
                                        assigned.username ||
                                        `Partner #${assigned.user_id || assigned.id || selectedDeliveryPartnerId}`}
                                    {assigned.vehicle_number
                                        ? ` • ${assigned.vehicle_number}`
                                        : ""}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        marginTop: "16px",
                                        fontSize: "14px",
                                        opacity: 0.75,
                                    }}
                                >
                                    No delivery partner assigned yet.
                                </div>
                            );
                        })()}
                    </div>

                    {/* ADMIN STATUS UPDATE */}
                    <div
                        className="admin-order-status-section"
                        style={{
                            marginTop: "26px",
                        }}
                    >
                        <h3>🔄 Update Order Status</h3>

                        <div className="admin-form-group">
                            <label>Change Status</label>

                            <select
                                value={selectedOrderStatus}
                                onChange={(event) =>
                                    setSelectedOrderStatus(
                                        event.target.value
                                    )
                                }
                                disabled={orderStatusLoading}
                            >
                                <option value="">
                                    Select Status
                                </option>
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="admin-save-button"
                            onClick={handleUpdateOrderStatus}
                            disabled={
                                orderStatusLoading ||
                                !selectedOrderStatus ||
                                selectedOrderStatus === selectedOrder.status
                            }
                        >
                            {orderStatusLoading
                                ? "Updating..."
                                : "Update Status"}
                        </button>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: "24px",
                        }}
                    >
                        <button
                            type="button"
                            className="admin-cancel-button"
                            onClick={closeOrderDetails}
                            disabled={orderStatusLoading}
                        >
                            Close
                        </button>
                    </div>
                </div>
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
    // NOTIFICATIONS FILTERING
    // ==========================================

    const filteredNotifications = notifications.filter((notification) => {
        const search = notificationSearch.trim().toLowerCase();

        const title =
            notification.title ||
            notification.notification_type ||
            "Notification";

        const messageText =
            notification.message ||
            notification.text ||
            notification.description ||
            "";

        const recipient =
            notification.username ||
            notification.user_username ||
            notification.recipient_username ||
            notification.user?.username ||
            "";

        const matchesSearch =
            !search ||
            String(title).toLowerCase().includes(search) ||
            String(messageText).toLowerCase().includes(search) ||
            String(recipient).toLowerCase().includes(search) ||
            String(notification.notification_type || "")
                .toLowerCase()
                .includes(search);

        const isRead =
            notification.is_read === true ||
            notification.is_read === 1;

        const matchesFilter =
            notificationFilter === "ALL" ||
            (notificationFilter === "READ" && isRead) ||
            (notificationFilter === "UNREAD" && !isRead);

        return matchesSearch && matchesFilter;
    });

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
                            View marketplace alerts and account notifications.
                        </p>
                    </div>
                </div>

                <div className="admin-section">
                    <div
                        className="admin-section-header"
                        style={{
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <span className="admin-section-label">
                                NOTIFICATION CENTER
                            </span>

                            <h2>
                                {unreadNotifications} Unread
                            </h2>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                value={notificationSearch}
                                onChange={(event) =>
                                    setNotificationSearch(event.target.value)
                                }
                                placeholder="Search notifications..."
                                style={{ minWidth: "230px" }}
                            />

                            <select
                                value={notificationFilter}
                                onChange={(event) =>
                                    setNotificationFilter(event.target.value)
                                }
                            >
                                <option value="ALL">All</option>
                                <option value="UNREAD">Unread</option>
                                <option value="READ">Read</option>
                            </select>

                            <button
                                type="button"
                                className="admin-save-button"
                                onClick={fetchNotifications}
                                disabled={notificationsLoading}
                            >
                                {notificationsLoading
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>

                            {notifications.length > 0 &&
                                unreadNotifications > 0 && (
                                    <button
                                        type="button"
                                        className="admin-save-button"
                                        onClick={handleMarkAllNotificationsRead}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading
                                            ? "Updating..."
                                            : "Mark All as Read"}
                                    </button>
                                )}
                        </div>
                    </div>

                    {notificationsLoading ? (
                        <div className="admin-empty-state">
                            Loading notifications...
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="admin-empty-state">
                            No notifications found.
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Notification</th>
                                        <th>Message</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredNotifications.map((notification) => {
                                        const isRead =
                                            notification.is_read === true ||
                                            notification.is_read === 1;

                                        return (
                                            <tr key={notification.id}>
                                                <td>
                                                    <strong>
                                                        {notification.title ||
                                                            notification.notification_type ||
                                                            "Notification"}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <div
                                                        style={{
                                                            maxWidth: "360px",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                        title={
                                                            notification.message ||
                                                            notification.text ||
                                                            notification.description ||
                                                            "-"
                                                        }
                                                    >
                                                        {notification.message ||
                                                            notification.text ||
                                                            notification.description ||
                                                            "-"}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="role-badge">
                                                        {isRead ? "READ" : "UNREAD"}
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
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="admin-edit-button"
                                                            onClick={() =>
                                                                setSelectedNotification(
                                                                    notification
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>

                                                        {!isRead ? (
                                                            <button
                                                                type="button"
                                                                className="admin-save-button"
                                                                onClick={() =>
                                                                    handleMarkNotificationRead(
                                                                        notification.id
                                                                    )
                                                                }
                                                            >
                                                                Mark Read
                                                            </button>
                                                        ) : (
                                                            <span>✅ Read</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedNotification && (
                    <div
                        onClick={() => setSelectedNotification(null)}
                        role="presentation"
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 10000,
                            background: "rgba(0, 0, 0, 0.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px",
                            overflowY: "auto",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            onClick={(event) => event.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="admin-notification-details-title"
                            style={{
                                width: "100%",
                                maxWidth: "650px",
                                maxHeight: "85vh",
                                overflowY: "auto",
                                background: "#ffffff",
                                borderRadius: "18px",
                                padding: "28px",
                                boxSizing: "border-box",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: "16px",
                                    marginBottom: "22px",
                                }}
                            >
                                <div>
                                    <span className="admin-section-label">
                                        NOTIFICATION DETAILS
                                    </span>
                                    <h2 id="admin-notification-details-title">
                                        🔔 {selectedNotification.title ||
                                            selectedNotification.notification_type ||
                                            "Notification"}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="close-details-button"
                                    onClick={() =>
                                        setSelectedNotification(null)
                                    }
                                    aria-label="Close notification details"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="admin-order-summary">
                                <p>
                                    <strong>Type:</strong>{" "}
                                    {selectedNotification.notification_type || "N/A"}
                                </p>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {selectedNotification.is_read === true ||
                                    selectedNotification.is_read === 1
                                        ? "READ"
                                        : "UNREAD"}
                                </p>

                                <p>
                                    <strong>Date:</strong>{" "}
                                    {selectedNotification.created_at
                                        ? new Date(
                                              selectedNotification.created_at
                                          ).toLocaleString()
                                        : selectedNotification.timestamp
                                        ? new Date(
                                              selectedNotification.timestamp
                                          ).toLocaleString()
                                        : "N/A"}
                                </p>

                                <p>
                                    <strong>Recipient:</strong>{" "}
                                    {selectedNotification.username ||
                                        selectedNotification.user_username ||
                                        selectedNotification.recipient_username ||
                                        selectedNotification.user?.username ||
                                        "N/A"}
                                </p>
                            </div>

                            <div
                                style={{
                                    marginTop: "22px",
                                    padding: "18px",
                                    borderRadius: "12px",
                                    background: "#f7f7f7",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {selectedNotification.message ||
                                    selectedNotification.text ||
                                    selectedNotification.description ||
                                    "No notification message available."}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "10px",
                                    marginTop: "24px",
                                }}
                            >
                                {!(
                                    selectedNotification.is_read === true ||
                                    selectedNotification.is_read === 1
                                ) && (
                                    <button
                                        type="button"
                                        className="admin-save-button"
                                        onClick={async () => {
                                            await handleMarkNotificationRead(
                                                selectedNotification.id
                                            );
                                            setSelectedNotification((previous) =>
                                                previous
                                                    ? {
                                                          ...previous,
                                                          is_read: true,
                                                      }
                                                    : previous
                                            );
                                        }}
                                    >
                                        Mark as Read
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="admin-cancel-button"
                                    onClick={() =>
                                        setSelectedNotification(null)
                                    }
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                    "delivery-partners" &&
                    renderDeliveryPartners()}

                {activePage ===
                    "farmer-verification" &&
                    renderFarmerVerification()}

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