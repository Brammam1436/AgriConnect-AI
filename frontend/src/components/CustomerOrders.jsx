import { useEffect, useState } from "react";
import api from "../api/api";

function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const handleCancelOrder = async (orderId) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel Order #${orderId}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await api.post(
                `/api/orders/${orderId}/cancel/`
            );

            if (response.status === 200) {
                alert("Order cancelled successfully.");

                setSelectedOrder(null);
                setPayment(null);

                await fetchOrders();
            }
        } catch (err) {
            console.error(err);

            const message =
                err.response?.data?.detail ||
                "Unable to cancel the order.";

            alert(message);
        }
    };

    const fetchPaymentDetails = async (orderId) => {
        try {
            setPaymentLoading(true);
            setPayment(null);

            const response = await api.get(
                `/api/payments/${orderId}/`
            );

            setPayment(response.data);
        } catch (err) {
            console.error(err);
            setPayment(null);
        } finally {
            setPaymentLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get("/api/orders/");

            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Unable to load orders.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusClass = (status) => {
        switch (status) {
            case "DELIVERED":
                return "status-delivered";

            case "CONFIRMED":
                return "status-confirmed";

            case "PROCESSING":
                return "status-processing";

            case "SHIPPED":
                return "status-shipped";

            case "CANCELLED":
                return "status-cancelled";

            case "PENDING":
                return "status-pending";

            default:
                return "status-pending";
        }
    };

    const getStatusSteps = (status) => {
        const steps = [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
        ];

        const currentIndex = steps.indexOf(status);

        return steps.map((step, index) => ({
            name: step,
            completed:
                currentIndex >= 0 && index <= currentIndex,
        }));
    };


    if (loading) {
        return (
            <div className="orders-container">
                <h2>My Orders</h2>
                <p>Loading orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-container">
                <h2>My Orders</h2>
                <p className="error-text">{error}</p>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h2>🛒 My Orders</h2>

            {orders.length === 0 ? (
                <div className="empty-orders">
                    <p>No orders found.</p>
                    <p>Start shopping from our farmers!</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <div className="order-card" key={order.id}>

                            {/* Order Header */}
                            <div className="order-header">
                                <div>
                                    <h3>Order #{order.id}</h3>
                                </div>

                                <span
                                    className={`status-badge ${getStatusClass(
                                        order.status
                                    )}`}
                                >
                                    {order.status}
                                </span>
                            </div>

                            {/* Products */}
                            <div className="order-products">
                                <h4>Products</h4>

                               {order.items.map((item) => (
                                    <div
                                        className="product-row"
                                        key={item.id}
                                    >
                                        <div>
                                            <span className="product-name">
                                                🌱 {item.product_name}
                                            </span>

                                            <span className="product-quantity">
                                                {Number(item.quantity).toFixed(2)} kg × ₹
                                                {Number(item.price_per_kg).toFixed(2)}
                                            </span>
                                        </div>

                                        <span className="product-subtotal">
                                            ₹{Number(item.subtotal).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Order Total */}
                            <div className="order-total">
                                <span>Total Amount</span>

                                <strong>
                                    ₹{Number(order.total_amount).toFixed(2)}
                                </strong>
                            </div>
                            <div className="order-actions">
                                <button
                                    className="view-details-button"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        fetchPaymentDetails(order.id);
                                    }}                                >
                                    View Details
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
            {selectedOrder && (
                <div className="order-details">

                    <div className="order-details-header">
                        <h2>Order #{selectedOrder.id}</h2>

                        <button
                            className="close-details-button"
                            onClick={() => setSelectedOrder(null)}
                        >
                            ✕
                        </button>
                    </div>

                    <p>
                        <strong>Status:</strong>{" "}
                        <span
                            className={`status-badge ${getStatusClass(
                                selectedOrder.status
                            )}`}
                        >
                            {selectedOrder.status}
                        </span>
                    </p>

                    <div className="order-timeline">

                        <h3>📦 Order Tracking</h3>

                        {getStatusSteps(selectedOrder.status).map(
                            (step, index) => (
                                <div
                                    className={`timeline-step ${
                                        step.completed
                                            ? "timeline-completed"
                                            : ""
                                    }`}
                                    key={step.name}
                                >
                                    <div className="timeline-icon">
                                        {step.completed ? "✓" : "○"}
                                    </div>

                                    <div className="timeline-content">
                                        <strong>{step.name}</strong>

                                        {index <
                                            getStatusSteps(
                                                selectedOrder.status
                                            ).length -
                                                1 && (
                                            <div className="timeline-line"></div>
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        {selectedOrder.status === "CANCELLED" && (
                            <div className="timeline-cancelled">
                                <div className="timeline-icon">✕</div>

                                <div className="timeline-content">
                                    <strong>ORDER CANCELLED</strong>
                                </div>
                            </div>
                        )}

                    </div>

                    <h3>Products</h3>

                    {selectedOrder.items.map((item) => (
                        <div
                            className="details-product"
                            key={item.id}
                        >
                            <div>
                                <strong>
                                    🌱 {item.product_name}
                                </strong>

                                <p>
                                    {Number(item.quantity).toFixed(2)} kg × ₹
                                    {Number(item.price_per_kg).toFixed(2)}
                                </p>
                            </div>

                            <strong>
                                ₹{Number(item.subtotal).toFixed(2)}
                            </strong>
                        </div>
                    ))}

                    <div className="details-total">
                        <span>Total</span>

                        <strong>
                            ₹{Number(selectedOrder.total_amount).toFixed(2)}
                        </strong>
                    </div>
                    <div className="payment-details">

                        <h3>💳 Payment Information</h3>

                        {paymentLoading ? (
                            <p>Loading payment information...</p>
                        ) : payment ? (
                            <>
                                <p>
                                    <strong>Payment Status:</strong>{" "}
                                    <span className="payment-success">
                                        {payment.status}
                                    </span>
                                </p>

                                <p>
                                    <strong>Amount Paid:</strong>{" "}
                                    ₹{Number(payment.amount).toFixed(2)}
                                </p>

                                <p>
                                    <strong>Razorpay Payment ID:</strong>{" "}
                                    {payment.razorpay_payment_id || "N/A"}
                                </p>

                                <p>
                                    <strong>Razorpay Order ID:</strong>{" "}
                                    {payment.razorpay_order_id}
                                </p>
                            </>
                        ) : (
                            <p>No payment information available.</p>
                        )}

                    </div>
                    {["PENDING", "CONFIRMED"].includes(selectedOrder.status) && (
                        <div className="cancel-order-section">
                            <button
                                className="cancel-order-button"
                                onClick={() =>
                                    handleCancelOrder(selectedOrder.id)
                                }
                            >
                                Cancel Order
                            </button>
                        </div>
                    )}

                    <div className="order-dates">
                        <p>
                            <strong>Order Date:</strong>{" "}
                            {new Date(
                                selectedOrder.created_at
                            ).toLocaleString()}
                        </p>

                        <p>
                            <strong>Last Updated:</strong>{" "}
                            {new Date(
                                selectedOrder.updated_at
                            ).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerOrders;