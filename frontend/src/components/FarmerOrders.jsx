import { useEffect, useState } from "react";
import api from "../api/api";
import "./FarmerOrders.css";

function FarmerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/orders/farmer/");

            setOrders(response.data || []);
        } catch (err) {
            console.error("Farmer orders error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load farmer orders."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) {
            return "N/A";
        }

        return new Date(dateString).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatStatus = (status) => {
        if (!status) {
            return "Unknown";
        }

        return status.charAt(0) + status.slice(1).toLowerCase();
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "PENDING":
                return "farmer-order-status pending";

            case "CONFIRMED":
                return "farmer-order-status confirmed";

            case "PROCESSING":
                return "farmer-order-status processing";

            case "SHIPPED":
                return "farmer-order-status shipped";

            case "DELIVERED":
                return "farmer-order-status delivered";

            case "CANCELLED":
                return "farmer-order-status cancelled";

            default:
                return "farmer-order-status";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "PENDING":
                return "⏳";

            case "CONFIRMED":
                return "✅";

            case "PROCESSING":
                return "⚙️";

            case "SHIPPED":
                return "🚚";

            case "DELIVERED":
                return "📦";

            case "CANCELLED":
                return "❌";

            default:
                return "📋";
        }
    };

    const getOrderItemCount = (order) => {
        return order.items?.length || 0;
    };

    const getFarmerOrderTotal = (order) => {
        return Number(order.farmer_total || 0).toFixed(2);
    };

    const getDeliveryAddress = (order) => {
        const parts = [
            order.delivery_address_line1,
            order.delivery_address_line2,
            order.delivery_city,
            order.delivery_state,
            order.delivery_postal_code,
            order.delivery_country,
        ].filter(Boolean);

        return parts.join(", ");
    };

    const getStats = () => {
        const total = orders.length;

        const pending = orders.filter(
            (order) => order.status === "PENDING"
        ).length;

        const processing = orders.filter(
            (order) =>
                order.status === "CONFIRMED" ||
                order.status === "PROCESSING"
        ).length;

        const delivered = orders.filter(
            (order) => order.status === "DELIVERED"
        ).length;

        const totalSales = orders.reduce(
            (sum, order) => {
                return sum + Number(
                    getFarmerOrderTotal(order)
                );
            },
            0
        );

        return {
            total,
            pending,
            processing,
            delivered,
            totalSales: totalSales.toFixed(2),
        };
    };

    const stats = getStats();

    return (
        <div className="farmer-orders-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="farmer-orders-header">

                <div>
                    <h2>📦 Customer Orders</h2>

                    <p>
                        View and manage orders containing your products.
                    </p>
                </div>

                <button
                    type="button"
                    className="farmer-orders-refresh-button"
                    onClick={fetchOrders}
                    disabled={loading}
                >
                    🔄 {loading ? "Refreshing..." : "Refresh"}
                </button>

            </div>


            {/* =====================================================
                ERROR
            ====================================================== */}

            {error && (
                <div className="farmer-orders-error">
                    ⚠️ {error}
                </div>
            )}


            {/* =====================================================
                SUMMARY
            ====================================================== */}

            {!loading && !error && (
                <div className="farmer-orders-summary-grid">

                    <div className="farmer-orders-summary-card">

                        <div className="farmer-orders-summary-icon">
                            📦
                        </div>

                        <div>
                            <span className="farmer-orders-summary-label">
                                Total Orders
                            </span>

                            <strong className="farmer-orders-summary-value">
                                {stats.total}
                            </strong>
                        </div>

                    </div>


                    <div className="farmer-orders-summary-card">

                        <div className="farmer-orders-summary-icon">
                            ⏳
                        </div>

                        <div>
                            <span className="farmer-orders-summary-label">
                                Pending
                            </span>

                            <strong className="farmer-orders-summary-value">
                                {stats.pending}
                            </strong>
                        </div>

                    </div>


                    <div className="farmer-orders-summary-card">

                        <div className="farmer-orders-summary-icon">
                            ⚙️
                        </div>

                        <div>
                            <span className="farmer-orders-summary-label">
                                Processing
                            </span>

                            <strong className="farmer-orders-summary-value">
                                {stats.processing}
                            </strong>
                        </div>

                    </div>


                    <div className="farmer-orders-summary-card">

                        <div className="farmer-orders-summary-icon">
                            📦
                        </div>

                        <div>
                            <span className="farmer-orders-summary-label">
                                Delivered
                            </span>

                            <strong className="farmer-orders-summary-value">
                                {stats.delivered}
                            </strong>
                        </div>

                    </div>


                    <div className="farmer-orders-summary-card">

                        <div className="farmer-orders-summary-icon">
                            💰
                        </div>

                        <div>
                            <span className="farmer-orders-summary-label">
                                Your Product Sales
                            </span>

                            <strong className="farmer-orders-summary-value">
                                ₹{stats.totalSales}
                            </strong>
                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                LOADING
            ====================================================== */}

            {loading && (
                <div className="farmer-orders-loading">
                    <div className="farmer-orders-loading-icon">
                        📦
                    </div>

                    <h3>
                        Loading Orders...
                    </h3>

                    <p>
                        Please wait while we fetch your customer orders.
                    </p>
                </div>
            )}


            {/* =====================================================
                EMPTY STATE
            ====================================================== */}

            {!loading && !error && orders.length === 0 && (
                <div className="farmer-orders-empty">

                    <div className="farmer-orders-empty-icon">
                        📦
                    </div>

                    <h3>
                        No Orders Yet
                    </h3>

                    <p>
                        You don't have any customer orders containing
                        your products yet.
                    </p>

                </div>
            )}


            {/* =====================================================
                ORDERS LIST
            ====================================================== */}

            {!loading && !error && orders.length > 0 && (

                <div className="farmer-orders-list">

                    {orders.map((order) => (

                        <div
                            className="farmer-order-card"
                            key={order.id}
                        >

                            {/* Order Header */}

                            <div className="farmer-order-card-header">

                                <div>

                                    <span className="farmer-order-label">
                                        Order ID
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
                                    {getStatusIcon(order.status)}
                                    {" "}
                                    {formatStatus(order.status)}
                                </span>

                            </div>


                            {/* Customer Information */}

                            <div className="farmer-order-customer">

                                <div className="farmer-order-info-item">

                                    <span className="farmer-order-info-icon">
                                        👤
                                    </span>

                                    <div>
                                        <small>
                                            Customer
                                        </small>

                                        <strong>
                                            {order.customer_username ||
                                                order.delivery_name ||
                                                "Customer"}
                                        </strong>
                                    </div>

                                </div>


                                <div className="farmer-order-info-item">

                                    <span className="farmer-order-info-icon">
                                        📅
                                    </span>

                                    <div>
                                        <small>
                                            Order Date
                                        </small>

                                        <strong>
                                            {formatDate(
                                                order.created_at
                                            )}
                                        </strong>
                                    </div>

                                </div>


                                <div className="farmer-order-info-item">

                                    <span className="farmer-order-info-icon">
                                        🛒
                                    </span>

                                    <div>
                                        <small>
                                            Your Products
                                        </small>

                                        <strong>
                                            {getOrderItemCount(order)}
                                        </strong>
                                    </div>

                                </div>

                            </div>


                            {/* Farmer Products */}

                            <div className="farmer-order-products">

                                <h4>
                                    🌱 Your Products in this Order
                                </h4>

                                {order.items?.map((item) => (

                                    <div
                                        className="farmer-order-product-row"
                                        key={item.id}
                                    >

                                        <div className="farmer-order-product-name">

                                            <strong>
                                                {item.product_name}
                                            </strong>

                                            <span>
                                                {item.quantity} kg × ₹
                                                {Number(
                                                    item.price_per_kg
                                                ).toFixed(2)}
                                                /kg
                                            </span>

                                        </div>

                                        <strong className="farmer-order-product-subtotal">
                                            ₹
                                            {Number(
                                                item.subtotal
                                            ).toFixed(2)}
                                        </strong>

                                    </div>

                                ))}

                            </div>


                            {/* Order Footer */}

                            <div className="farmer-order-card-footer">

                                <div>

                                    <span>
                                        Your Product Total
                                    </span>

                                    <strong>
                                        ₹{getFarmerOrderTotal(order)}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="farmer-order-view-button"
                                    onClick={() =>
                                        setSelectedOrder(order)
                                    }
                                >
                                    👁️ View Details
                                </button>

                            </div>

                        </div>

                    ))}

                </div>
            )}


            {/* =====================================================
                ORDER DETAILS MODAL
            ====================================================== */}

            {selectedOrder && (

                <div
                    className="farmer-order-modal-overlay"
                    onClick={() => setSelectedOrder(null)}
                >

                    <div
                        className="farmer-order-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* Modal Header */}

                        <div className="farmer-order-modal-header">

                            <div>
                                <span>
                                    Customer Order
                                </span>

                                <h3>
                                    Order #{selectedOrder.id}
                                </h3>
                            </div>

                            <button
                                type="button"
                                className="farmer-order-modal-close"
                                onClick={() =>
                                    setSelectedOrder(null)
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* Status */}

                        <div className="farmer-order-modal-status">

                            <span>
                                Order Status
                            </span>

                            <strong
                                className={getStatusClass(
                                    selectedOrder.status
                                )}
                            >
                                {getStatusIcon(
                                    selectedOrder.status
                                )}
                                {" "}
                                {formatStatus(
                                    selectedOrder.status
                                )}
                            </strong>

                        </div>


                        {/* Customer */}

                        <div className="farmer-order-modal-section">

                            <h4>
                                👤 Customer Information
                            </h4>

                            <div className="farmer-order-detail-grid">

                                <div>
                                    <span>
                                        Username
                                    </span>

                                    <strong>
                                        {selectedOrder.customer_username ||
                                            "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Name
                                    </span>

                                    <strong>
                                        {selectedOrder.delivery_name ||
                                            "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Phone
                                    </span>

                                    <strong>
                                        {selectedOrder.delivery_phone ||
                                            "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Order Date
                                    </span>

                                    <strong>
                                        {formatDate(
                                            selectedOrder.created_at
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* Delivery Address */}

                        <div className="farmer-order-modal-section">

                            <h4>
                                📍 Delivery Address
                            </h4>

                            <p className="farmer-order-address">
                                {getDeliveryAddress(
                                    selectedOrder
                                )}
                            </p>

                        </div>


                        {/* Products */}

                        <div className="farmer-order-modal-section">

                            <h4>
                                🌱 Your Products
                            </h4>

                            <div className="farmer-order-modal-products">

                                {selectedOrder.items?.map(
                                    (item) => (

                                        <div
                                            className="farmer-order-modal-product"
                                            key={item.id}
                                        >

                                            <div>
                                                <strong>
                                                    {item.product_name}
                                                </strong>

                                                <span>
                                                    Quantity:{" "}
                                                    {item.quantity} kg
                                                </span>
                                            </div>

                                            <strong>
                                                ₹
                                                {Number(
                                                    item.subtotal
                                                ).toFixed(2)}
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* Total */}

                        <div className="farmer-order-modal-total">

                            <span>
                                Your Product Total
                            </span>

                            <strong>
                                ₹
                                {getFarmerOrderTotal(
                                    selectedOrder
                                )}
                            </strong>

                        </div>


                        {/* Status Information */}

                        <div className="farmer-order-status-note">

                            ℹ️ Order status is currently managed by
                            the administrator.

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default FarmerOrders;