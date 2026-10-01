import { useEffect, useState } from "react";
import api from "../api/api";

const RAZORPAY_KEY_ID = "rzp_test_Tb9K0WydM5EmRH";

function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // ==========================================
    // CANCEL ORDER
    // ==========================================

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
                setPaymentSuccess(false);

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

    // ==========================================
    // FETCH PAYMENT DETAILS
    // ==========================================

    const fetchPaymentDetails = async (orderId) => {
        try {
            setPaymentLoading(true);
            setPayment(null);
            setPaymentSuccess(false);

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

    // ==========================================
    // FETCH ORDERS
    // ==========================================

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

    // ==========================================
    // RAZORPAY PAYMENT
    // ==========================================

    const handlePayment = async () => {
        if (!selectedOrder) {
            return;
        }

        try {
            setPaymentLoading(true);

            const token =
                localStorage.getItem("access_token");

            if (!token) {
                alert("Please login before making payment.");
                setPaymentLoading(false);
                return;
            }

            // ------------------------------------------
            // CREATE / GET RAZORPAY PAYMENT ORDER
            // ------------------------------------------

            const response = await api.post(
                `/api/payments/${selectedOrder.id}/create/`,
                {}
            );

            const paymentData = response.data;

            if (!window.Razorpay) {
                throw new Error(
                    "Razorpay Checkout failed to load. Please refresh the page."
                );
            }

            // ------------------------------------------
            // RAZORPAY CHECKOUT OPTIONS
            // ------------------------------------------

            const options = {
                key: RAZORPAY_KEY_ID,

                amount: Math.round(
                    Number(paymentData.amount) * 100
                ),

                currency: "INR",

                name: "AgriConnect AI",

                description:
                    `Payment for Order #${selectedOrder.id}`,

                order_id:
                    paymentData.razorpay_order_id,

                handler: async function (paymentResponse) {
                    try {
                        setPaymentLoading(true);

                        // ------------------------------------------
                        // VERIFY PAYMENT
                        // ------------------------------------------

                        const verifyResponse =
                            await api.post(
                                `/api/payments/${selectedOrder.id}/verify/`,
                                {
                                    razorpay_payment_id:
                                        paymentResponse.razorpay_payment_id,

                                    razorpay_order_id:
                                        paymentResponse.razorpay_order_id,

                                    razorpay_signature:
                                        paymentResponse.razorpay_signature,
                                }
                            );

                        // ------------------------------------------
                        // PAYMENT SUCCESS
                        // ------------------------------------------

                        setPaymentSuccess(true);

                        setPayment(
                            verifyResponse.data.payment
                        );

                        alert(
                            "Payment successful and verified!"
                        );

                        // Refresh order list
                        await fetchOrders();

                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        alert(
                            error.response?.data?.detail ||
                            "Payment verification failed."
                        );
                    } finally {
                        setPaymentLoading(false);
                    }
                },

                prefill: {
                    name: "AgriConnect Customer",
                },

                theme: {
                    color: "#2e7d32",
                },

                modal: {
                    ondismiss: function () {
                        setPaymentLoading(false);
                    },
                },
            };

            // ------------------------------------------
            // OPEN RAZORPAY CHECKOUT
            // ------------------------------------------

            const razorpay =
                new window.Razorpay(options);

            razorpay.open();

        } catch (error) {
            console.error(
                "Payment error:",
                error
            );

            alert(
                error.response?.data?.detail ||
                error.message ||
                "Unable to start payment."
            );

            setPaymentLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchOrders();
    }, []);

    // ==========================================
    // STATUS CSS CLASS
    // ==========================================

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

    // ==========================================
    // ORDER STATUS TIMELINE
    // ==========================================

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
                currentIndex >= 0 &&
                index <= currentIndex,
        }));
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="orders-container">
                <h2>My Orders</h2>
                <p>Loading orders...</p>
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error) {
        return (
            <div className="orders-container">
                <h2>My Orders</h2>
                <p className="error-text">
                    {error}
                </p>
            </div>
        );
    }

    // ==========================================
    // MAIN UI
    // ==========================================

    return (
        <div className="orders-container">

            <h2>🛒 My Orders</h2>

            {/* ==========================================
                ORDERS LIST
            ========================================== */}

            {orders.length === 0 ? (
                <div className="empty-orders">
                    <p>No orders found.</p>
                    <p>
                        Start shopping from our farmers!
                    </p>
                </div>
            ) : (
                <div className="orders-list">

                    {orders.map((order) => (
                        <div
                            className="order-card"
                            key={order.id}
                        >

                            {/* ORDER HEADER */}

                            <div className="order-header">

                                <div>
                                    <h3>
                                        Order #{order.id}
                                    </h3>
                                </div>

                                <span
                                    className={`status-badge ${getStatusClass(
                                        order.status
                                    )}`}
                                >
                                    {order.status}
                                </span>

                            </div>

                            {/* PRODUCTS */}

                            <div className="order-products">

                                <h4>Products</h4>

                                {order.items.map((item) => (
                                    <div
                                        className="product-row"
                                        key={item.id}
                                    >

                                        <div>

                                            <span className="product-name">
                                                🌱{" "}
                                                {item.product_name}
                                            </span>

                                            <span className="product-quantity">
                                                {Number(
                                                    item.quantity
                                                ).toFixed(2)}{" "}
                                                kg × ₹
                                                {Number(
                                                    item.price_per_kg
                                                ).toFixed(2)}
                                            </span>

                                        </div>

                                        <span className="product-subtotal">
                                            ₹
                                            {Number(
                                                item.subtotal
                                            ).toFixed(2)}
                                        </span>

                                    </div>
                                ))}

                            </div>

                            {/* ORDER TOTAL */}

                            <div className="order-total">

                                <span>
                                    Total Amount
                                </span>

                                <strong>
                                    ₹
                                    {Number(
                                        order.total_amount
                                    ).toFixed(2)}
                                </strong>

                            </div>

                            {/* VIEW DETAILS */}

                            <div className="order-actions">

                                <button
                                    className="view-details-button"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setPaymentSuccess(false);
                                        fetchPaymentDetails(
                                            order.id
                                        );
                                    }}
                                >
                                    View Details
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

            {/* ==========================================
                SELECTED ORDER DETAILS
            ========================================== */}

            {selectedOrder && (

                <div className="order-details">

                    {/* DETAILS HEADER */}

                    <div className="order-details-header">

                        <h2>
                            Order #{selectedOrder.id}
                        </h2>

                        <button
                            className="close-details-button"
                            onClick={() => {
                                setSelectedOrder(null);
                                setPayment(null);
                                setPaymentSuccess(false);
                            }}
                        >
                            ✕
                        </button>

                    </div>

                    {/* ORDER STATUS */}

                    <p>

                        <strong>
                            Status:
                        </strong>{" "}

                        <span
                            className={`status-badge ${getStatusClass(
                                selectedOrder.status
                            )}`}
                        >
                            {selectedOrder.status}
                        </span>

                    </p>

                    {/* ==========================================
                        ORDER TRACKING
                    ========================================== */}

                    <div className="order-timeline">

                        <h3>
                            📦 Order Tracking
                        </h3>

                        {getStatusSteps(
                            selectedOrder.status
                        ).map((step, index) => (

                            <div
                                className={`timeline-step ${
                                    step.completed
                                        ? "timeline-completed"
                                        : ""
                                }`}
                                key={step.name}
                            >

                                <div className="timeline-icon">
                                    {step.completed
                                        ? "✓"
                                        : "○"}
                                </div>

                                <div className="timeline-content">

                                    <strong>
                                        {step.name}
                                    </strong>

                                    {index <
                                        getStatusSteps(
                                            selectedOrder.status
                                        ).length - 1 && (
                                        <div className="timeline-line"></div>
                                    )}

                                </div>

                            </div>

                        ))}

                        {selectedOrder.status ===
                            "CANCELLED" && (

                            <div className="timeline-cancelled">

                                <div className="timeline-icon">
                                    ✕
                                </div>

                                <div className="timeline-content">

                                    <strong>
                                        ORDER CANCELLED
                                    </strong>

                                </div>

                            </div>
                        )}

                    </div>

                    {/* ==========================================
                        PRODUCTS DETAILS
                    ========================================== */}

                    <h3>
                        Products
                    </h3>

                    {selectedOrder.items.map((item) => (

                        <div
                            className="details-product"
                            key={item.id}
                        >

                            <div>

                                <strong>
                                    🌱{" "}
                                    {item.product_name}
                                </strong>

                                <p>
                                    {Number(
                                        item.quantity
                                    ).toFixed(2)}{" "}
                                    kg × ₹
                                    {Number(
                                        item.price_per_kg
                                    ).toFixed(2)}
                                </p>

                            </div>

                            <strong>
                                ₹
                                {Number(
                                    item.subtotal
                                ).toFixed(2)}
                            </strong>

                        </div>

                    ))}

                    {/* ORDER TOTAL */}

                    <div className="details-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            ₹
                            {Number(
                                selectedOrder.total_amount
                            ).toFixed(2)}
                        </strong>

                    </div>

                    {/* ==========================================
                        PAYMENT INFORMATION
                    ========================================== */}

                    <div className="payment-details">

                        <h3>
                            💳 Payment Information
                        </h3>

                        {paymentLoading ? (

                            <p>
                                Loading payment information...
                            </p>

                        ) : payment ? (

                            <>

                                {/* PAYMENT STATUS */}

                                <p>
                                    <strong>
                                        Payment Status:
                                    </strong>{" "}

                                    <span className="payment-success">
                                        {payment.status}
                                    </span>
                                </p>

                                {/* PAYMENT AMOUNT */}

                                <p>
                                    <strong>
                                        Amount:
                                    </strong>{" "}
                                    ₹
                                    {Number(
                                        payment.amount
                                    ).toFixed(2)}
                                </p>

                                {/* RAZORPAY PAYMENT ID */}

                                <p>
                                    <strong>
                                        Razorpay Payment ID:
                                    </strong>{" "}

                                    {payment.razorpay_payment_id ||
                                        "N/A"}
                                </p>

                                {/* RAZORPAY ORDER ID */}

                                <p>
                                    <strong>
                                        Razorpay Order ID:
                                    </strong>{" "}

                                    {payment.razorpay_order_id}
                                </p>

                                {/* ==================================
                                    PAY NOW BUTTON
                                ================================== */}

                                {["CREATED", "FAILED"].includes(
                                    payment.status
                                ) &&
                                    !paymentSuccess &&
                                    selectedOrder.status !==
                                        "CANCELLED" && (

                                    <button
                                        type="button"
                                        className="pay-now-button"
                                        onClick={handlePayment}
                                        disabled={
                                            paymentLoading
                                        }
                                    >
                                        {paymentLoading
                                            ? "⏳ Processing Payment..."
                                            : `💳 Pay ₹${Number(
                                                payment.amount
                                            ).toFixed(2)}`}
                                    </button>

                                )}

                                {/* ==================================
                                    PAYMENT COMPLETED
                                ================================== */}

                                {paymentSuccess && (

                                    <div className="payment-completed">

                                        <div className="payment-success-icon">
                                            ✓
                                        </div>

                                        <h3>
                                            Payment Completed
                                        </h3>

                                        <p>
                                            Your payment has
                                            been successfully
                                            verified.
                                        </p>

                                    </div>

                                )}

                            </>

                        ) : (

                            <p>
                                No payment information available.
                            </p>

                        )}

                    </div>

                    {/* ==========================================
                        CANCEL ORDER
                    ========================================== */}

                    {[
                        "PENDING",
                        "CONFIRMED",
                    ].includes(
                        selectedOrder.status
                    ) && (

                        <div className="cancel-order-section">

                            <button
                                className="cancel-order-button"
                                onClick={() =>
                                    handleCancelOrder(
                                        selectedOrder.id
                                    )
                                }
                            >
                                Cancel Order
                            </button>

                        </div>

                    )}

                    {/* ==========================================
                        ORDER DATES
                    ========================================== */}

                    <div className="order-dates">

                        <p>

                            <strong>
                                Order Date:
                            </strong>{" "}

                            {new Date(
                                selectedOrder.created_at
                            ).toLocaleString()}

                        </p>

                        <p>

                            <strong>
                                Last Updated:
                            </strong>{" "}

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