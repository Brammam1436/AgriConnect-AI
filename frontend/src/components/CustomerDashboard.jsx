import { useEffect, useState } from "react";
import CustomerCart from "./CustomerCart";
import CustomerOrders from "./CustomerOrders";
import CustomerShopping from "./CustomerShopping";
import CustomerNotifications from "./CustomerNotifications";
import CustomerAddresses from "./CustomerAddresses";
import api from "../api/api";
import "./CustomerDashboard.css";

const MENU_ITEMS = [
    { id: "shopping", icon: "🛍️", label: "Shopping" },
    { id: "cart", icon: "🛒", label: "My Cart" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "orders", icon: "📦", label: "My Orders" },
    { id: "addresses", icon: "📍", label: "My Addresses" },
];

function CustomerDashboard({ onLogout }) {
    const [activePage, setActivePage] = useState("shopping");
    const [unreadCount, setUnreadCount] = useState(0);

    const [customerName, setCustomerName] = useState(
        localStorage.getItem("current_username") || "Customer"
    );

    const [customerProfile, setCustomerProfile] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // PROFILE FORM
    const [profileForm, setProfileForm] = useState({
        username: "",
        email: "",
        phone: "",
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    // CHANGE PASSWORD
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
    // FETCH CUSTOMER PROFILE
    // =========================================================

    const fetchCustomerProfile = async () => {
        try {
            const response = await api.get("/api/auth/me/");

            const user = response.data?.user;

            if (user) {
                setCustomerProfile(user);
                setCustomerName(user.username || "Customer");
            }
        } catch (error) {
            console.error(
                "Customer profile fetch error:",
                error
            );
        }
    };

    // =========================================================
    // EDIT PROFILE
    // =========================================================

    const handleEditProfile = () => {
        if (!customerProfile) {
            return;
        }

        setProfileForm({
            username: customerProfile.username || "",
            email: customerProfile.email || "",
            phone: customerProfile.phone || "",
        });

        setProfileMessage("");
        setProfileError("");

        setShowChangePassword(false);
        setPasswordMessage("");
        setPasswordError("");

        setIsEditingProfile(true);
    };

    const handleProfileInputChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setProfileMessage("");
        setProfileError("");

        if (!profileForm.username.trim()) {
            setProfileError("Username is required.");
            return;
        }

        if (!profileForm.email.trim()) {
            setProfileError("Email is required.");
            return;
        }

        try {
            setProfileSaving(true);

            const response = await api.put(
                "/api/auth/me/",
                {
                    username: profileForm.username.trim(),
                    email: profileForm.email.trim(),
                    phone: profileForm.phone.trim(),
                }
            );

            const updatedUser = response.data?.user;

            if (updatedUser) {
                setCustomerProfile(updatedUser);

                setCustomerName(
                    updatedUser.username || "Customer"
                );

                localStorage.setItem(
                    "current_username",
                    updatedUser.username || "Customer"
                );
            }

            setProfileMessage(
                "Profile updated successfully."
            );

            setIsEditingProfile(false);

        } catch (error) {
            console.error(
                "Profile update error:",
                error
            );

            const errorData = error.response?.data;

            if (errorData?.username) {
                setProfileError(
                    Array.isArray(errorData.username)
                        ? errorData.username[0]
                        : errorData.username
                );
            } else if (errorData?.email) {
                setProfileError(
                    Array.isArray(errorData.email)
                        ? errorData.email[0]
                        : errorData.email
                );
            } else if (errorData?.phone) {
                setProfileError(
                    Array.isArray(errorData.phone)
                        ? errorData.phone[0]
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

    const handleOpenChangePassword = () => {
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

    const handlePasswordInputChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (!passwordForm.current_password) {
            setPasswordError(
                "Current password is required."
            );
            return;
        }

        if (!passwordForm.new_password) {
            setPasswordError(
                "New password is required."
            );
            return;
        }

        if (!passwordForm.confirm_password) {
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

            const response = await api.post(
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
                "Change password error:",
                error
            );

            const errorData = error.response?.data;

            if (errorData?.current_password) {
                setPasswordError(
                    Array.isArray(
                        errorData.current_password
                    )
                        ? errorData.current_password[0]
                        : errorData.current_password
                );
            } else if (errorData?.new_password) {
                setPasswordError(
                    Array.isArray(
                        errorData.new_password
                    )
                        ? errorData.new_password[0]
                        : errorData.new_password
                );
            } else if (errorData?.confirm_password) {
                setPasswordError(
                    Array.isArray(
                        errorData.confirm_password
                    )
                        ? errorData.confirm_password[0]
                        : errorData.confirm_password
                );
            } else if (errorData?.detail) {
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

    const handleCancelPasswordChange = () => {
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
    // NOTIFICATIONS
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
                "Unread notification count error:",
                error
            );
        }
    };

    useEffect(() => {
        fetchCustomerProfile();
        fetchUnreadNotifications();

        const notificationInterval = setInterval(() => {
            fetchUnreadNotifications();
        }, 30000);

        return () => {
            clearInterval(notificationInterval);
        };
    }, []);

    const handleNotificationsClick = () => {
        setActivePage("notifications");
        fetchUnreadNotifications();
    };

    // =========================================================
    // MAIN CONTENT
    // =========================================================

    const renderMainContent = () => {
        switch (activePage) {
            case "shopping":
                return <CustomerShopping />;

            case "cart":
                return (
                    <div className="customer-component-wrapper">
                        <CustomerCart />
                    </div>
                );

            case "notifications":
                return (
                    <div className="customer-component-wrapper">
                        <CustomerNotifications />
                    </div>
                );

            case "orders":
                return (
                    <div className="customer-component-wrapper">
                        <CustomerOrders />
                    </div>
                );

            case "addresses":
                return (
                    <div className="customer-component-wrapper">
                        <CustomerAddresses />
                    </div>
                );

            default:
                return <CustomerShopping />;
        }
    };

    return (
        <div className="customer-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="customer-header">

                <div className="brand-section">

                    <div className="brand-icon">
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

                <div className="header-right">

                    {/* HEADER NOTIFICATION */}

                    <button
                        type="button"
                        className="header-notification"
                        onClick={handleNotificationsClick}
                        aria-label="Open notifications"
                    >
                        🔔

                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* CUSTOMER PROFILE */}

                    <div
                        className="customer-profile"
                        onClick={() => {
                            setShowProfile(true);
                            setIsEditingProfile(false);
                            setShowChangePassword(false);

                            setProfileMessage("");
                            setProfileError("");

                            setPasswordMessage("");
                            setPasswordError("");
                        }}
                        style={{
                            cursor: "pointer",
                        }}
                    >

                        <div className="profile-avatar">
                            {customerName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <strong>
                                {customerName}
                            </strong>

                            <span>
                                {customerProfile?.email ||
                                    "Customer Account"}
                            </span>

                        </div>

                    </div>

                </div>

            </header>

            {/* =================================================
                CUSTOMER PROFILE MODAL
            ================================================= */}

            {showProfile && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            "rgba(0, 0, 0, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        boxSizing: "border-box",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        setShowProfile(false);
                        setIsEditingProfile(false);
                        setShowChangePassword(false);
                    }}
                >

                    <div
                        style={{
                            width: "420px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "25px",
                            boxSizing: "border-box",
                            boxShadow:
                                "0 15px 40px rgba(0, 0, 0, 0.20)",
                        }}
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                marginBottom: "22px",
                            }}
                        >

                            <h2
                                style={{
                                    margin: 0,
                                    color: "#126b2c",
                                    fontSize: "22px",
                                }}
                            >
                                {showChangePassword
                                    ? "🔐 Change Password"
                                    : "👤 Customer Profile"}
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfile(false);
                                    setIsEditingProfile(false);
                                    setShowChangePassword(false);
                                }}
                                style={{
                                    border: "none",
                                    background:
                                        "transparent",
                                    fontSize: "22px",
                                    cursor: "pointer",
                                    color: "#526058",
                                }}
                                aria-label="Close profile"
                            >
                                ✕
                            </button>

                        </div>

                        {/* =================================================
                            CHANGE PASSWORD SCREEN
                        ================================================= */}

                        {showChangePassword ? (

                            <form
                                onSubmit={
                                    handleChangePassword
                                }
                            >

                                {/* PASSWORD SUCCESS */}

                                {passwordMessage && (
                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding: "11px 13px",
                                            borderRadius: "8px",
                                            background: "#eaf8ed",
                                            border:
                                                "1px solid #ccebd3",
                                            color: "#197238",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        ✅ {passwordMessage}
                                    </div>
                                )}

                                {/* PASSWORD ERROR */}

                                {passwordError && (
                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding: "11px 13px",
                                            borderRadius: "8px",
                                            background: "#fff3f3",
                                            border:
                                                "1px solid #f3caca",
                                            color: "#c62828",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        ❌ {passwordError}
                                    </div>
                                )}

                                {/* CURRENT PASSWORD */}

                                <div
                                    style={{
                                        marginBottom: "16px",
                                    }}
                                >

                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "7px",
                                            color: "#263c2d",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                        }}
                                    >
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
                                        style={{
                                            width: "100%",
                                            height: "42px",
                                            padding: "0 12px",
                                            boxSizing: "border-box",
                                            border:
                                                "1px solid #cddbd0",
                                            borderRadius: "8px",
                                            outline: "none",
                                            color: "#263c2d",
                                            background: "#ffffff",
                                            fontSize: "13px",
                                        }}
                                    />

                                </div>

                                {/* NEW PASSWORD */}

                                <div
                                    style={{
                                        marginBottom: "16px",
                                    }}
                                >

                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "7px",
                                            color: "#263c2d",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                        }}
                                    >
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
                                        style={{
                                            width: "100%",
                                            height: "42px",
                                            padding: "0 12px",
                                            boxSizing: "border-box",
                                            border:
                                                "1px solid #cddbd0",
                                            borderRadius: "8px",
                                            outline: "none",
                                            color: "#263c2d",
                                            background: "#ffffff",
                                            fontSize: "13px",
                                        }}
                                    />

                                </div>

                                {/* CONFIRM PASSWORD */}

                                <div
                                    style={{
                                        marginBottom: "20px",
                                    }}
                                >

                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "7px",
                                            color: "#263c2d",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                        }}
                                    >
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
                                        style={{
                                            width: "100%",
                                            height: "42px",
                                            padding: "0 12px",
                                            boxSizing: "border-box",
                                            border:
                                                "1px solid #cddbd0",
                                            borderRadius: "8px",
                                            outline: "none",
                                            color: "#263c2d",
                                            background: "#ffffff",
                                            fontSize: "13px",
                                        }}
                                    />

                                </div>

                                {/* PASSWORD BUTTONS */}

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                    }}
                                >

                                    <button
                                        type="submit"
                                        disabled={
                                            passwordSaving
                                        }
                                        style={{
                                            flex: 1,
                                            minHeight: "42px",
                                            border: "none",
                                            borderRadius: "9px",
                                            background:
                                                passwordSaving
                                                    ? "#9bb9a2"
                                                    : "#21883f",
                                            color: "#ffffff",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor:
                                                passwordSaving
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        {passwordSaving
                                            ? "Changing..."
                                            : "🔐 Change Password"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleCancelPasswordChange
                                        }
                                        disabled={
                                            passwordSaving
                                        }
                                        style={{
                                            flex: 1,
                                            minHeight: "42px",
                                            border:
                                                "1px solid #cddbd0",
                                            borderRadius: "9px",
                                            background: "#ffffff",
                                            color: "#526058",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor:
                                                passwordSaving
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        ) : (

                            <>
                                {/* PROFILE AVATAR */}

                                <div
                                    style={{
                                        textAlign: "center",
                                        marginBottom: "22px",
                                    }}
                                >

                                    <div
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                            margin:
                                                "0 auto 12px",
                                            borderRadius: "50%",
                                            background:
                                                "#21883f",
                                            color: "#ffffff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent:
                                                "center",
                                            fontSize: "28px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        {customerProfile?.username
                                            ?.charAt(0)
                                            .toUpperCase() ||
                                            "C"}
                                    </div>

                                    {!isEditingProfile && (
                                        <>
                                            <h3
                                                style={{
                                                    margin:
                                                        "0 0 5px",
                                                    color:
                                                        "#263c2d",
                                                }}
                                            >
                                                {customerProfile?.username ||
                                                    "Customer"}
                                            </h3>

                                            <span
                                                style={{
                                                    color:
                                                        "#718074",
                                                    fontSize:
                                                        "13px",
                                                }}
                                            >
                                                Customer Account
                                            </span>
                                        </>
                                    )}

                                </div>

                                {/* PROFILE SUCCESS MESSAGE */}

                                {profileMessage && (
                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding:
                                                "11px 13px",
                                            borderRadius: "8px",
                                            background:
                                                "#eaf8ed",
                                            border:
                                                "1px solid #ccebd3",
                                            color:
                                                "#197238",
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        ✅ {profileMessage}
                                    </div>
                                )}

                                {/* PROFILE ERROR MESSAGE */}

                                {profileError && (
                                    <div
                                        style={{
                                            marginBottom: "18px",
                                            padding:
                                                "11px 13px",
                                            borderRadius: "8px",
                                            background:
                                                "#fff3f3",
                                            border:
                                                "1px solid #f3caca",
                                            color:
                                                "#c62828",
                                            fontSize:
                                                "13px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        ❌ {profileError}
                                    </div>
                                )}

                                {/* =================================================
                                    EDIT PROFILE FORM
                                ================================================= */}

                                {isEditingProfile ? (

                                    <form
                                        onSubmit={
                                            handleSaveProfile
                                        }
                                    >

                                        {/* USERNAME */}

                                        <div
                                            style={{
                                                marginBottom:
                                                    "16px",
                                            }}
                                        >

                                            <label
                                                style={{
                                                    display:
                                                        "block",
                                                    marginBottom:
                                                        "7px",
                                                    color:
                                                        "#263c2d",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        "700",
                                                }}
                                            >
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
                                                style={{
                                                    width: "100%",
                                                    height: "42px",
                                                    padding:
                                                        "0 12px",
                                                    boxSizing:
                                                        "border-box",
                                                    border:
                                                        "1px solid #cddbd0",
                                                    borderRadius:
                                                        "8px",
                                                    outline:
                                                        "none",
                                                    color:
                                                        "#263c2d",
                                                    background:
                                                        "#ffffff",
                                                    fontSize:
                                                        "13px",
                                                }}
                                            />

                                        </div>

                                        {/* EMAIL */}

                                        <div
                                            style={{
                                                marginBottom:
                                                    "16px",
                                            }}
                                        >

                                            <label
                                                style={{
                                                    display:
                                                        "block",
                                                    marginBottom:
                                                        "7px",
                                                    color:
                                                        "#263c2d",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        "700",
                                                }}
                                            >
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
                                                style={{
                                                    width: "100%",
                                                    height: "42px",
                                                    padding:
                                                        "0 12px",
                                                    boxSizing:
                                                        "border-box",
                                                    border:
                                                        "1px solid #cddbd0",
                                                    borderRadius:
                                                        "8px",
                                                    outline:
                                                        "none",
                                                    color:
                                                        "#263c2d",
                                                    background:
                                                        "#ffffff",
                                                    fontSize:
                                                        "13px",
                                                }}
                                            />

                                        </div>

                                        {/* PHONE */}

                                        <div
                                            style={{
                                                marginBottom:
                                                    "20px",
                                            }}
                                        >

                                            <label
                                                style={{
                                                    display:
                                                        "block",
                                                    marginBottom:
                                                        "7px",
                                                    color:
                                                        "#263c2d",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        "700",
                                                }}
                                            >
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
                                                style={{
                                                    width: "100%",
                                                    height: "42px",
                                                    padding:
                                                        "0 12px",
                                                    boxSizing:
                                                        "border-box",
                                                    border:
                                                        "1px solid #cddbd0",
                                                    borderRadius:
                                                        "8px",
                                                    outline:
                                                        "none",
                                                    color:
                                                        "#263c2d",
                                                    background:
                                                        "#ffffff",
                                                    fontSize:
                                                        "13px",
                                                }}
                                            />

                                        </div>

                                        {/* PROFILE BUTTONS */}

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap: "10px",
                                            }}
                                        >

                                            <button
                                                type="submit"
                                                disabled={
                                                    profileSaving
                                                }
                                                style={{
                                                    flex: 1,
                                                    minHeight:
                                                        "42px",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "9px",
                                                    background:
                                                        profileSaving
                                                            ? "#9bb9a2"
                                                            : "#21883f",
                                                    color:
                                                        "#ffffff",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        "700",
                                                    cursor:
                                                        profileSaving
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                {profileSaving
                                                    ? "Saving..."
                                                    : "💾 Save Changes"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    handleCancelEdit
                                                }
                                                disabled={
                                                    profileSaving
                                                }
                                                style={{
                                                    flex: 1,
                                                    minHeight:
                                                        "42px",
                                                    border:
                                                        "1px solid #cddbd0",
                                                    borderRadius:
                                                        "9px",
                                                    background:
                                                        "#ffffff",
                                                    color:
                                                        "#526058",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        "700",
                                                    cursor:
                                                        profileSaving
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </form>

                                ) : (

                                    /* =================================================
                                       PROFILE VIEW
                                    ================================================= */

                                    <>

                                        <div
                                            style={{
                                                display:
                                                    "grid",
                                                gap: "12px",
                                            }}
                                        >

                                            {/* EMAIL */}

                                            <div>

                                                <strong>
                                                    Email
                                                </strong>

                                                <p
                                                    style={{
                                                        margin:
                                                            "4px 0 0",
                                                        color:
                                                            "#526058",
                                                    }}
                                                >
                                                    {customerProfile?.email ||
                                                        "Not available"}
                                                </p>

                                            </div>

                                            {/* PHONE */}

                                            <div>

                                                <strong>
                                                    Phone
                                                </strong>

                                                <p
                                                    style={{
                                                        margin:
                                                            "4px 0 0",
                                                        color:
                                                            "#526058",
                                                    }}
                                                >
                                                    {customerProfile?.phone ||
                                                        "Not available"}
                                                </p>

                                            </div>

                                            {/* ROLE */}

                                            <div>

                                                <strong>
                                                    Role
                                                </strong>

                                                <p
                                                    style={{
                                                        margin:
                                                            "4px 0 0",
                                                        color:
                                                            "#526058",
                                                    }}
                                                >
                                                    {customerProfile?.role ||
                                                        "CUSTOMER"}
                                                </p>

                                            </div>

                                            {/* ACCOUNT ID */}

                                            <div>

                                                <strong>
                                                    Account ID
                                                </strong>

                                                <p
                                                    style={{
                                                        margin:
                                                            "4px 0 0",
                                                        color:
                                                            "#526058",
                                                    }}
                                                >
                                                    #
                                                    {customerProfile?.id ||
                                                        "—"}
                                                </p>

                                            </div>

                                        </div>

                                        {/* EDIT PROFILE BUTTON */}

                                        <button
                                            type="button"
                                            onClick={
                                                handleEditProfile
                                            }
                                            style={{
                                                width: "100%",
                                                marginTop:
                                                    "20px",
                                                minHeight:
                                                    "42px",
                                                border: "none",
                                                borderRadius:
                                                    "9px",
                                                background:
                                                    "#21883f",
                                                color:
                                                    "#ffffff",
                                                fontSize:
                                                    "13px",
                                                fontWeight:
                                                    "700",
                                                cursor:
                                                    "pointer",
                                            }}
                                        >
                                            ✏️ Edit Profile
                                        </button>

                                        {/* CHANGE PASSWORD BUTTON */}

                                        <button
                                            type="button"
                                            onClick={
                                                handleOpenChangePassword
                                            }
                                            style={{
                                                width: "100%",
                                                marginTop:
                                                    "10px",
                                                minHeight:
                                                    "42px",
                                                border:
                                                    "1px solid #21883f",
                                                borderRadius:
                                                    "9px",
                                                background:
                                                    "#ffffff",
                                                color:
                                                    "#21883f",
                                                fontSize:
                                                    "13px",
                                                fontWeight:
                                                    "700",
                                                cursor:
                                                    "pointer",
                                            }}
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

            <aside className="customer-sidebar">

                <div className="sidebar-title">
                    CUSTOMER MENU
                </div>

                <nav>

                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={
                                activePage === item.id
                                    ? "sidebar-item active"
                                    : "sidebar-item"
                            }
                            onClick={() => {
                                setActivePage(item.id);

                                if (
                                    item.id ===
                                    "notifications"
                                ) {
                                    fetchUnreadNotifications();
                                }
                            }}
                        >

                            <span className="sidebar-icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.label}
                            </span>

                        </button>
                    ))}

                </nav>

                {/* LOGOUT */}

                <div className="sidebar-bottom">

                    <button
                        type="button"
                        className="sidebar-item logout"
                        onClick={onLogout}
                    >

                        <span className="sidebar-icon">
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

            <main className="customer-main">

                <div className="dashboard-status">

                    <span className="status-dot"></span>

                    Customer Dashboard

                </div>

                {renderMainContent()}

            </main>

        </div>
    );
}

export default CustomerDashboard;