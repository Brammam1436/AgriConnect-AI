import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";
const RAZORPAY_KEY_ID = "rzp_test_Tb9K0WydM5EmRH";

function CustomerCart() {
    const [cart, setCart] = useState(null);
    const [createdOrder, setCreatedOrder] = useState(null);

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] =
        useState(false);
    const [paymentLoading, setPaymentLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [paymentSuccess, setPaymentSuccess] =
        useState(false);

    // ==========================================
    // GET PRODUCT IMAGE
    // ==========================================

    const getProductImage = (item) => {
        // First try image returned directly by cart API
        const directImage =
            item.product?.image ||
            item.product_image ||
            item.image;

        if (directImage) {
            return directImage.startsWith("http")
                ? directImage
                : `${API_BASE_URL}${directImage}`;
        }

        // Get product ID from different possible API formats
        const productId =
            typeof item.product === "object"
                ? item.product?.id
                : item.product;

        if (!productId) {
            return null;
        }

        // Find product from Products API
        const product = products.find(
            (product) =>
                Number(product.id) === Number(productId)
        );

        if (!product?.image) {
            return null;
        }

        return product.image.startsWith("http")
            ? product.image
            : `${API_BASE_URL}${product.image}`;
    };

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async () => {
        try {
            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE_URL}/api/products/`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return;
            }

            const productList =
                Array.isArray(data)
                    ? data
                    : data.results || [];

            setProducts(productList);

        } catch (error) {
            console.error(
                "Failed to load product images:",
                error
            );
        }
    };

    // ==========================================
    // FETCH CART
    // ==========================================

    const fetchCart = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE_URL}/api/cart/`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to load cart."
                );
            }

            setCart(data);

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong while loading the cart."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchProducts();
        fetchCart();
    }, []);

    // ==========================================
    // UPDATE QUANTITY
    // ==========================================

    const handleUpdateQuantity = async (
        cartItemId,
        quantity
    ) => {
        setMessage("");
        setError("");

        if (Number(quantity) <= 0) {
            setError(
                "Quantity must be greater than 0."
            );
            return;
        }

        try {
            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE_URL}/api/cart/items/${cartItemId}/`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        quantity: quantity,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to update quantity."
                );
            }

            setCart(data);

            setMessage(
                "Cart quantity updated successfully."
            );

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong while updating the cart."
            );
        }
    };

    // ==========================================
    // REMOVE ITEM
    // ==========================================

    const handleRemoveItem = async (
        cartItemId
    ) => {
        setMessage("");
        setError("");

        try {
            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE_URL}/api/cart/items/${cartItemId}/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to remove item."
                );
            }

            setMessage(
                "Product removed from cart."
            );

            await fetchCart();

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong while removing the product."
            );
        }
    };

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const handleCheckout = async () => {
        setMessage("");
        setError("");

        try {
            setCheckoutLoading(true);

            const token =
                localStorage.getItem("access_token");

            if (!token) {
                setError(
                    "Please login before checkout."
                );
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/api/orders/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({}),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to create order."
                );
            }

            setCreatedOrder(data);

            setCart(null);

            setMessage(
                `Order #${data.id} created successfully.`
            );

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong while creating the order."
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    // ==========================================
    // RAZORPAY PAYMENT
    // ==========================================

    const handlePayment = async () => {
        if (!createdOrder) {
            setError(
                "Please create an order first."
            );
            return;
        }

        try {
            setPaymentLoading(true);
            setMessage("");
            setError("");

            const token =
                localStorage.getItem("access_token");

            if (!token) {
                setError(
                    "Please login before making payment."
                );
                return;
            }

            setMessage(
                "Creating Razorpay payment order..."
            );

            const response = await fetch(
                `${API_BASE_URL}/api/payments/${createdOrder.id}/create/`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({}),
                }
            );

            const paymentData =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    paymentData.detail ||
                    paymentData.error ||
                    "Unable to create payment order."
                );
            }

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
                    `Payment for Order #${createdOrder.id}`,

                order_id:
                    paymentData.razorpay_order_id,

                handler: async function (
                    paymentResponse
                ) {
                    try {
                        setMessage(
                            "Payment successful. Verifying payment..."
                        );

                        const verifyResponse =
                            await fetch(
                                `${API_BASE_URL}/api/payments/${createdOrder.id}/verify/`,
                                {
                                    method: "POST",
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`,
                                        "Content-Type":
                                            "application/json",
                                    },
                                    body: JSON.stringify({
                                        razorpay_payment_id:
                                            paymentResponse.razorpay_payment_id,

                                        razorpay_order_id:
                                            paymentResponse.razorpay_order_id,

                                        razorpay_signature:
                                            paymentResponse.razorpay_signature,
                                    }),
                                }
                            );

                        const verifyData =
                            await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            throw new Error(
                                verifyData.detail ||
                                verifyData.error ||
                                "Payment verification failed."
                            );
                        }

                        setPaymentSuccess(true);

                        setMessage(
                            "✅ Payment successful and verified!"
                        );

                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error
                        );

                        setError(
                            error.message ||
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
                        setMessage(
                            "Payment window closed."
                        );

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

            setError(
                error.message ||
                "Something went wrong while processing payment."
            );

            setPaymentLoading(false);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="customer-cart">

                <div className="cart-loading-card">

                    <div className="loading-icon">
                        🛒
                    </div>

                    <h2>
                        Loading Your Cart...
                    </h2>

                    <p>
                        Please wait while we load
                        your shopping cart.
                    </p>

                </div>

            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error && !cart && !createdOrder) {
        return (
            <div className="customer-cart">

                <div className="cart-error-card">

                    <div className="error-icon">
                        ❌
                    </div>

                    <h2>
                        Unable to Load Cart
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="cart-retry-button"
                        onClick={fetchCart}
                    >
                        🔄 Try Again
                    </button>

                </div>

            </div>
        );
    }

    const cartItems =
        cart?.items ||
        cart?.cart_items ||
        [];

    return (
        <div className="customer-cart">

            {/* =================================
                CART HEADER
            ================================= */}

            <div className="cart-header">

                <div>

                    <span className="cart-header-icon">
                        🛒
                    </span>

                    <div>

                        <h2>
                            My Shopping Cart
                        </h2>

                        <p>
                            Review your fresh
                            products before checkout
                        </p>

                    </div>

                </div>

                {cartItems.length > 0 && (
                    <div className="cart-item-count">
                        {cartItems.length}{" "}
                        {cartItems.length === 1
                            ? "Item"
                            : "Items"}
                    </div>
                )}

            </div>

            {/* SUCCESS */}

            {message && (
                <div className="cart-success">

                    <span>
                        ✅
                    </span>

                    <span>
                        {message}
                    </span>

                </div>
            )}

            {/* ERROR */}

            {error && (
                <div className="cart-error">

                    <span>
                        ❌
                    </span>

                    <span>
                        {error}
                    </span>

                </div>
            )}

            {/* =================================
                PAYMENT SECTION
            ================================= */}

            {createdOrder && (
                <div className="payment-section">

                    <div className="payment-section-header">

                        <div className="payment-icon">
                            💳
                        </div>

                        <div>

                            <h2>
                                Complete Your Payment
                            </h2>

                            <p>
                                Your order has been
                                created successfully.
                            </p>

                        </div>

                    </div>

                    <div className="payment-order-card">

                        <div className="payment-order-info">

                            <span>
                                Order Number
                            </span>

                            <strong>
                                #{createdOrder.id}
                            </strong>

                        </div>

                        <div className="payment-order-info">

                            <span>
                                Status
                            </span>

                            <strong className="pending-status">
                                {createdOrder.status}
                            </strong>

                        </div>

                        <div className="payment-order-info">

                            <span>
                                Total Amount
                            </span>

                            <strong className="payment-total">
                                ₹
                                {createdOrder.total_amount}
                            </strong>

                        </div>

                    </div>

                    {!paymentSuccess ? (

                        <button
                            type="button"
                            className="pay-now-button"
                            onClick={handlePayment}
                            disabled={paymentLoading}
                        >
                            {paymentLoading
                                ? "⏳ Processing Payment..."
                                : `💳 Pay ₹${createdOrder.total_amount}`}
                        </button>

                    ) : (

                        <div className="payment-completed">

                            <div className="payment-success-icon">
                                ✓
                            </div>

                            <h3>
                                Payment Completed
                            </h3>

                            <p>
                                Your payment has been
                                successfully verified.
                            </p>

                        </div>

                    )}

                </div>
            )}

            {/* =================================
                EMPTY CART
            ================================= */}

            {cartItems.length === 0 &&
                !createdOrder && (

                    <div className="empty-cart">

                        <div className="empty-cart-icon">
                            🛒
                        </div>

                        <h2>
                            Your Cart is Empty
                        </h2>

                        <p>
                            Add fresh products from
                            farmers to your cart.
                        </p>

                    </div>
                )}

            {/* =================================
                CART ITEMS
            ================================= */}

            {cartItems.length > 0 && (

                <>

                    <div className="cart-items">

                        {cartItems.map((item) => {

                            const image =
                                getProductImage(item);

                            return (
                                <div
                                    className="cart-item"
                                    key={item.id}
                                >

                                    {/* PRODUCT IMAGE */}

                                    <div className="cart-image-wrapper">

                                        {image ? (

                                            <img
                                                src={image}
                                                alt={
                                                    item.product?.name ||
                                                    item.product_name ||
                                                    "Product"
                                                }
                                                className="cart-product-image"
                                            />

                                        ) : (

                                            <div className="cart-no-image">
                                                🌱
                                            </div>

                                        )}

                                    </div>

                                    {/* PRODUCT DETAILS */}

                                    <div className="cart-item-details">

                                        <div className="cart-product-title-row">

                                            <h3>
                                                {item.product?.name ||
                                                    item.product_name}
                                            </h3>

                                            <span className="fresh-badge">
                                                Fresh
                                            </span>

                                        </div>

                                        <p className="cart-product-category">

                                            🌱{" "}

                                            {item.product?.category ||
                                                "Agricultural Product"}

                                        </p>

                                        <div className="cart-price-row">

                                            <span>
                                                Price
                                            </span>

                                            <strong>
                                                ₹
                                                {item.price_per_kg ||
                                                    item.product?.price_per_kg}
                                                /kg
                                            </strong>

                                        </div>

                                        <div className="cart-quantity-row">

                                            <div className="cart-quantity">

                                                <label>
                                                    Quantity
                                                </label>

                                                <div className="quantity-control">

                                                    <input
                                                        type="number"
                                                        min="0.1"
                                                        step="0.1"
                                                        value={
                                                            item.quantity
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleUpdateQuantity(
                                                                item.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        kg
                                                    </span>

                                                </div>

                                            </div>

                                            <div className="cart-subtotal">

                                                <span>
                                                    Subtotal
                                                </span>

                                                <strong>
                                                    ₹
                                                    {item.subtotal}
                                                </strong>

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="remove-cart-button"
                                            onClick={() =>
                                                handleRemoveItem(
                                                    item.id
                                                )
                                            }
                                        >
                                            🗑️ Remove
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    {/* =================================
                        CART SUMMARY
                    ================================= */}

                    <div className="cart-summary">

                        <div className="summary-title">

                            <span>
                                🧾
                            </span>

                            <h3>
                                Order Summary
                            </h3>

                        </div>

                        <div className="summary-row">

                            <span>
                                Products
                            </span>

                            <strong>
                                {cartItems.length}
                            </strong>

                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">

                            <span>
                                Total Amount
                            </span>

                            <strong>
                                ₹
                                {cart?.total_amount ||
                                    cart?.total ||
                                    "0.00"}
                            </strong>

                        </div>

                        <button
                            type="button"
                            className="checkout-button"
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading
                                ? "⏳ Creating Order..."
                                : "🛍️ Place Order & Continue to Payment"}
                        </button>

                        <p className="secure-payment-text">
                            🔒 Secure checkout •
                            Razorpay payment
                        </p>

                    </div>

                </>
            )}

        </div>
    );
}

export default CustomerCart;