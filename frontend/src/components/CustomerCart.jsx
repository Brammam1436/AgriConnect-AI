import { useEffect, useState } from "react";
import "./CustomerCart.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const RAZORPAY_KEY_ID = "rzp_test_Tb9K0WydM5EmRH";

function CustomerCart() {
    const [cart, setCart] = useState(null);
    const [products, setProducts] = useState([]);

    const [createdOrder, setCreatedOrder] = useState(null);

    const [loading, setLoading] = useState(true);
    const [updatingItem, setUpdatingItem] = useState(null);
    const [removingItem, setRemovingItem] = useState(null);

    const [checkoutLoading, setCheckoutLoading] =
        useState(false);

    const [paymentLoading, setPaymentLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [paymentSuccess, setPaymentSuccess] =
        useState(false);

    // ==========================================
    // DELIVERY ADDRESS STATES
    // ==========================================

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] =
        useState(null);
    const [addressLoading, setAddressLoading] =
        useState(true);
    const [addressError, setAddressError] =
        useState("");

    // ==========================================
    // TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem("access_token");
    };

    // ==========================================
    // PRODUCT IMAGE
    // ==========================================

    const getProductImage = (item) => {
        const directImage =
            item.product?.image ||
            item.product_image ||
            item.image;

        if (directImage) {
            return directImage.startsWith("http")
                ? directImage
                : `${API_BASE_URL}${directImage}`;
        }

        const productId =
            typeof item.product === "object"
                ? item.product?.id
                : item.product;

        if (!productId) {
            return null;
        }

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
    // PRODUCT NAME
    // ==========================================

    const getProductName = (item) => {
        return (
            item.product?.name ||
            item.product_name ||
            "Agricultural Product"
        );
    };

    // ==========================================
    // PRODUCT PRICE
    // ==========================================

    const getProductPrice = (item) => {
        return Number(
            item.price_per_kg ||
            item.product?.price_per_kg ||
            0
        );
    };

    // ==========================================
    // PRODUCT UNIT
    // ==========================================

    const getProductUnit = (item) => {
        return (
            item.product?.unit ||
            item.unit ||
            "kg"
        );
    };

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async () => {
        try {
            const token = getToken();

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
                "Failed to load products:",
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

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Please login again."
                );
            }

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
            console.error(
                "Fetch cart error:",
                error
            );

            setError(
                error.message ||
                "Unable to load your cart."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FETCH CUSTOMER ADDRESSES
    // ==========================================

    const fetchAddresses = async () => {
        try {
            setAddressLoading(true);
            setAddressError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Please login again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/api/auth/addresses/`,
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
                    "Unable to load delivery addresses."
                );
            }

            const addressList =
                data.addresses || [];

            setAddresses(addressList);

            // Automatically select default address
            const defaultAddress =
                addressList.find(
                    (address) =>
                        address.is_default
                );

            if (defaultAddress) {
                setSelectedAddressId(
                    defaultAddress.id
                );
            } else if (
                addressList.length > 0
            ) {
                setSelectedAddressId(
                    addressList[0].id
                );
            } else {
                setSelectedAddressId(null);
            }

        } catch (error) {
            console.error(
                "Fetch addresses error:",
                error
            );

            setAddressError(
                error.message ||
                "Unable to load delivery addresses."
            );

        } finally {
            setAddressLoading(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchProducts();
        fetchCart();
        fetchAddresses();
    }, []);

    // ==========================================
    // GET CART ITEMS
    // ==========================================

    const cartItems =
        cart?.items ||
        cart?.cart_items ||
        [];

    // ==========================================
    // UPDATE QUANTITY
    // ==========================================

    const handleUpdateQuantity = async (
        cartItemId,
        quantity
    ) => {
        const newQuantity = Number(quantity);

        if (
            !Number.isFinite(newQuantity) ||
            newQuantity <= 0
        ) {
            setError(
                "Quantity must be greater than 0."
            );
            return;
        }

        try {
            setUpdatingItem(cartItemId);
            setError("");
            setMessage("");

            const token = getToken();

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
                        quantity: newQuantity,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to update quantity."
                );
            }

            setCart(data);

            setMessage(
                "Cart updated successfully."
            );

        } catch (error) {
            console.error(
                "Update quantity error:",
                error
            );

            setError(
                error.message ||
                "Unable to update quantity."
            );

        } finally {
            setUpdatingItem(null);
        }
    };

    // ==========================================
    // INCREASE QUANTITY
    // ==========================================

    const increaseQuantity = (item) => {
        const currentQuantity =
            Number(item.quantity);

        const availableQuantity =
            Number(
                item.product?.available_quantity ||
                item.available_quantity ||
                999999
            );

        const newQuantity =
            currentQuantity + 1;

        if (
            newQuantity >
            availableQuantity
        ) {
            setError(
                `Only ${availableQuantity} ${getProductUnit(item)} is available.`
            );

            return;
        }

        handleUpdateQuantity(
            item.id,
            newQuantity
        );
    };

    // ==========================================
    // DECREASE QUANTITY
    // ==========================================

    const decreaseQuantity = (item) => {
        const currentQuantity =
            Number(item.quantity);

        if (currentQuantity <= 0.1) {
            return;
        }

        let newQuantity =
            currentQuantity - 1;

        if (newQuantity < 0.1) {
            newQuantity = 0.1;
        }

        handleUpdateQuantity(
            item.id,
            Number(
                newQuantity.toFixed(2)
            )
        );
    };

    // ==========================================
    // REMOVE ITEM
    // ==========================================

    const handleRemoveItem = async (
        cartItemId
    ) => {
        try {
            setRemovingItem(cartItemId);
            setError("");
            setMessage("");

            const token = getToken();

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

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to remove product."
                );
            }

            setMessage(
                "Product removed from your cart."
            );

            await fetchCart();

        } catch (error) {
            console.error(
                "Remove item error:",
                error
            );

            setError(
                error.message ||
                "Unable to remove product."
            );

        } finally {
            setRemovingItem(null);
        }
    };

    // ==========================================
    // CREATE ORDER
    // ==========================================

    const handleCheckout = async () => {
        try {
            setCheckoutLoading(true);
            setError("");
            setMessage("");
            setAddressError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Please login before checkout."
                );
            }

            if (cartItems.length === 0) {
                throw new Error(
                    "Your cart is empty."
                );
            }

            // Require delivery address
            if (!selectedAddressId) {
                setAddressError(
                    "Please select a delivery address before placing your order."
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

                    body: JSON.stringify({
                        address_id:
                            selectedAddressId,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to create order."
                );
            }

            setCreatedOrder(data);

            setCart(null);

            setMessage(
                `Order #${data.id} created successfully.`
            );

        } catch (error) {
            console.error(
                "Checkout error:",
                error
            );

            setError(
                error.message ||
                "Unable to create order."
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
            setError("");
            setMessage("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Please login before payment."
                );
            }

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
                    "Unable to create payment."
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
                    Number(
                        paymentData.amount
                    ) * 100
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

                        setPaymentSuccess(
                            true
                        );

                        setMessage(
                            "Payment successful and verified!"
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
                    name:
                        "AgriConnect Customer",
                },

                theme: {
                    color: "#198754",
                },

                modal: {
                    ondismiss:
                        function () {
                            setMessage(
                                "Payment window closed."
                            );

                            setPaymentLoading(
                                false
                            );
                        },
                },
            };

            const razorpay =
                new window.Razorpay(
                    options
                );

            razorpay.open();

        } catch (error) {
            console.error(
                "Payment error:",
                error
            );

            setError(
                error.message ||
                "Unable to process payment."
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
                        Loading Your Cart
                    </h2>

                    <p>
                        Please wait while we
                        load your shopping cart.
                    </p>

                </div>

            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (
        error &&
        !cart &&
        !createdOrder
    ) {
        return (
            <div className="customer-cart">

                <div className="cart-error-card">

                    <div className="error-icon">
                        ⚠️
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

    return (
        <div className="customer-cart">

            {/* =====================================
                PAGE HEADER
            ====================================== */}

            <div className="cart-page-heading">

                <div>

                    <span className="cart-title-icon">
                        🛒
                    </span>

                    <div>

                        <h1>
                            My Cart
                        </h1>

                        <p>
                            Review your selected
                            fresh products
                        </p>

                    </div>

                </div>

                <div className="cart-count">

                    {cartItems.length}

                    <span>
                        {cartItems.length === 1
                            ? " Product"
                            : " Products"}
                    </span>

                </div>

            </div>

            {/* =====================================
                MESSAGE
            ====================================== */}

            {message && (
                <div className="cart-success-message">
                    <span>✓</span>
                    {message}
                </div>
            )}

            {error && (
                <div className="cart-error-message">
                    <span>!</span>
                    {error}
                </div>
            )}

            {/* =====================================
                PAYMENT SECTION
            ====================================== */}

            {createdOrder && (
                <div className="payment-card">

                    <div className="payment-card-header">

                        <div className="payment-card-icon">
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

                    <div className="payment-details">

                        <div>
                            <span>
                                Order Number
                            </span>

                            <strong>
                                #{createdOrder.id}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Order Status
                            </span>

                            <strong className="pending">
                                {createdOrder.status}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Total Amount
                            </span>

                            <strong className="payment-amount">
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
                            disabled={
                                paymentLoading
                            }
                        >
                            {paymentLoading
                                ? "⏳ Processing..."
                                : `💳 Pay ₹${createdOrder.total_amount}`}
                        </button>

                    ) : (

                        <div className="payment-success-box">

                            <div>
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

                </div>
            )}

            {/* =====================================
                EMPTY CART
            ====================================== */}

            {cartItems.length === 0 &&
                !createdOrder && (

                    <div className="empty-cart-card">

                        <div className="empty-cart-icon">
                            🛒
                        </div>

                        <h2>
                            Your Cart is Empty
                        </h2>

                        <p>
                            You haven't added any
                            products yet.
                        </p>

                        <div className="empty-cart-tip">
                            🌱 Go to Shopping and
                            choose fresh products
                            from verified farmers.
                        </div>

                    </div>
                )}

            {/* =====================================
                CART CONTENT
            ====================================== */}

            {cartItems.length > 0 && (

                <div className="cart-layout">

                    {/* =================================
                        LEFT - CART ITEMS
                    ================================== */}

                    <div className="cart-products">

                        <div className="cart-section-title">

                            <h2>
                                Selected Products
                            </h2>

                            <span>
                                {cartItems.length}{" "}
                                {cartItems.length === 1
                                    ? "item"
                                    : "items"}
                            </span>

                        </div>

                        {cartItems.map((item) => {

                            const image =
                                getProductImage(item);

                            const price =
                                getProductPrice(item);

                            const unit =
                                getProductUnit(item);

                            const quantity =
                                Number(
                                    item.quantity
                                );

                            const subtotal =
                                Number(
                                    item.subtotal ||
                                    price * quantity
                                );

                            return (
                                <div
                                    className="cart-product-card"
                                    key={item.id}
                                >

                                    {/* IMAGE */}

                                    <div className="cart-product-image-container">

                                        {image ? (

                                            <img
                                                src={image}
                                                alt={
                                                    getProductName(
                                                        item
                                                    )
                                                }
                                                className="cart-product-image"
                                            />

                                        ) : (

                                            <div className="cart-product-placeholder">
                                                🌱
                                            </div>

                                        )}

                                    </div>

                                    {/* DETAILS */}

                                    <div className="cart-product-details">

                                        <div className="cart-product-top">

                                            <div>

                                                <h3>
                                                    {getProductName(
                                                        item
                                                    )}
                                                </h3>

                                                <span className="cart-category">
                                                    🌱{" "}
                                                    {item.product?.category ||
                                                        item.category ||
                                                        "Agricultural Product"}
                                                </span>

                                            </div>

                                            <span className="fresh-label">
                                                Fresh
                                            </span>

                                        </div>

                                        <div className="cart-price">

                                            ₹
                                            {price.toFixed(
                                                2
                                            )}

                                            <span>
                                                /{unit}
                                            </span>

                                        </div>

                                        <div className="cart-product-bottom">

                                            {/* QUANTITY */}

                                            <div className="cart-quantity-area">

                                                <label>
                                                    Quantity
                                                </label>

                                                <div className="cart-quantity-control">

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            updatingItem ===
                                                            item.id ||
                                                            quantity <=
                                                            0.1
                                                        }
                                                        onClick={() =>
                                                            decreaseQuantity(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            updatingItem ===
                                                            item.id
                                                        }
                                                        onClick={() =>
                                                            increaseQuantity(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        +
                                                    </button>

                                                </div>

                                                <small>
                                                    {unit}
                                                </small>

                                            </div>

                                            {/* SUBTOTAL */}

                                            <div className="cart-subtotal-area">

                                                <span>
                                                    Subtotal
                                                </span>

                                                <strong>
                                                    ₹
                                                    {subtotal.toFixed(
                                                        2
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="remove-item-button"
                                            disabled={
                                                removingItem ===
                                                item.id
                                            }
                                            onClick={() =>
                                                handleRemoveItem(
                                                    item.id
                                                )
                                            }
                                        >
                                            {removingItem ===
                                            item.id
                                                ? "Removing..."
                                                : "🗑️ Remove"}
                                        </button>

                                    </div>

                                </div>
                            );
                        })}
                    </div>

                    {/* =================================
                        RIGHT - ORDER SUMMARY
                    ================================== */}

                    <aside className="cart-summary-card">

                        <div className="summary-heading">

                            <span>
                                🧾
                            </span>

                            <h2>
                                Order Summary
                            </h2>

                        </div>

                        <div className="summary-line">

                            <span>
                                Products
                            </span>

                            <strong>
                                {cartItems.length}
                            </strong>

                        </div>

                        <div className="summary-line">

                            <span>
                                Items Quantity
                            </span>

                            <strong>
                                {cartItems.reduce(
                                    (
                                        total,
                                        item
                                    ) =>
                                        total +
                                        Number(
                                            item.quantity
                                        ),
                                    0
                                ).toFixed(2)}{" "}
                                kg
                            </strong>

                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">

                            <span>
                                Total Amount
                            </span>

                            <strong>
                                ₹
                                {Number(
                                    cart?.total_amount ||
                                    cart?.total ||
                                    0
                                ).toFixed(2)}
                            </strong>

                        </div>

                        {/* =================================
                            DELIVERY ADDRESS
                        ================================== */}

                        <div className="checkout-address-section">

                            <div className="checkout-address-header">

                                <h3>
                                    📍 Delivery Address
                                </h3>

                                <span>
                                    Select delivery location
                                </span>

                            </div>

                            {addressLoading ? (

                                <div className="checkout-address-loading">
                                    Loading your saved
                                    addresses...
                                </div>

                            ) : addresses.length === 0 ? (

                                <div className="checkout-address-empty">

                                    <strong>
                                        No saved address
                                    </strong>

                                    Please add a delivery
                                    address from the
                                    <b> My Addresses </b>
                                    section before
                                    placing your order.

                                </div>

                            ) : (

                                <div className="checkout-address-list">

                                    {addresses.map(
                                        (address) => (

                                            <div
                                                key={
                                                    address.id
                                                }
                                                className={`checkout-address-option ${
                                                    selectedAddressId ===
                                                    address.id
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setSelectedAddressId(
                                                        address.id
                                                    )
                                                }
                                            >

                                                <div className="checkout-address-option-top">

                                                    <input
                                                        type="radio"
                                                        name="deliveryAddress"
                                                        className="checkout-address-radio"
                                                        checked={
                                                            selectedAddressId ===
                                                            address.id
                                                        }
                                                        onChange={() =>
                                                            setSelectedAddressId(
                                                                address.id
                                                            )
                                                        }
                                                    />

                                                    <div className="checkout-address-info">

                                                        <div className="checkout-address-name-row">

                                                            <span className="checkout-address-name">
                                                                {
                                                                    address.full_name
                                                                }
                                                            </span>

                                                            <span className="checkout-address-type">
                                                                {
                                                                    address.address_type
                                                                }
                                                            </span>

                                                            {address.is_default && (
                                                                <span className="checkout-address-default">
                                                                    ⭐
                                                                    Default
                                                                </span>
                                                            )}

                                                        </div>

                                                        <div className="checkout-address-phone">
                                                            📞{" "}
                                                            {
                                                                address.phone
                                                            }
                                                        </div>

                                                        <div className="checkout-address-text">

                                                            {
                                                                address.address_line1
                                                            }

                                                            {address.address_line2 &&
                                                                `, ${address.address_line2}`}

                                                            ,{" "}
                                                            {
                                                                address.city
                                                            }

                                                            ,{" "}
                                                            {
                                                                address.state
                                                            }

                                                            ,{" "}
                                                            {
                                                                address.postal_code
                                                            }

                                                            ,{" "}
                                                            {
                                                                address.country
                                                            }

                                                        </div>

                                                        {selectedAddressId ===
                                                            address.id && (

                                                            <div className="checkout-selected-label">
                                                                ✓
                                                                Selected
                                                                delivery
                                                                address
                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                            {addressError && (

                                <div className="checkout-address-error">
                                    {addressError}
                                </div>

                            )}

                        </div>

                        {/* =================================
                            PLACE ORDER
                        ================================== */}

                        <button
                            type="button"
                            className="checkout-button"
                            onClick={
                                handleCheckout
                            }
                            disabled={
                                checkoutLoading ||
                                addressLoading ||
                                addresses.length === 0
                            }
                        >
                            {checkoutLoading
                                ? "⏳ Creating Order..."
                                : "🛍️ Place Order"}
                        </button>

                        <div className="secure-checkout">

                            <span>
                                🔒
                            </span>

                            <div>

                                <strong>
                                    Secure Checkout
                                </strong>

                                <small>
                                    Payments securely
                                    processed by
                                    Razorpay
                                </small>

                            </div>

                        </div>

                    </aside>

                </div>
            )}

        </div>
    );
}

export default CustomerCart;