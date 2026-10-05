import { useEffect, useState } from "react";
import api from "../api/api";
import "./CustomerOrders.css";

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
    // REVIEW STATES
    // ==========================================

    const [reviewForms, setReviewForms] = useState({});
    const [productReviews, setProductReviews] = useState({});
    const [reviewLoading, setReviewLoading] = useState({});
    const [reviewMessages, setReviewMessages] = useState({});
    const [reviewErrors, setReviewErrors] = useState({});
    const [reviewSubmitting, setReviewSubmitting] = useState({});
    const [editingReviews, setEditingReviews] = useState({});

    // ==========================================
    // CLOSE ORDER DETAILS
    // ==========================================

    const closeOrderDetails = () => {
        setSelectedOrder(null);
        setPayment(null);
        setPaymentSuccess(false);
        setPaymentLoading(false);
    };

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

                closeOrderDetails();

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

            setOrders(
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || []
            );
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Unable to load orders.");
            setLoading(false);
        }
    };

    // ==========================================
    // OPEN ORDER DETAILS
    // ==========================================

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        setPayment(null);
        setPaymentSuccess(false);

        await fetchPaymentDetails(order.id);

        if (order.status === "DELIVERED") {
            await fetchReviewsForOrder(order);
        }
    };

    // ==========================================
    // FETCH PRODUCT REVIEW
    // ==========================================

    const fetchProductReview = async (productId) => {
        try {
            setReviewLoading((previous) => ({
                ...previous,
                [productId]: true,
            }));

            const response = await api.get(
                `/api/products/${productId}/reviews/`
            );

            setProductReviews((previous) => ({
                ...previous,
                [productId]: response.data,
            }));

            if (response.data.my_review) {
                setReviewForms((previous) => ({
                    ...previous,
                    [productId]: {
                        rating: response.data.my_review.rating,
                        comment: response.data.my_review.comment || "",
                    },
                }));
            }
        } catch (err) {
            console.error(
                `Unable to load review for product ${productId}:`,
                err
            );

            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    "Unable to load review information.",
            }));
        } finally {
            setReviewLoading((previous) => ({
                ...previous,
                [productId]: false,
            }));
        }
    };

    // ==========================================
    // FETCH REVIEWS FOR SELECTED ORDER
    // ==========================================

    const fetchReviewsForOrder = async (order) => {
        if (!order || order.status !== "DELIVERED") {
            return;
        }

        const productIds = [
            ...new Set(
                (order.items || []).map((item) => item.product)
            ),
        ];

        await Promise.all(
            productIds.map((productId) =>
                fetchProductReview(productId)
            )
        );
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

                        setPaymentSuccess(true);

                        setPayment(
                            verifyResponse.data.payment
                        );

                        alert(
                            "Payment successful and verified!"
                        );

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
    // REVIEW FORM CHANGE
    // ==========================================

    const handleReviewChange = (
        productId,
        field,
        value
    ) => {
        setReviewForms((previous) => ({
            ...previous,
            [productId]: {
                ...previous[productId],
                [field]: value,
            },
        }));

        setReviewMessages((previous) => ({
            ...previous,
            [productId]: "",
        }));

        setReviewErrors((previous) => ({
            ...previous,
            [productId]: "",
        }));
    };

    // ==========================================
    // SUBMIT NEW REVIEW
    // ==========================================

    const handleSubmitReview = async (productId) => {
        const form =
            reviewForms[productId] || {};

        const rating =
            Number(form.rating || 0);

        const comment =
            form.comment || "";

        setReviewMessages((previous) => ({
            ...previous,
            [productId]: "",
        }));

        setReviewErrors((previous) => ({
            ...previous,
            [productId]: "",
        }));

        if (rating < 1 || rating > 5) {
            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    "Please select a rating between 1 and 5.",
            }));

            return;
        }

        try {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: true,
            }));

            const response = await api.post(
                `/api/products/${productId}/reviews/`,
                {
                    rating,
                    comment,
                }
            );

            if (response.status === 201) {
                setReviewMessages((previous) => ({
                    ...previous,
                    [productId]:
                        "Review submitted successfully! ⭐",
                }));

                setEditingReviews((previous) => ({
                    ...previous,
                    [productId]: false,
                }));

                await fetchProductReview(productId);
            }
        } catch (err) {
            console.error(
                "Review submission error:",
                err
            );

            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    err.response?.data?.detail ||
                    err.response?.data?.rating?.[0] ||
                    "Unable to submit review.",
            }));
        } finally {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: false,
            }));
        }
    };

    // ==========================================
    // EDIT REVIEW
    // ==========================================

    const handleUpdateReview = async (productId) => {
        const productReview =
            productReviews[productId]?.my_review;

        if (!productReview) {
            return;
        }

        const form =
            reviewForms[productId] || {};

        const rating =
            Number(form.rating || 0);

        const comment =
            form.comment || "";

        if (rating < 1 || rating > 5) {
            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    "Please select a rating between 1 and 5.",
            }));

            return;
        }

        try {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: true,
            }));

            setReviewMessages((previous) => ({
                ...previous,
                [productId]: "",
            }));

            setReviewErrors((previous) => ({
                ...previous,
                [productId]: "",
            }));

            const response = await api.put(
                `/api/products/reviews/${productReview.id}/`,
                {
                    rating,
                    comment,
                }
            );

            if (response.status === 200) {
                setReviewMessages((previous) => ({
                    ...previous,
                    [productId]:
                        "Review updated successfully! ⭐",
                }));

                setEditingReviews((previous) => ({
                    ...previous,
                    [productId]: false,
                }));

                await fetchProductReview(productId);
            }
        } catch (err) {
            console.error(
                "Review update error:",
                err
            );

            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    err.response?.data?.detail ||
                    err.response?.data?.rating?.[0] ||
                    "Unable to update review.",
            }));
        } finally {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: false,
            }));
        }
    };

    // ==========================================
    // DELETE REVIEW
    // ==========================================

    const handleDeleteReview = async (productId) => {
        const productReview =
            productReviews[productId]?.my_review;

        if (!productReview) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete your review?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: true,
            }));

            setReviewMessages((previous) => ({
                ...previous,
                [productId]: "",
            }));

            setReviewErrors((previous) => ({
                ...previous,
                [productId]: "",
            }));

            const response = await api.delete(
                `/api/products/reviews/${productReview.id}/`
            );

            if (response.status === 204) {
                setReviewMessages((previous) => ({
                    ...previous,
                    [productId]:
                        "Review deleted successfully.",
                }));

                setReviewForms((previous) => ({
                    ...previous,
                    [productId]: {
                        rating: "",
                        comment: "",
                    },
                }));

                setEditingReviews((previous) => ({
                    ...previous,
                    [productId]: false,
                }));

                await fetchProductReview(productId);
            }
        } catch (err) {
            console.error(
                "Review delete error:",
                err
            );

            setReviewErrors((previous) => ({
                ...previous,
                [productId]:
                    err.response?.data?.detail ||
                    "Unable to delete review.",
            }));
        } finally {
            setReviewSubmitting((previous) => ({
                ...previous,
                [productId]: false,
            }));
        }
    };

    // ==========================================
    // START EDIT
    // ==========================================

    const handleStartEditReview = (productId) => {
        const myReview =
            productReviews[productId]?.my_review;

        if (!myReview) {
            return;
        }

        setReviewForms((previous) => ({
            ...previous,
            [productId]: {
                rating: myReview.rating,
                comment: myReview.comment || "",
            },
        }));

        setReviewMessages((previous) => ({
            ...previous,
            [productId]: "",
        }));

        setReviewErrors((previous) => ({
            ...previous,
            [productId]: "",
        }));

        setEditingReviews((previous) => ({
            ...previous,
            [productId]: true,
        }));
    };

    // ==========================================
    // CANCEL EDIT
    // ==========================================

    const handleCancelEditReview = (productId) => {
        const myReview =
            productReviews[productId]?.my_review;

        setEditingReviews((previous) => ({
            ...previous,
            [productId]: false,
        }));

        if (myReview) {
            setReviewForms((previous) => ({
                ...previous,
                [productId]: {
                    rating: myReview.rating,
                    comment: myReview.comment || "",
                },
            }));
        }

        setReviewMessages((previous) => ({
            ...previous,
            [productId]: "",
        }));

        setReviewErrors((previous) => ({
            ...previous,
            [productId]: "",
        }));
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchOrders();
    }, []);

    // ==========================================
    // CLOSE MODAL WITH ESCAPE
    // ==========================================

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && selectedOrder) {
                closeOrderDetails();
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [selectedOrder]);

    // ==========================================
    // PREVENT BACKGROUND SCROLL WHILE MODAL IS OPEN
    // ==========================================

    useEffect(() => {
        if (selectedOrder) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedOrder]);

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

            {/* ORDERS LIST */}

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

                            <div className="order-products">

                                <h4>
                                    Products
                                </h4>

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

                            <div className="order-actions">

                                <button
                                    type="button"
                                    className="view-details-button"
                                    onClick={() =>
                                        handleViewDetails(order)
                                    }
                                >
                                    View Details
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

            {/* ==========================================
                SELECTED ORDER DETAILS - POPUP MODAL
            ========================================== */}

            {selectedOrder && (
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
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="customer-order-details-title"
                        style={{
                            width: "100%",
                            maxWidth: "900px",
                            maxHeight: "92vh",
                            overflowY: "auto",
                            margin: "auto",
                            position: "relative",
                            background: "#ffffff",
                            borderRadius: "18px",
                            boxShadow:
                                "0 20px 60px rgba(0, 0, 0, 0.25)",
                            padding: "28px",
                            boxSizing: "border-box",
                        }}
                    >

                        {/* MODAL HEADER */}

                        <div className="order-details-header">

                            <div>
                                <span className="customer-order-modal-label">
                                    ORDER DETAILS
                                </span>

                                <h2 id="customer-order-details-title">
                                    📦 Order #{selectedOrder.id}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="close-details-button"
                                onClick={closeOrderDetails}
                                aria-label="Close order details"
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

                        {/* ORDER TRACKING */}

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

                        {/* DELIVERY ADDRESS */}

                        <div className="order-delivery-address">

                            <div className="delivery-address-header">

                                <div className="delivery-address-icon">
                                    📍
                                </div>

                                <div>

                                    <h3>
                                        Delivery Address
                                    </h3>

                                    <p>
                                        Address used for this order
                                    </p>

                                </div>

                            </div>

                            {selectedOrder.delivery_name ? (
                                <div className="delivery-address-content">

                                    <div className="delivery-address-name-row">

                                        <strong>
                                            {selectedOrder.delivery_name}
                                        </strong>

                                        <span>
                                            {selectedOrder.delivery_phone}
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
                                        {selectedOrder.delivery_city},{" "}
                                        {selectedOrder.delivery_state}{" "}
                                        -{" "}
                                        {selectedOrder.delivery_postal_code}
                                    </p>

                                    <p>
                                        {selectedOrder.delivery_country}
                                    </p>

                                </div>
                            ) : (
                                <div className="delivery-address-unavailable">

                                    <span>
                                        ⚠️
                                    </span>

                                    <p>
                                        Delivery address information is not available
                                        for this order.
                                    </p>

                                </div>
                            )}

                        </div>

                        {/* PRODUCTS DETAILS */}

                        <h3>
                            Products
                        </h3>

                        {(selectedOrder.items || []).map((item) => (
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

                        {/* REVIEW SECTION */}

                        {selectedOrder.status ===
                            "DELIVERED" && (
                            <div className="order-review-section">

                                <div className="order-review-heading">

                                    <div>

                                        <h3>
                                            ⭐ Product Reviews
                                        </h3>

                                        <p>
                                            Share your experience
                                            with the farmer.
                                        </p>

                                    </div>

                                </div>

                                {(selectedOrder.items || []).map(
                                    (item) => {

                                        const productId =
                                            item.product;

                                        const reviewData =
                                            productReviews[
                                                productId
                                            ];

                                        const form =
                                            reviewForms[
                                                productId
                                            ] || {};

                                        const myReview =
                                            reviewData?.my_review;

                                        const isEditing =
                                            editingReviews[
                                                productId
                                            ];

                                        const isLoading =
                                            reviewLoading[
                                                productId
                                            ];

                                        const isSubmitting =
                                            reviewSubmitting[
                                                productId
                                            ];

                                        return (
                                            <div
                                                className="order-review-card"
                                                key={item.id}
                                            >

                                                <div className="order-review-product">

                                                    <strong>
                                                        🌱{" "}
                                                        {item.product_name}
                                                    </strong>

                                                    <span>
                                                        Delivered
                                                    </span>

                                                </div>

                                                {isLoading ? (
                                                    <div className="review-loading">
                                                        Loading review information...
                                                    </div>
                                                ) : myReview &&
                                                  !isEditing ? (
                                                    <div className="customer-existing-review">

                                                        <div className="existing-review-header">

                                                            <strong>
                                                                ⭐ Your Review
                                                            </strong>

                                                            <span>
                                                                {new Date(
                                                                    myReview.updated_at ||
                                                                    myReview.created_at
                                                                ).toLocaleDateString()}
                                                            </span>

                                                        </div>

                                                        <div className="existing-review-rating">

                                                            {[1, 2, 3, 4, 5].map(
                                                                (rating) => (
                                                                    <span
                                                                        key={rating}
                                                                        className={
                                                                            rating <=
                                                                            Number(
                                                                                myReview.rating
                                                                            )
                                                                                ? "existing-star active"
                                                                                : "existing-star"
                                                                        }
                                                                    >
                                                                        ⭐
                                                                    </span>
                                                                )
                                                            )}

                                                            <span className="existing-rating-number">
                                                                {myReview.rating}/5
                                                            </span>

                                                        </div>

                                                        {myReview.comment && (
                                                            <p className="existing-review-comment">
                                                                {myReview.comment}
                                                            </p>
                                                        )}

                                                        <div className="review-action-buttons">

                                                            <button
                                                                type="button"
                                                                className="edit-review-button"
                                                                onClick={() =>
                                                                    handleStartEditReview(
                                                                        productId
                                                                    )
                                                                }
                                                                disabled={
                                                                    isSubmitting
                                                                }
                                                            >
                                                                ✏️ Edit Review
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-review-button"
                                                                onClick={() =>
                                                                    handleDeleteReview(
                                                                        productId
                                                                    )
                                                                }
                                                                disabled={
                                                                    isSubmitting
                                                                }
                                                            >
                                                                {isSubmitting
                                                                    ? "⏳ Processing..."
                                                                    : "🗑️ Delete Review"}
                                                            </button>

                                                        </div>

                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="review-form-title">

                                                            <strong>
                                                                {isEditing
                                                                    ? "✏️ Edit Your Review"
                                                                    : "⭐ Write Your Review"}
                                                            </strong>

                                                        </div>

                                                        <div className="review-rating-field">

                                                            <label>
                                                                Rating
                                                            </label>

                                                            <div className="rating-buttons">

                                                                {[1, 2, 3, 4, 5].map(
                                                                    (rating) => (
                                                                        <button
                                                                            type="button"
                                                                            key={rating}
                                                                            className={
                                                                                Number(
                                                                                    form.rating
                                                                                ) === rating
                                                                                    ? "rating-star selected"
                                                                                    : "rating-star"
                                                                            }
                                                                            onClick={() =>
                                                                                handleReviewChange(
                                                                                    productId,
                                                                                    "rating",
                                                                                    rating
                                                                                )
                                                                            }
                                                                        >
                                                                            ⭐
                                                                        </button>
                                                                    )
                                                                )}

                                                            </div>

                                                        </div>

                                                        <div className="review-comment-field">

                                                            <label>
                                                                Comment
                                                            </label>

                                                            <textarea
                                                                rows="3"
                                                                placeholder="Write your experience with this product..."
                                                                value={
                                                                    form.comment ||
                                                                    ""
                                                                }
                                                                onChange={(event) =>
                                                                    handleReviewChange(
                                                                        productId,
                                                                        "comment",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />

                                                        </div>

                                                        {reviewErrors[
                                                            productId
                                                        ] && (
                                                            <div className="review-error">
                                                                ❌{" "}
                                                                {
                                                                    reviewErrors[
                                                                        productId
                                                                    ]
                                                                }
                                                            </div>
                                                        )}

                                                        {reviewMessages[
                                                            productId
                                                        ] && (
                                                            <div className="review-success">
                                                                ✅{" "}
                                                                {
                                                                    reviewMessages[
                                                                        productId
                                                                    ]
                                                                }
                                                            </div>
                                                        )}

                                                        <div className="review-form-actions">

                                                            <button
                                                                type="button"
                                                                className="submit-review-button"
                                                                onClick={() =>
                                                                    isEditing
                                                                        ? handleUpdateReview(
                                                                              productId
                                                                          )
                                                                        : handleSubmitReview(
                                                                              productId
                                                                          )
                                                                }
                                                                disabled={
                                                                    isSubmitting
                                                                }
                                                            >
                                                                {isSubmitting
                                                                    ? "⏳ Processing..."
                                                                    : isEditing
                                                                        ? "✏️ Update Review"
                                                                        : "⭐ Submit Review"}
                                                            </button>

                                                            {isEditing && (
                                                                <button
                                                                    type="button"
                                                                    className="cancel-edit-review-button"
                                                                    onClick={() =>
                                                                        handleCancelEditReview(
                                                                            productId
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSubmitting
                                                                    }
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}

                                                        </div>
                                                    </>
                                                )}

                                                {reviewErrors[
                                                    productId
                                                ] &&
                                                    myReview &&
                                                    !isEditing && (
                                                        <div className="review-error">
                                                            ❌{" "}
                                                            {
                                                                reviewErrors[
                                                                    productId
                                                                ]
                                                            }
                                                        </div>
                                                    )}

                                                {reviewMessages[
                                                    productId
                                                ] &&
                                                    myReview &&
                                                    !isEditing && (
                                                        <div className="review-success">
                                                            ✅{" "}
                                                            {
                                                                reviewMessages[
                                                                    productId
                                                                ]
                                                            }
                                                        </div>
                                                    )}

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

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

                        {/* PAYMENT INFORMATION */}

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
                                    <p>
                                        <strong>
                                            Payment Status:
                                        </strong>{" "}

                                        <span className="payment-success">
                                            {payment.status}
                                        </span>
                                    </p>

                                    <p>
                                        <strong>
                                            Amount:
                                        </strong>{" "}
                                        ₹
                                        {Number(
                                            payment.amount
                                        ).toFixed(2)}
                                    </p>

                                    <p>
                                        <strong>
                                            Razorpay Payment ID:
                                        </strong>{" "}

                                        {payment.razorpay_payment_id ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Razorpay Order ID:
                                        </strong>{" "}

                                        {payment.razorpay_order_id ||
                                            "N/A"}
                                    </p>

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

                        {/* CANCEL ORDER */}

                        {[
                            "PENDING",
                            "CONFIRMED",
                        ].includes(
                            selectedOrder.status
                        ) && (
                            <div className="cancel-order-section">

                                <button
                                    type="button"
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

                        {/* ORDER DATES */}

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
                </div>
            )}

        </div>
    );
}

export default CustomerOrders;
