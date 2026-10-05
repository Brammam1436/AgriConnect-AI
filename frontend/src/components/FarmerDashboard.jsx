import { useEffect, useState } from "react";
import FarmerDemandPrediction from "./FarmerDemandPrediction";
import FarmerPriceRecommendation from "./FarmerPriceRecommendation";
import FarmerNotifications from "./FarmerNotifications";
import FarmerOrders from "./FarmerOrders";
import api from "../api/api";
import "./FarmerDashboard.css";

const MENU_ITEMS = [
    {
        id: "dashboard",
        icon: "🏠",
        label: "Dashboard",
    },
    {
        id: "products",
        icon: "🌱",
        label: "My Products",
    },
    {
        id: "orders",
        icon: "📦",
        label: "Orders",
    },
    {
        id: "demand",
        icon: "🤖",
        label: "Demand Prediction",
    },
    {
        id: "price",
        icon: "💰",
        label: "Price Recommendation",
    },
    {
        id: "reviews",
        icon: "⭐",
        label: "Customer Reviews",
    },
    {
        id: "notifications",
        icon: "🔔",
        label: "Notifications",
    },
];

function FarmerDashboard({ onLogout }) {
    const [activePage, setActivePage] = useState("dashboard");

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [unreadCount, setUnreadCount] = useState(0);

    // =========================================================
    // FARMER ANALYTICS
    // =========================================================

    const [farmerOrders, setFarmerOrders] = useState([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState("");

    const [farmerName, setFarmerName] = useState(
        localStorage.getItem("current_username") || "Farmer"
    );

    const [farmerProfile, setFarmerProfile] = useState(null);

    const [showProfile, setShowProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // =========================================================
    // FARMER REVIEWS
    // =========================================================

    const [farmerReviews, setFarmerReviews] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");

    // =========================================================
    // PRODUCT FORM
    // =========================================================

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        description: "",
        price_per_kg: "",
        available_quantity: "",
        unit: "kg",
        is_available: true,
        image: null,
    });

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [editingProduct, setEditingProduct] = useState(null);

    // =========================================================
    // PROFILE FORM
    // =========================================================

    const [profileForm, setProfileForm] = useState({
        username: "",
        email: "",
        phone: "",
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const [showChangePassword, setShowChangePassword] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);

    // =========================================================
    // PRODUCT IMAGE URL
    // =========================================================

    const getImageUrl = (image) => {
        if (!image) {
            return null;
        }

        if (
            image.startsWith("http://") ||
            image.startsWith("https://")
        ) {
            return image;
        }

        return `http://127.0.0.1:8000${image}`;
    };

    // =========================================================
    // FETCH PRODUCTS
    // =========================================================

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            let nextUrl = "/api/products/";
            let allProducts = [];

            while (nextUrl) {
                const response = await api.get(nextUrl);

                console.log(
                    "Farmer Product API response:",
                    response.data
                );

                // Non-paginated response
                if (Array.isArray(response.data)) {
                    allProducts = [
                        ...allProducts,
                        ...response.data,
                    ];

                    nextUrl = null;
                }

                // Paginated response
                else {
                    const pageProducts =
                        response.data?.results || [];

                    allProducts = [
                        ...allProducts,
                        ...pageProducts,
                    ];

                    // Django REST Framework pagination
                    // gives the next page URL here.
                    nextUrl =
                        response.data?.next || null;
                }
            }

            console.log(
                "ALL FARMER PRODUCTS:",
                allProducts
            );

            console.log(
                "TOTAL PRODUCTS:",
                allProducts.length
            );

            setProducts(allProducts);

        } catch (err) {
            console.error(
                "Farmer Product API error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load products."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FETCH FARMER ORDERS FOR DASHBOARD ANALYTICS
    // =========================================================

    const fetchFarmerOrders = async () => {
        try {
            setAnalyticsLoading(true);
            setAnalyticsError("");

            const response = await api.get(
                "/api/orders/farmer/"
            );

            const data = response.data;

            setFarmerOrders(
                Array.isArray(data)
                    ? data
                    : data?.results || []
            );
        } catch (error) {
            console.error(
                "Farmer analytics orders error:",
                error
            );

            setAnalyticsError(
                error.response?.data?.detail ||
                "Unable to load sales analytics."
            );
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // =========================================================
    // FETCH FARMER PROFILE
    // =========================================================

    const fetchFarmerProfile = async () => {
        try {
            const response = await api.get(
                "/api/auth/me/"
            );

            const user = response.data?.user;

            if (user) {
                setFarmerProfile(user);

                setFarmerName(
                    user.username || "Farmer"
                );

                localStorage.setItem(
                    "current_username",
                    user.username || "Farmer"
                );
            }
        } catch (error) {
            console.error(
                "Farmer profile fetch error:",
                error
            );
        }
    };

    // =========================================================
    // FETCH UNREAD NOTIFICATIONS
    // =========================================================

    const fetchUnreadNotifications = async () => {
        try {
            const response = await api.get(
                "/api/notifications/"
            );

            setUnreadCount(
                response.data?.unread_count || 0
            );
        } catch (error) {
            console.error(
                "Farmer unread notification count error:",
                error
            );
        }
    };

    // =========================================================
    // FETCH FARMER REVIEWS
    // =========================================================

    const fetchFarmerReviews = async () => {
        try {
            setReviewsLoading(true);
            setReviewsError("");

            const response = await api.get(
                "/api/products/farmer-reviews/"
            );

            console.log(
                "Farmer Reviews API response:",
                response.data
            );

            setFarmerReviews(
                response.data
            );
        } catch (error) {
            console.error(
                "Farmer Reviews API error:",
                error
            );

            setReviewsError(
                error.response?.data?.detail ||
                "Unable to load reviews and ratings."
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    // =========================================================
    // PRODUCT FORM INPUT
    // =========================================================

    const handleInputChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
            files,
        } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "file"
                    ? files?.[0] || null
                    : value,
        }));
    };

    // =========================================================
    // RESET PRODUCT FORM
    // =========================================================

    const resetProductForm = () => {
        setFormData({
            name: "",
            category: "",
            description: "",
            price_per_kg: "",
            available_quantity: "",
            unit: "kg",
            is_available: true,
            image: null,
        });

        setEditingProduct(null);
        setFormError("");
    };

    // =========================================================
    // ADD PRODUCT
    // =========================================================

    const handleAddProduct = async (event) => {
        event.preventDefault();

        try {
            setFormLoading(true);
            setFormError("");

            const data = new FormData();

            data.append(
                "name",
                formData.name
            );

            data.append(
                "category",
                formData.category
            );

            data.append(
                "description",
                formData.description
            );

            data.append(
                "price_per_kg",
                formData.price_per_kg
            );

            data.append(
                "available_quantity",
                formData.available_quantity
            );

            data.append(
                "unit",
                formData.unit
            );

            data.append(
                "is_available",
                formData.is_available
            );

            if (formData.image) {
                data.append(
                    "image",
                    formData.image
                );
            }

            const response = await api.post(
                "/api/products/",
                data
            );

            console.log(
                "Product created:",
                response.data
            );

            alert(
                "Product added successfully!"
            );

            resetProductForm();

            setShowForm(false);

            await fetchProducts();
        } catch (err) {
            console.error(
                "Add product error:",
                err
            );

            setFormError(
                err.response?.data
                    ? JSON.stringify(
                        err.response.data
                    )
                    : "Unable to add product."
            );
        } finally {
            setFormLoading(false);
        }
    };

    // =========================================================
    // EDIT PRODUCT
    // =========================================================

    const handleEditProduct = async (event) => {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        try {
            setFormLoading(true);
            setFormError("");

            const data = new FormData();

            data.append(
                "name",
                formData.name
            );

            data.append(
                "category",
                formData.category
            );

            data.append(
                "description",
                formData.description
            );

            data.append(
                "price_per_kg",
                formData.price_per_kg
            );

            data.append(
                "available_quantity",
                formData.available_quantity
            );

            data.append(
                "unit",
                formData.unit
            );

            const quantity = Number(
                formData.available_quantity
            );

            data.append(
                "is_available",
                quantity > 0 &&
                formData.is_available
            );

            if (formData.image) {
                data.append(
                    "image",
                    formData.image
                );
            }

            const response = await api.put(
                `/api/products/${editingProduct.id}/`,
                data
            );

            console.log(
                "Product updated:",
                response.data
            );

            alert(
                "Product updated successfully!"
            );

            resetProductForm();

            setShowForm(false);

            await fetchProducts();
        } catch (err) {
            console.error(
                "Update product error:",
                err
            );

            setFormError(
                err.response?.data
                    ? JSON.stringify(
                        err.response.data
                    )
                    : "Unable to update product."
            );
        } finally {
            setFormLoading(false);
        }
    };

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    const handleDeleteProduct = async (
        productId,
        productName
    ) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${productName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(
                `/api/products/${productId}/`
            );

            alert(
                "Product deleted successfully!"
            );

            if (
                editingProduct?.id ===
                productId
            ) {
                resetProductForm();
                setShowForm(false);
            }

            await fetchProducts();

            // Refresh reviews because the product
            // may have been removed.
            if (activePage === "reviews") {
                await fetchFarmerReviews();
            }
        } catch (err) {
            console.error(
                "Delete product error:",
                err
            );

            alert(
                err.response?.data?.detail ||
                "Unable to delete product."
            );
        }
    };

    // =========================================================
    // TOGGLE PRODUCT AVAILABILITY
    // =========================================================

    const handleToggleAvailability = async (
        product
    ) => {
        try {
            setError("");

            const data = new FormData();

            const newAvailability =
                !product.is_available;

            data.append(
                "is_available",
                newAvailability
            );

            await api.put(
                `/api/products/${product.id}/`,
                data
            );

            alert(
                newAvailability
                    ? "Product marked as available."
                    : "Product marked as unavailable."
            );

            await fetchProducts();
        } catch (err) {
            console.error(
                "Availability update error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to update product availability."
            );
        }
    };

    // =========================================================
    // START EDITING
    // =========================================================

    const startEditingProduct = (
        product
    ) => {
        setEditingProduct(product);

        setFormData({
            name: product.name || "",
            category:
                product.category || "",
            description:
                product.description || "",
            price_per_kg:
                product.price_per_kg || "",
            available_quantity:
                product.available_quantity ||
                "",
            unit: product.unit || "kg",
            is_available:
                product.is_available ??
                true,
            image: null,
        });

        setFormError("");
        setShowForm(true);

        setActivePage("products");
    };

    // =========================================================
    // PROFILE EDIT
    // =========================================================

    const handleEditProfile = () => {
        if (!farmerProfile) {
            return;
        }

        setProfileForm({
            username:
                farmerProfile.username || "",
            email:
                farmerProfile.email || "",
            phone:
                farmerProfile.phone || "",
        });

        setProfileMessage("");
        setProfileError("");

        setShowChangePassword(false);

        setPasswordMessage("");
        setPasswordError("");

        setIsEditingProfile(true);
    };

    const handleProfileInputChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setProfileForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const handleSaveProfile = async (
        event
    ) => {
        event.preventDefault();

        setProfileMessage("");
        setProfileError("");

        if (
            !profileForm.username.trim()
        ) {
            setProfileError(
                "Username is required."
            );
            return;
        }

        if (
            !profileForm.email.trim()
        ) {
            setProfileError(
                "Email is required."
            );
            return;
        }

        try {
            setProfileSaving(true);

            const response =
                await api.put(
                    "/api/auth/me/",
                    {
                        username:
                            profileForm.username.trim(),
                        email:
                            profileForm.email.trim(),
                        phone:
                            profileForm.phone.trim(),
                    }
                );

            const updatedUser =
                response.data?.user;

            if (updatedUser) {
                setFarmerProfile(
                    updatedUser
                );

                setFarmerName(
                    updatedUser.username ||
                    "Farmer"
                );

                localStorage.setItem(
                    "current_username",
                    updatedUser.username ||
                    "Farmer"
                );
            }

            setProfileMessage(
                "Profile updated successfully."
            );

            setIsEditingProfile(false);
        } catch (error) {
            console.error(
                "Farmer profile update error:",
                error
            );

            const errorData =
                error.response?.data;

            if (errorData?.username) {
                setProfileError(
                    Array.isArray(
                        errorData.username
                    )
                        ? errorData
                            .username[0]
                        : errorData.username
                );
            } else if (
                errorData?.email
            ) {
                setProfileError(
                    Array.isArray(
                        errorData.email
                    )
                        ? errorData
                            .email[0]
                        : errorData.email
                );
            } else if (
                errorData?.phone
            ) {
                setProfileError(
                    Array.isArray(
                        errorData.phone
                    )
                        ? errorData
                            .phone[0]
                        : errorData.phone
                );
            } else {
                setProfileError(
                    errorData?.detail ||
                    "Unable to update profile."
                );
            }
        } finally {
            setProfileSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
        setProfileMessage("");
        setProfileError("");
    };

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const handleOpenChangePassword =
        () => {
            setIsEditingProfile(false);

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });

            setPasswordMessage("");
            setPasswordError("");

            setShowChangePassword(true);
        };

    const handlePasswordInputChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setPasswordForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    const handleChangePassword = async (
        event
    ) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (
            !passwordForm.current_password
        ) {
            setPasswordError(
                "Current password is required."
            );
            return;
        }

        if (
            !passwordForm.new_password
        ) {
            setPasswordError(
                "New password is required."
            );
            return;
        }

        if (
            !passwordForm.confirm_password
        ) {
            setPasswordError(
                "Please confirm your new password."
            );
            return;
        }

        if (
            passwordForm.new_password !==
            passwordForm.confirm_password
        ) {
            setPasswordError(
                "New passwords do not match."
            );
            return;
        }

        try {
            setPasswordSaving(true);

            const response =
                await api.post(
                    "/api/auth/change-password/",
                    passwordForm
                );

            setPasswordMessage(
                response.data?.message ||
                "Password changed successfully."
            );

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
        } catch (error) {
            console.error(
                "Farmer change password error:",
                error
            );

            const errorData =
                error.response?.data;

            if (
                errorData?.current_password
            ) {
                setPasswordError(
                    Array.isArray(
                        errorData.current_password
                    )
                        ? errorData
                            .current_password[0]
                        : errorData.current_password
                );
            } else if (
                errorData?.new_password
            ) {
                setPasswordError(
                    Array.isArray(
                        errorData.new_password
                    )
                        ? errorData
                            .new_password[0]
                        : errorData.new_password
                );
            } else if (
                errorData?.confirm_password
            ) {
                setPasswordError(
                    Array.isArray(
                        errorData.confirm_password
                    )
                        ? errorData
                            .confirm_password[0]
                        : errorData.confirm_password
                );
            } else if (
                errorData?.detail
            ) {
                setPasswordError(
                    errorData.detail
                );
            } else {
                setPasswordError(
                    "Unable to change password."
                );
            }
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleCancelPasswordChange =
        () => {
            setShowChangePassword(false);

            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });

            setPasswordMessage("");
            setPasswordError("");
        };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        fetchProducts();
        fetchFarmerProfile();
        fetchUnreadNotifications();
        fetchFarmerOrders();

        const notificationInterval =
            setInterval(() => {
                fetchUnreadNotifications();
            }, 30000);

        return () => {
            clearInterval(
                notificationInterval
            );
        };
    }, []);

    // =========================================================
    // LOAD REVIEWS WHEN REVIEWS PAGE OPENS
    // =========================================================

    useEffect(() => {
        if (activePage === "reviews") {
            fetchFarmerReviews();
        }
    }, [activePage]);

    // =========================================================
    // NOTIFICATION CLICK
    // =========================================================

    const handleNotificationsClick =
        () => {
            setActivePage(
                "notifications"
            );

            fetchUnreadNotifications();
        };

    // =========================================================
    // FARMER SALES ANALYTICS
    // =========================================================

    const renderSalesAnalytics = () => {
        const validOrders = farmerOrders.filter(
            (order) => order.status !== "CANCELLED"
        );

        const totalOrders = farmerOrders.length;

        const pendingOrders = farmerOrders.filter(
            (order) => order.status === "PENDING"
        ).length;

        const processingOrders = farmerOrders.filter(
            (order) =>
                order.status === "CONFIRMED" ||
                order.status === "PROCESSING"
        ).length;

        const deliveredOrders = farmerOrders.filter(
            (order) => order.status === "DELIVERED"
        ).length;

        const totalSales = validOrders.reduce(
            (sum, order) =>
                sum + Number(order.farmer_total || 0),
            0
        );

        const deliveredSales = farmerOrders
            .filter((order) => order.status === "DELIVERED")
            .reduce(
                (sum, order) =>
                    sum + Number(order.farmer_total || 0),
                0
            );

        const topProductsMap = {};

        validOrders.forEach((order) => {
            (order.items || []).forEach((item) => {
                const productName =
                    item.product_name ||
                    "Product";

                if (!topProductsMap[productName]) {
                    topProductsMap[productName] = {
                        quantity: 0,
                        sales: 0,
                    };
                }

                topProductsMap[productName].quantity +=
                    Number(item.quantity || 0);

                topProductsMap[productName].sales +=
                    Number(item.subtotal || 0);
            });
        });

        const topProducts = Object.entries(
            topProductsMap
        )
            .map(([name, data]) => ({
                name,
                ...data,
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        const statusData = [
            {
                label: "Pending",
                count: pendingOrders,
                icon: "⏳",
            },
            {
                label: "Processing",
                count: processingOrders,
                icon: "⚙️",
            },
            {
                label: "Shipped",
                count: farmerOrders.filter(
                    (order) => order.status === "SHIPPED"
                ).length,
                icon: "🚚",
            },
            {
                label: "Delivered",
                count: deliveredOrders,
                icon: "📦",
            },
            {
                label: "Cancelled",
                count: farmerOrders.filter(
                    (order) => order.status === "CANCELLED"
                ).length,
                icon: "❌",
            },
        ];

        const lastSevenDays = [];
        const today = new Date();

        for (let index = 6; index >= 0; index -= 1) {
            const date = new Date(today);
            date.setHours(0, 0, 0, 0);
            date.setDate(today.getDate() - index);

            const dateKey = date.toISOString().slice(0, 10);

            const value = validOrders
                .filter((order) => {
                    if (!order.created_at) return false;

                    const orderDate = new Date(order.created_at);
                    return (
                        orderDate.getFullYear() ===
                            date.getFullYear() &&
                        orderDate.getMonth() ===
                            date.getMonth() &&
                        orderDate.getDate() ===
                            date.getDate()
                    );
                })
                .reduce(
                    (sum, order) =>
                        sum + Number(order.farmer_total || 0),
                    0
                );

            lastSevenDays.push({
                dateKey,
                label: date.toLocaleDateString("en-IN", {
                    weekday: "short",
                }),
                value,
            });
        }

        const maxDailySales = Math.max(
            ...lastSevenDays.map((day) => day.value),
            1
        );

        return (
            <div className="farmer-analytics-section" style={{ marginTop: "24px" }}>

                <div className="farmer-card-heading" style={{ marginBottom: "16px" }}>
                    <div>
                        <span>
                            SALES & PERFORMANCE
                        </span>

                        <h3>
                            Farmer Analytics
                        </h3>
                    </div>

                    <span className="farmer-card-icon">
                        📊
                    </span>
                </div>

                {analyticsError && (
                    <div className="farmer-error-message" style={{ marginBottom: "16px" }}>
                        ❌ {analyticsError}
                    </div>
                )}

                {analyticsLoading ? (
                    <div className="farmer-quick-card">
                        <p>
                            Loading your sales analytics...
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="farmer-stat-grid">

                            <div className="farmer-stat-card">
                                <div className="farmer-stat-icon">
                                    📦
                                </div>
                                <div>
                                    <span>Total Orders</span>
                                    <strong>{totalOrders}</strong>
                                </div>
                            </div>

                            <div className="farmer-stat-card">
                                <div className="farmer-stat-icon">
                                    💰
                                </div>
                                <div>
                                    <span>Total Sales</span>
                                    <strong>
                                        ₹{totalSales.toFixed(2)}
                                    </strong>
                                </div>
                            </div>

                            <div className="farmer-stat-card">
                                <div className="farmer-stat-icon">
                                    ✅
                                </div>
                                <div>
                                    <span>Delivered Sales</span>
                                    <strong>
                                        ₹{deliveredSales.toFixed(2)}
                                    </strong>
                                </div>
                            </div>

                            <div className="farmer-stat-card">
                                <div className="farmer-stat-icon">
                                    🚚
                                </div>
                                <div>
                                    <span>Delivered Orders</span>
                                    <strong>{deliveredOrders}</strong>
                                </div>
                            </div>

                        </div>

                        <div
                            className="farmer-home-grid"
                            style={{
                                marginTop: "20px",
                                width: "100%",
                                gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
                                alignItems: "stretch",
                            }}
                        >

                            <div
                                className="farmer-quick-card"
                                style={{ width: "100%", minWidth: 0 }}
                            >
                                <div className="farmer-card-heading">
                                    <div>
                                        <span>
                                            SALES OVERVIEW
                                        </span>
                                        <h3>
                                            Last 7 Days
                                        </h3>
                                    </div>
                                    <span className="farmer-card-icon">
                                        📈
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "190px", paddingTop: "20px" }}>
                                    {lastSevenDays.map((day) => (
                                        <div key={day.dateKey} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                                            <small style={{ fontSize: "11px", fontWeight: 600 }}>
                                                ₹{day.value.toFixed(0)}
                                            </small>
                                            <div style={{ width: "100%", maxWidth: "38px", height: `${Math.max((day.value / maxDailySales) * 120, day.value > 0 ? 8 : 2)}px`, borderRadius: "8px 8px 3px 3px", background: "linear-gradient(180deg, #2f855a, #68a678)", transition: "height 0.3s ease" }}></div>
                                            <small style={{ fontSize: "11px" }}>
                                                {day.label}
                                            </small>
                                        </div>
                                    ))}
                                </div>

                                <p style={{ marginTop: "12px" }}>
                                    Sales are calculated from your products using the farmer-specific order value.
                                </p>
                            </div>

                            <div
                                className="farmer-quick-card"
                                style={{ width: "100%", minWidth: 0 }}
                            >
                                <div className="farmer-card-heading">
                                    <div>
                                        <span>
                                            ORDER STATUS
                                        </span>
                                        <h3>
                                            Order Distribution
                                        </h3>
                                    </div>
                                    <span className="farmer-card-icon">
                                        📦
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                                    {statusData.map((item) => (
                                        <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(0, 0, 0, 0.03)" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                                                <span>{item.icon}</span>
                                                {item.label}
                                            </span>
                                            <strong>{item.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="farmer-quick-card" style={{ marginTop: "20px" }}>
                            <div className="farmer-card-heading">
                                <div>
                                    <span>
                                        TOP PRODUCTS
                                    </span>
                                    <h3>
                                        Best-Selling Products
                                    </h3>
                                </div>
                                <span className="farmer-card-icon">
                                    🌱
                                </span>
                            </div>

                            {topProducts.length === 0 ? (
                                <p style={{ marginTop: "12px" }}>
                                    No sales data is available yet. Your product performance will appear here after customers place orders.
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                                    {topProducts.map((product, index) => (
                                        <div key={product.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "12px 14px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                                <strong style={{ minWidth: "28px" }}>#{index + 1}</strong>
                                                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {product.name}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <strong>
                                                    ₹{product.sales.toFixed(2)}
                                                </strong>
                                                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                                                    {product.quantity.toFixed(2)} kg sold
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        );
    };

    // =========================================================
    // DASHBOARD HOME
    // =========================================================

    const renderDashboardHome = () => {
        const availableProducts =
            products.filter(
                (product) =>
                    product.is_available
            ).length;

        const unavailableProducts =
            products.filter(
                (product) =>
                    !product.is_available
            ).length;

        const lowStockProducts =
            products.filter(
                (product) =>
                    Number(
                        product.available_quantity
                    ) <= 10
            ).length;

        return (
            <div className="farmer-home">

                <div className="farmer-welcome-card">
                    <div>
                        <span className="farmer-welcome-label">
                            WELCOME BACK
                        </span>

                        <h2>
                            Hello,{" "}
                            {farmerName} 👋
                        </h2>

                        <p>
                            Manage your farm
                            products and use
                            AI-powered insights
                            to grow your
                            business.
                        </p>
                    </div>

                    <div className="farmer-welcome-icon">
                        🌾
                    </div>
                </div>

                <div className="farmer-stat-grid">

                    <div className="farmer-stat-card">
                        <div className="farmer-stat-icon">
                            🌱
                        </div>

                        <div>
                            <span>
                                Total Products
                            </span>

                            <strong>
                                {products.length}
                            </strong>
                        </div>
                    </div>

                    <div className="farmer-stat-card">
                        <div className="farmer-stat-icon">
                            🟢
                        </div>

                        <div>
                            <span>
                                Available
                            </span>

                            <strong>
                                {availableProducts}
                            </strong>
                        </div>
                    </div>

                    <div className="farmer-stat-card">
                        <div className="farmer-stat-icon">
                            🔴
                        </div>

                        <div>
                            <span>
                                Unavailable
                            </span>

                            <strong>
                                {unavailableProducts}
                            </strong>
                        </div>
                    </div>

                    <div className="farmer-stat-card">
                        <div className="farmer-stat-icon">
                            ⚠️
                        </div>

                        <div>
                            <span>
                                Low Stock
                            </span>

                            <strong>
                                {lowStockProducts}
                            </strong>
                        </div>
                    </div>

                </div>

                {renderSalesAnalytics()}

                <div className="farmer-home-grid">

                    <div className="farmer-quick-card">

                        <div className="farmer-card-heading">
                            <div>
                                <span>
                                    PRODUCT MANAGEMENT
                                </span>

                                <h3>
                                    My Products
                                </h3>
                            </div>

                            <span className="farmer-card-icon">
                                🌱
                            </span>
                        </div>

                        <p>
                            Add, edit, delete and
                            manage the availability
                            of your agricultural
                            products.
                        </p>

                        <button
                            type="button"
                            className="farmer-primary-button"
                            onClick={() =>
                                setActivePage(
                                    "products"
                                )
                            }
                        >
                            Manage Products →
                        </button>

                    </div>

                    <div className="farmer-quick-card">

                        <div className="farmer-card-heading">
                            <div>
                                <span>
                                    AI INSIGHTS
                                </span>

                                <h3>
                                    Demand Prediction
                                </h3>
                            </div>

                            <span className="farmer-card-icon">
                                🤖
                            </span>
                        </div>

                        <p>
                            Use AI-based demand
                            insights to understand
                            which products may have
                            higher demand.
                        </p>

                        <button
                            type="button"
                            className="farmer-secondary-button"
                            onClick={() =>
                                setActivePage(
                                    "demand"
                                )
                            }
                        >
                            View Prediction →
                        </button>

                    </div>

                    <div className="farmer-quick-card">

                        <div className="farmer-card-heading">
                            <div>
                                <span>
                                    AI PRICING
                                </span>

                                <h3>
                                    Price Recommendation
                                </h3>
                            </div>

                            <span className="farmer-card-icon">
                                💰
                            </span>
                        </div>

                        <p>
                            Get AI-powered price
                            recommendations for
                            your agricultural
                            products.
                        </p>

                        <button
                            type="button"
                            className="farmer-secondary-button"
                            onClick={() =>
                                setActivePage(
                                    "price"
                                )
                            }
                        >
                            View Recommendation →
                        </button>

                    </div>

                </div>
            </div>
        );
    };

    // =========================================================
    // PRODUCTS CONTENT
    // =========================================================

    const renderProducts = () => {
        return (
            <div className="farmer-products-page">

                <div className="farmer-page-heading">

                    <div>
                        <span>
                            FARM MANAGEMENT
                        </span>

                        <h2>
                            My Products
                        </h2>

                        <p>
                            Manage the products
                            you sell directly to
                            customers.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-product-button"
                        onClick={() => {
                            if (showForm) {
                                setShowForm(false);
                                setEditingProduct(null);
                                setFormError("");
                            } else {
                                resetProductForm();
                                setShowForm(true);
                            }
                        }}
                    >
                        {showForm
                            ? "Close Form"
                            : "+ Add New Product"}
                    </button>

                </div>

                {showForm && (
                    <form
                        className="add-product-form"
                        onSubmit={
                            editingProduct
                                ? handleEditProduct
                                : handleAddProduct
                        }
                    >

                        <div className="product-form-heading">

                            <div>
                                <span>
                                    PRODUCT MANAGEMENT
                                </span>

                                <h3>
                                    {editingProduct
                                        ? "Edit Product"
                                        : "Add New Product"}
                                </h3>
                            </div>

                            <button
                                type="button"
                                className="product-form-close"
                                onClick={() => {
                                    setShowForm(false);
                                    resetProductForm();
                                }}
                            >
                                ✕
                            </button>

                        </div>

                        {formError && (
                            <p className="form-error">
                                {formError}
                            </p>
                        )}

                        <div className="product-form-grid">

                            <div className="product-form-field">
                                <label>
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div className="product-form-field">
                                <label>
                                    Category
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">
                                        Select Category
                                    </option>

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

                            <div className="product-form-field full-width">
                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        formData.description
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter product description"
                                    rows="4"
                                />
                            </div>

                            <div className="product-form-field">
                                <label>
                                    Price per kg
                                </label>

                                <input
                                    type="number"
                                    name="price_per_kg"
                                    value={
                                        formData.price_per_kg
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Example: 55"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="product-form-field">
                                <label>
                                    Available Quantity
                                </label>

                                <input
                                    type="number"
                                    name="available_quantity"
                                    value={
                                        formData.available_quantity
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Example: 100"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="product-form-field">
                                <label>
                                    Unit
                                </label>

                                <select
                                    name="unit"
                                    value={
                                        formData.unit
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                >
                                    <option value="kg">
                                        kg
                                    </option>

                                    <option value="gram">
                                        gram
                                    </option>

                                    <option value="liter">
                                        liter
                                    </option>

                                    <option value="piece">
                                        piece
                                    </option>
                                </select>
                            </div>

                            <div className="product-form-field">
                                <label>
                                    Product Image
                                </label>

                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={
                                        handleInputChange
                                    }
                                />
                            </div>

                        </div>

                        <label className="availability-checkbox">

                            <input
                                type="checkbox"
                                name="is_available"
                                checked={
                                    formData.is_available
                                }
                                onChange={
                                    handleInputChange
                                }
                            />

                            <span>
                                Product is available
                            </span>

                        </label>

                        <button
                            type="submit"
                            className="save-product-button"
                            disabled={
                                formLoading
                            }
                        >
                            {formLoading
                                ? "Saving..."
                                : editingProduct
                                ? "Update Product"
                                : "Add Product"}
                        </button>

                    </form>
                )}

                {loading && (
                    <div className="farmer-state-card">

                        <span className="farmer-loading-icon">
                            ⏳
                        </span>

                        <h3>
                            Loading products...
                        </h3>

                        <p>
                            Please wait while we
                            load your products.
                        </p>

                    </div>
                )}

                {error && (
                    <div className="farmer-error-card">

                        <strong>
                            ⚠️ Unable to load
                            products
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>
                )}

                {!loading &&
                    !error &&
                    products.length === 0 && (
                        <div className="farmer-state-card">

                            <span className="farmer-empty-icon">
                                🌱
                            </span>

                            <h3>
                                No products found
                            </h3>

                            <p>
                                Add your first
                                agricultural product
                                to start selling.
                            </p>

                            <button
                                type="button"
                                className="farmer-primary-button"
                                onClick={() => {
                                    resetProductForm();
                                    setShowForm(true);
                                }}
                            >
                                + Add Product
                            </button>

                        </div>
                    )}

                {!loading &&
                    !error &&
                    products.length > 0 && (
                        <div className="farmer-products-grid">

                            {products.map(
                                (product) => (

                                    <div
                                        key={
                                            product.id
                                        }
                                        className="farmer-product-card"
                                    >

                                        <div className="farmer-product-image-container">

                                            {product.image ? (
                                                <img
                                                    src={getImageUrl(
                                                        product.image
                                                    )}
                                                    alt={
                                                        product.name
                                                    }
                                                    className="farmer-product-image"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display =
                                                            "none";

                                                        const placeholder =
                                                            event.currentTarget
                                                                .parentElement
                                                                ?.querySelector(
                                                                    ".farmer-product-image-placeholder"
                                                                );

                                                        if (placeholder) {
                                                            placeholder.style.display =
                                                                "flex";
                                                        }
                                                    }}
                                                />
                                            ) : null}

                                            <div
                                                className="farmer-product-image-placeholder"
                                                style={{
                                                    display: product.image
                                                        ? "none"
                                                        : "flex",
                                                }}
                                            >
                                                🌱
                                            </div>

                                            <span
                                                className={
                                                    product.is_available
                                                        ? "product-image-status available"
                                                        : "product-image-status unavailable"
                                                }
                                            >
                                                {product.is_available
                                                    ? "AVAILABLE"
                                                    : "UNAVAILABLE"}
                                            </span>

                                        </div>

                                        <div className="farmer-product-card-top">

                                            <div className="farmer-product-icon">
                                                🌱
                                            </div>

                                            <span
                                                className={
                                                    product.is_available
                                                        ? "product-status available"
                                                        : "product-status unavailable"
                                                }
                                            >
                                                {product.is_available
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </span>

                                        </div>

                                        <h3>
                                            {
                                                product.name
                                            }
                                        </h3>

                                        <p className="farmer-product-category">
                                            {
                                                product.category
                                            }
                                        </p>

                                        <div className="farmer-product-info">

                                            <div>
                                                <span>
                                                    Price
                                                </span>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        product.price_per_kg
                                                    ).toFixed(
                                                        2
                                                    )}
                                                    /
                                                    {
                                                        product.unit
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Quantity
                                                </span>

                                                <strong>
                                                    {
                                                        product.available_quantity
                                                    }{" "}
                                                    {
                                                        product.unit
                                                    }
                                                </strong>
                                            </div>

                                        </div>

                                        {Number(
                                            product.available_quantity
                                        ) <= 10 && (
                                            <p className="low-stock-warning">
                                                ⚠️ Low stock
                                            </p>
                                        )}

                                        {Number(
                                            product.available_quantity
                                        ) <= 0 && (
                                            <p className="out-of-stock-warning">
                                                ❌ Out of stock
                                            </p>
                                        )}

                                        <div className="product-actions">

                                            <button
                                                type="button"
                                                className="edit-product-button"
                                                onClick={() =>
                                                    startEditingProduct(
                                                        product
                                                    )
                                                }
                                            >
                                                ✏️ Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="delete-product-button"
                                                onClick={() =>
                                                    handleDeleteProduct(
                                                        product.id,
                                                        product.name
                                                    )
                                                }
                                            >
                                                🗑️ Delete
                                            </button>

                                        </div>

                                        <div className="availability-control">

                                            <span>
                                                {product.is_available
                                                    ? "🟢 Available"
                                                    : "🔴 Unavailable"}
                                            </span>

                                            <button
                                                type="button"
                                                className="availability-button"
                                                onClick={() =>
                                                    handleToggleAvailability(
                                                        product
                                                    )
                                                }
                                            >
                                                {product.is_available
                                                    ? "Mark Unavailable"
                                                    : "Mark Available"}
                                            </button>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}

            </div>
        );
    };

    // =========================================================
    // REVIEWS CONTENT
    // =========================================================

    const renderReviews = () => {
        return (
            <div className="farmer-reviews-page">

                <div className="farmer-page-heading">

                    <div>
                        <span>
                            CUSTOMER FEEDBACK
                        </span>

                        <h2>
                            Reviews & Ratings
                        </h2>

                        <p>
                            View customer feedback
                            and ratings for your
                            agricultural products.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="farmer-secondary-button"
                        onClick={fetchFarmerReviews}
                        disabled={reviewsLoading}
                    >
                        {reviewsLoading
                            ? "Refreshing..."
                            : "↻ Refresh Reviews"}
                    </button>

                </div>

                {reviewsLoading && (
                    <div className="farmer-state-card">

                        <span className="farmer-loading-icon">
                            ⏳
                        </span>

                        <h3>
                            Loading reviews...
                        </h3>

                        <p>
                            Please wait while we
                            load your customer
                            reviews.
                        </p>

                    </div>
                )}

                {!reviewsLoading &&
                    reviewsError && (
                        <div className="farmer-error-card">

                            <strong>
                                ⚠️ Unable to load
                                reviews
                            </strong>

                            <p>
                                {reviewsError}
                            </p>

                            <button
                                type="button"
                                className="farmer-primary-button"
                                onClick={
                                    fetchFarmerReviews
                                }
                            >
                                Try Again
                            </button>

                        </div>
                    )}

                {!reviewsLoading &&
                    !reviewsError &&
                    farmerReviews && (
                        <>

                            {/* =================================================
                                REVIEW SUMMARY
                            ================================================= */}

                            <div className="farmer-review-summary-grid">

                                <div className="farmer-review-summary-card">

                                    <div className="farmer-review-summary-icon">
                                        ⭐
                                    </div>

                                    <div>
                                        <span>
                                            Overall Rating
                                        </span>

                                        <strong>
                                            {Number(
                                                farmerReviews.overall_rating ||
                                                0
                                            ).toFixed(1)}
                                            <small>
                                                {" "}
                                                / 5
                                            </small>
                                        </strong>
                                    </div>

                                </div>

                                <div className="farmer-review-summary-card">

                                    <div className="farmer-review-summary-icon">
                                        💬
                                    </div>

                                    <div>
                                        <span>
                                            Total Reviews
                                        </span>

                                        <strong>
                                            {
                                                farmerReviews.total_reviews
                                            }
                                        </strong>
                                    </div>

                                </div>

                                <div className="farmer-review-summary-card">

                                    <div className="farmer-review-summary-icon">
                                        🌱
                                    </div>

                                    <div>
                                        <span>
                                            Total Products
                                        </span>

                                        <strong>
                                            {
                                                farmerReviews.total_products
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                                STAR SUMMARY
                            ================================================= */}

                            <div className="farmer-overall-rating-card">

                                <div className="farmer-overall-rating-left">

                                    <span>
                                        CUSTOMER SATISFACTION
                                    </span>

                                    <h3>
                                        Your Products
                                        <br />
                                        Customer Rating
                                    </h3>

                                </div>

                                <div className="farmer-overall-rating-right">

                                    <strong>
                                        {Number(
                                            farmerReviews.overall_rating ||
                                            0
                                        ).toFixed(1)}
                                    </strong>

                                    <div className="farmer-rating-stars">
                                        {[
                                            1,
                                            2,
                                            3,
                                            4,
                                            5,
                                        ].map(
                                            (star) => (
                                                <span
                                                    key={
                                                        star
                                                    }
                                                    className={
                                                        star <=
                                                        Math.round(
                                                            Number(
                                                                farmerReviews.overall_rating ||
                                                                0
                                                            )
                                                        )
                                                            ? "farmer-rating-star active"
                                                            : "farmer-rating-star"
                                                    }
                                                >
                                                    ★
                                                </span>
                                            )
                                        )}
                                    </div>

                                    <p>
                                        Based on{" "}
                                        {
                                            farmerReviews.total_reviews
                                        }{" "}
                                        customer{" "}
                                        {
                                            farmerReviews.total_reviews ===
                                            1
                                                ? "review"
                                                : "reviews"
                                        }
                                    </p>

                                </div>

                            </div>

                            {/* =================================================
                                NO PRODUCTS
                            ================================================= */}

                            {(!farmerReviews.products ||
                                farmerReviews.products.length ===
                                    0) && (
                                <div className="farmer-state-card">

                                    <span className="farmer-empty-icon">
                                        🌱
                                    </span>

                                    <h3>
                                        No products found
                                    </h3>

                                    <p>
                                        Add products to
                                        your marketplace
                                        to receive
                                        customer reviews.
                                    </p>

                                    <button
                                        type="button"
                                        className="farmer-primary-button"
                                        onClick={() =>
                                            setActivePage(
                                                "products"
                                            )
                                        }
                                    >
                                        Go to My Products →
                                    </button>

                                </div>
                            )}

                            {/* =================================================
                                NO REVIEWS
                            ================================================= */}

                            {farmerReviews.products &&
                                farmerReviews.products.length >
                                    0 &&
                                farmerReviews.total_reviews ===
                                    0 && (
                                    <div className="farmer-state-card">

                                        <span className="farmer-empty-icon">
                                            ⭐
                                        </span>

                                        <h3>
                                            No customer
                                            reviews yet
                                        </h3>

                                        <p>
                                            Customer reviews
                                            will appear here
                                            after a delivered
                                            order is reviewed.
                                        </p>

                                    </div>
                                )}

                            {/* =================================================
                                PRODUCT REVIEWS
                            ================================================= */}

                            {farmerReviews.products &&
                                farmerReviews.products.length >
                                    0 && (
                                    <div className="farmer-review-products">

                                        {farmerReviews.products.map(
                                            (product) => (
                                                <div
                                                    key={
                                                        product.product_id
                                                    }
                                                    className="farmer-review-product-card"
                                                >

                                                    <div className="farmer-review-product-header">

                                                        <div>

                                                            <span>
                                                                PRODUCT
                                                            </span>

                                                            <h3>
                                                                🌱{" "}
                                                                {
                                                                    product.product_name
                                                                }
                                                            </h3>

                                                        </div>

                                                        <div className="farmer-review-product-rating">

                                                            <strong>
                                                                {Number(
                                                                    product.average_rating ||
                                                                    0
                                                                ).toFixed(
                                                                    1
                                                                )}
                                                            </strong>

                                                            <div className="farmer-rating-stars">

                                                                {[
                                                                    1,
                                                                    2,
                                                                    3,
                                                                    4,
                                                                    5,
                                                                ].map(
                                                                    (
                                                                        star
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                star
                                                                            }
                                                                            className={
                                                                                star <=
                                                                                Math.round(
                                                                                    Number(
                                                                                        product.average_rating ||
                                                                                        0
                                                                                    )
                                                                                )
                                                                                    ? "farmer-rating-star active"
                                                                                    : "farmer-rating-star"
                                                                            }
                                                                        >
                                                                            ★
                                                                        </span>
                                                                    )
                                                                )}

                                                            </div>

                                                            <span>
                                                                {
                                                                    product.review_count
                                                                }{" "}
                                                                {product.review_count ===
                                                                1
                                                                    ? "Review"
                                                                    : "Reviews"}
                                                            </span>

                                                        </div>

                                                    </div>

                                                    {/* REVIEWS FOR THIS PRODUCT */}

                                                    {product.reviews &&
                                                        product.reviews.length >
                                                            0 ? (
                                                        <div className="farmer-review-list">

                                                            {product.reviews.map(
                                                                (
                                                                    review
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            review.id
                                                                        }
                                                                        className="farmer-review-item"
                                                                    >

                                                                        <div className="farmer-review-item-top">

                                                                            <div className="farmer-review-customer">

                                                                                <div className="farmer-review-avatar">
                                                                                    {review.customer_name
                                                                                        ?.charAt(
                                                                                            0
                                                                                        )
                                                                                        .toUpperCase() ||
                                                                                        "C"}
                                                                                </div>

                                                                                <div>

                                                                                    <strong>
                                                                                        {
                                                                                            review.customer_name ||
                                                                                            "Customer"
                                                                                        }
                                                                                    </strong>

                                                                                    <span>
                                                                                        Customer
                                                                                    </span>

                                                                                </div>

                                                                            </div>

                                                                            <div className="farmer-review-date">

                                                                                {review.created_at
                                                                                    ? new Date(
                                                                                        review.created_at
                                                                                    ).toLocaleDateString(
                                                                                        "en-IN",
                                                                                        {
                                                                                            day: "2-digit",
                                                                                            month: "short",
                                                                                            year: "numeric",
                                                                                        }
                                                                                    )
                                                                                    : ""}
                                                                            </div>

                                                                        </div>

                                                                        <div className="farmer-review-rating">

                                                                            {[
                                                                                1,
                                                                                2,
                                                                                3,
                                                                                4,
                                                                                5,
                                                                            ].map(
                                                                                (
                                                                                    star
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            star
                                                                                        }
                                                                                        className={
                                                                                            star <=
                                                                                            review.rating
                                                                                                ? "farmer-review-star active"
                                                                                                : "farmer-review-star"
                                                                                        }
                                                                                    >
                                                                                        ★
                                                                                    </span>
                                                                                )
                                                                            )}

                                                                            <strong>
                                                                                {
                                                                                    review.rating
                                                                                }
                                                                                /5
                                                                            </strong>

                                                                        </div>

                                                                        {review.comment ? (
                                                                            <p className="farmer-review-comment">
                                                                                “
                                                                                {
                                                                                    review.comment
                                                                                }
                                                                                ”
                                                                            </p>
                                                                        ) : (
                                                                            <p className="farmer-review-no-comment">
                                                                                Customer did not
                                                                                leave a comment.
                                                                            </p>
                                                                        )}

                                                                    </div>
                                                                )
                                                            )}

                                                        </div>
                                                    ) : (
                                                        <div className="farmer-product-no-reviews">

                                                            <span>
                                                                ⭐
                                                            </span>

                                                            <p>
                                                                No reviews
                                                                yet for
                                                                this product.
                                                            </p>

                                                        </div>
                                                    )}

                                                </div>
                                            )
                                        )}

                                    </div>
                                )}

                        </>
                    )}

            </div>
        );
    };

    // =========================================================
    // MAIN CONTENT SWITCH
    // =========================================================

    const renderMainContent = () => {
        switch (activePage) {

            case "dashboard":
                return (
                    <div className="farmer-component-wrapper">
                        {renderDashboardHome()}
                    </div>
                );

            case "products":
                return (
                    <div className="farmer-component-wrapper">
                        {renderProducts()}
                    </div>
                );

            case "orders":
                return (
                    <div className="farmer-component-wrapper">
                        <FarmerOrders />
                    </div>
                );

            case "demand":
                return (
                    <div className="farmer-component-wrapper">

                        <div className="farmer-page-heading">
                            <div>
                                <span>
                                    AI FARM INSIGHTS
                                </span>

                                <h2>
                                    Demand Prediction
                                </h2>

                                <p>
                                    AI-powered demand
                                    analysis for your
                                    products.
                                </p>
                            </div>
                        </div>

                        <FarmerDemandPrediction
                            products={products}
                        />

                    </div>
                );

            case "price":
                return (
                    <div className="farmer-component-wrapper">

                        <div className="farmer-page-heading">
                            <div>
                                <span>
                                    AI PRICING
                                </span>

                                <h2>
                                    Price Recommendation
                                </h2>

                                <p>
                                    AI-powered price
                                    recommendations
                                    for your products.
                                </p>
                            </div>
                        </div>

                        <FarmerPriceRecommendation
                            products={products}
                        />

                    </div>
                );

            case "reviews":
                return (
                    <div className="farmer-component-wrapper">
                        {renderReviews()}
                    </div>
                );

            case "notifications":
                return (
                    <div className="farmer-component-wrapper">

                        <div className="farmer-page-heading">
                            <div>
                                <span>
                                    ACCOUNT ACTIVITY
                                </span>

                                <h2>
                                    Notifications
                                </h2>

                                <p>
                                    Stay updated with
                                    your farm and
                                    marketplace
                                    activities.
                                </p>
                            </div>
                        </div>

                        <FarmerNotifications />

                    </div>
                );

            default:
                return (
                    <div className="farmer-component-wrapper">
                        {renderDashboardHome()}
                    </div>
                );
        }
    };

    // =========================================================
    // OPEN PROFILE
    // =========================================================

    const openProfile = () => {
        setShowProfile(true);

        setIsEditingProfile(false);
        setShowChangePassword(false);

        setProfileMessage("");
        setProfileError("");

        setPasswordMessage("");
        setPasswordError("");
    };

    // =========================================================
    // CLOSE PROFILE
    // =========================================================

    const closeProfile = () => {
        setShowProfile(false);
        setIsEditingProfile(false);
        setShowChangePassword(false);
    };

    return (
        <div className="farmer-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="farmer-header">

                <div className="farmer-brand-section">

                    <div className="farmer-brand-icon">
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

                <div className="farmer-header-right">

                    {/* NOTIFICATION */}

                    <button
                        type="button"
                        className="farmer-header-notification"
                        onClick={
                            handleNotificationsClick
                        }
                        aria-label="Open notifications"
                    >
                        🔔

                        {unreadCount > 0 && (
                            <span className="farmer-notification-badge">
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* PROFILE */}

                    <div
                        className="farmer-profile"
                        onClick={
                            openProfile
                        }
                        style={{
                            cursor: "pointer",
                        }}
                    >

                        <div className="farmer-profile-avatar">
                            {farmerName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {farmerName}
                            </strong>

                            <span>
                                {farmerProfile?.email ||
                                    "Farmer Account"}
                            </span>
                        </div>

                    </div>

                </div>

            </header>

            {/* =================================================
                FARMER PROFILE MODAL
            ================================================= */}

            {showProfile && (
                <div
                    className="farmer-profile-overlay"
                    onClick={
                        closeProfile
                    }
                >
                    <div
                        className="farmer-profile-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="farmer-modal-header">

                            <h2>
                                {showChangePassword
                                    ? "🔐 Change Password"
                                    : "👨‍🌾 Farmer Profile"}
                            </h2>

                            <button
                                type="button"
                                className="farmer-modal-close"
                                onClick={
                                    closeProfile
                                }
                            >
                                ✕
                            </button>

                        </div>

                        {showChangePassword ? (

                            <form
                                onSubmit={
                                    handleChangePassword
                                }
                            >

                                {passwordMessage && (
                                    <div className="farmer-success-message">
                                        ✅{" "}
                                        {
                                            passwordMessage
                                        }
                                    </div>
                                )}

                                {passwordError && (
                                    <div className="farmer-error-message">
                                        ❌{" "}
                                        {
                                            passwordError
                                        }
                                    </div>
                                )}

                                <div className="farmer-profile-field">

                                    <label>
                                        Current Password
                                    </label>

                                    <input
                                        type="password"
                                        name="current_password"
                                        value={
                                            passwordForm.current_password
                                        }
                                        onChange={
                                            handlePasswordInputChange
                                        }
                                        placeholder="Enter current password"
                                        autoComplete="current-password"
                                        disabled={
                                            passwordSaving
                                        }
                                    />

                                </div>

                                <div className="farmer-profile-field">

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
                                            handlePasswordInputChange
                                        }
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        disabled={
                                            passwordSaving
                                        }
                                    />

                                </div>

                                <div className="farmer-profile-field">

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
                                            handlePasswordInputChange
                                        }
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        disabled={
                                            passwordSaving
                                        }
                                    />

                                </div>

                                <div className="farmer-modal-buttons">

                                    <button
                                        type="submit"
                                        className="farmer-save-button"
                                        disabled={
                                            passwordSaving
                                        }
                                    >
                                        {passwordSaving
                                            ? "Changing..."
                                            : "🔐 Change Password"}
                                    </button>

                                    <button
                                        type="button"
                                        className="farmer-cancel-button"
                                        onClick={
                                            handleCancelPasswordChange
                                        }
                                        disabled={
                                            passwordSaving
                                        }
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        ) : (

                            <>

                                <div className="farmer-profile-top">

                                    <div className="farmer-profile-large-avatar">
                                        {farmerProfile?.username
                                            ?.charAt(0)
                                            .toUpperCase() ||
                                            "F"}
                                    </div>

                                    {!isEditingProfile && (
                                        <>
                                            <h3>
                                                {farmerProfile?.username ||
                                                    "Farmer"}
                                            </h3>

                                            <span>
                                                Farmer Account
                                            </span>
                                        </>
                                    )}

                                </div>

                                {profileMessage && (
                                    <div className="farmer-success-message">
                                        ✅{" "}
                                        {
                                            profileMessage
                                        }
                                    </div>
                                )}

                                {profileError && (
                                    <div className="farmer-error-message">
                                        ❌{" "}
                                        {
                                            profileError
                                        }
                                    </div>
                                )}

                                {isEditingProfile ? (

                                    <form
                                        onSubmit={
                                            handleSaveProfile
                                        }
                                    >

                                        <div className="farmer-profile-field">

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
                                                    handleProfileInputChange
                                                }
                                                placeholder="Enter username"
                                                disabled={
                                                    profileSaving
                                                }
                                            />

                                        </div>

                                        <div className="farmer-profile-field">

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
                                                    handleProfileInputChange
                                                }
                                                placeholder="Enter email"
                                                disabled={
                                                    profileSaving
                                                }
                                            />

                                        </div>

                                        <div className="farmer-profile-field">

                                            <label>
                                                Phone
                                            </label>

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={
                                                    profileForm.phone
                                                }
                                                onChange={
                                                    handleProfileInputChange
                                                }
                                                placeholder="Enter phone number"
                                                disabled={
                                                    profileSaving
                                                }
                                            />

                                        </div>

                                        <div className="farmer-modal-buttons">

                                            <button
                                                type="submit"
                                                className="farmer-save-button"
                                                disabled={
                                                    profileSaving
                                                }
                                            >
                                                {profileSaving
                                                    ? "Saving..."
                                                    : "💾 Save Changes"}
                                            </button>

                                            <button
                                                type="button"
                                                className="farmer-cancel-button"
                                                onClick={
                                                    handleCancelEdit
                                                }
                                                disabled={
                                                    profileSaving
                                                }
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </form>

                                ) : (

                                    <>

                                        <div className="farmer-profile-details">

                                            <div>
                                                <strong>
                                                    Email
                                                </strong>

                                                <p>
                                                    {farmerProfile?.email ||
                                                        "Not available"}
                                                </p>
                                            </div>

                                            <div>
                                                <strong>
                                                    Phone
                                                </strong>

                                                <p>
                                                    {farmerProfile?.phone ||
                                                        "Not available"}
                                                </p>
                                            </div>

                                            <div>
                                                <strong>
                                                    Role
                                                </strong>

                                                <p>
                                                    {farmerProfile?.role ||
                                                        "FARMER"}
                                                </p>
                                            </div>

                                            <div>
                                                <strong>
                                                    Account ID
                                                </strong>

                                                <p>
                                                    #
                                                    {farmerProfile?.id ||
                                                        "—"}
                                                </p>
                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="farmer-full-button"
                                            onClick={
                                                handleEditProfile
                                            }
                                        >
                                            ✏️ Edit Profile
                                        </button>

                                        <button
                                            type="button"
                                            className="farmer-outline-button"
                                            onClick={
                                                handleOpenChangePassword
                                            }
                                        >
                                            🔐 Change Password
                                        </button>

                                    </>
                                )}

                            </>
                        )}

                    </div>
                </div>
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="farmer-sidebar">

                <div className="farmer-sidebar-title">
                    FARMER MENU
                </div>

                <nav>

                    {MENU_ITEMS.map(
                        (item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={
                                    activePage ===
                                    item.id
                                        ? "farmer-sidebar-item active"
                                        : "farmer-sidebar-item"
                                }
                                onClick={() => {

                                    setActivePage(
                                        item.id
                                    );

                                    if (
                                        item.id ===
                                        "notifications"
                                    ) {
                                        fetchUnreadNotifications();
                                    }

                                    if (
                                        item.id ===
                                        "reviews"
                                    ) {
                                        fetchFarmerReviews();
                                    }

                                }}
                            >

                                <span className="farmer-sidebar-icon">
                                    {
                                        item.icon
                                    }
                                </span>

                                <span>
                                    {
                                        item.label
                                    }
                                </span>

                            </button>
                        )
                    )}

                </nav>

                <div className="farmer-sidebar-bottom">

                    <button
                        type="button"
                        className="farmer-sidebar-item logout"
                        onClick={
                            onLogout
                        }
                    >

                        <span className="farmer-sidebar-icon">
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="farmer-main">

                <div className="farmer-dashboard-status">

                    <span className="farmer-status-dot"></span>

                    Farmer Dashboard

                </div>

                {renderMainContent()}

            </main>

        </div>
    );
}

export default FarmerDashboard;