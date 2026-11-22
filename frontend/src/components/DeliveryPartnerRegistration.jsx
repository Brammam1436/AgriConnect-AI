import { useState } from "react";
import "./DeliveryPartnerRegistration.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function DeliveryPartnerRegistration({ onBackToLogin }) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",

        full_name: "",

        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        state: "",
        postal_code: "",

        vehicle_type: "BIKE",
        vehicle_number: "",
        driving_license_number: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setMessage("");
    };

    const formatErrors = (data) => {
        const messages = [];

        Object.keys(data || {}).forEach((field) => {
            const fieldErrors = data[field];

            if (Array.isArray(fieldErrors)) {
                messages.push(
                    `${field.replaceAll("_", " ")}: ${fieldErrors.join(", ")}`
                );
            } else if (typeof fieldErrors === "string") {
                messages.push(
                    `${field.replaceAll("_", " ")}: ${fieldErrors}`
                );
            } else if (fieldErrors && typeof fieldErrors === "object") {
                messages.push(
                    `${field.replaceAll("_", " ")}: ${JSON.stringify(
                        fieldErrors
                    )}`
                );
            }
        });

        return messages.join(" | ");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        // Frontend validation
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (!/^\d{10,15}$/.test(formData.phone)) {
            setError("Phone number must contain 10 to 15 digits.");
            setLoading(false);
            return;
        }

        if (!/^\d{6,10}$/.test(formData.postal_code)) {
            setError("Please enter a valid postal code.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/delivery-partner/register/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Delivery partner registration error:",
                    data
                );

                const formattedErrors = formatErrors(data);

                setError(
                    formattedErrors ||
                        "Registration failed. Please check your details."
                );

                setLoading(false);
                return;
            }

            setMessage(
                data.message ||
                    "Registration submitted successfully. Your application is pending admin approval."
            );

            // Clear form after successful registration
            setFormData({
                username: "",
                email: "",
                phone: "",
                password: "",
                confirm_password: "",

                full_name: "",

                address_line1: "",
                address_line2: "",
                city: "",
                district: "",
                state: "",
                postal_code: "",

                vehicle_type: "BIKE",
                vehicle_number: "",
                driving_license_number: "",
            });

            setLoading(false);
        } catch (requestError) {
            console.error(
                "Delivery partner registration request failed:",
                requestError
            );

            setError(
                "Unable to connect to Django backend. Please make sure the backend server is running."
            );

            setLoading(false);
        }
    };

    return (
        <div className="delivery-register-container">
            <div className="delivery-register-card">

                {/* HEADER */}

                <div className="delivery-register-header">

                    <div className="delivery-register-icon">
                        🚚
                    </div>

                    <h1>
                        Join as Delivery Partner
                    </h1>

                    <p>
                        Deliver fresh products from farmers to customers
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* ACCOUNT DETAILS */}

                    <div className="delivery-section">

                        <h3>
                            Account Details
                        </h3>

                        <div className="delivery-form-grid">

                            <div className="delivery-form-group">
                                <label>
                                    Username
                                </label>

                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>

                            <div className="delivery-form-group">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                />
                            </div>

                            <div className="delivery-form-group">
                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-15 digit phone number"
                                    maxLength={15}
                                    required
                                />
                            </div>

                        </div>

                    </div>

                    {/* PERSONAL DETAILS */}

                    <div className="delivery-section">

                        <h3>
                            Personal Details
                        </h3>

                        <div className="delivery-form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />

                        </div>

                    </div>

                    {/* ADDRESS */}

                    <div className="delivery-section">

                        <h3>
                            Address Details
                        </h3>

                        <div className="delivery-form-grid">

                            <div className="delivery-form-group delivery-full-width">

                                <label>
                                    Address Line 1
                                </label>

                                <input
                                    type="text"
                                    name="address_line1"
                                    value={formData.address_line1}
                                    onChange={handleChange}
                                    placeholder="House / Street / Area"
                                    required
                                />

                            </div>

                            <div className="delivery-form-group delivery-full-width">

                                <label>
                                    Address Line 2
                                    <span className="optional-text">
                                        {" "}Optional
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    name="address_line2"
                                    value={formData.address_line2}
                                    onChange={handleChange}
                                    placeholder="Landmark / Apartment / Area"
                                />

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    City
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Enter city"
                                    required
                                />

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    District
                                </label>

                                <input
                                    type="text"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="Enter district"
                                    required
                                />

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    State
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="Enter state"
                                    required
                                />

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    Postal Code
                                </label>

                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    placeholder="Enter postal code"
                                    maxLength={10}
                                    required
                                />

                            </div>

                        </div>

                    </div>

                    {/* VEHICLE DETAILS */}

                    <div className="delivery-section">

                        <h3>
                            Vehicle & License Details
                        </h3>

                        <div className="delivery-form-grid">

                            <div className="delivery-form-group">

                                <label>
                                    Vehicle Type
                                </label>

                                <select
                                    name="vehicle_type"
                                    value={formData.vehicle_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="BIKE">
                                        Bike
                                    </option>

                                    <option value="SCOOTER">
                                        Scooter
                                    </option>

                                    <option value="AUTO">
                                        Auto
                                    </option>

                                    <option value="CAR">
                                        Car
                                    </option>

                                    <option value="VAN">
                                        Van
                                    </option>

                                    <option value="TRUCK">
                                        Truck
                                    </option>
                                </select>

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    Vehicle Number
                                </label>

                                <input
                                    type="text"
                                    name="vehicle_number"
                                    value={formData.vehicle_number}
                                    onChange={handleChange}
                                    placeholder="Example: TS09AB1234"
                                    required
                                />

                            </div>

                            <div className="delivery-form-group delivery-full-width">

                                <label>
                                    Driving License Number
                                </label>

                                <input
                                    type="text"
                                    name="driving_license_number"
                                    value={formData.driving_license_number}
                                    onChange={handleChange}
                                    placeholder="Enter driving license number"
                                    required
                                />

                            </div>

                        </div>

                    </div>

                    {/* PASSWORD */}

                    <div className="delivery-section">

                        <h3>
                            Security
                        </h3>

                        <div className="delivery-form-grid">

                            <div className="delivery-form-group">

                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    required
                                />

                            </div>

                            <div className="delivery-form-group">

                                <label>
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    minLength={8}
                                    required
                                />

                            </div>

                        </div>

                    </div>

                    {/* INFORMATION */}

                    <div className="delivery-approval-info">

                        <span>
                            ℹ️
                        </span>

                        <p>
                            Your application will be reviewed by an admin.
                            You can login and start delivering only after
                            your application is approved.
                        </p>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="delivery-error">
                            ❌ {error}
                        </div>
                    )}

                    {/* SUCCESS */}

                    {message && (
                        <div className="delivery-success">
                            ✅ {message}
                        </div>
                    )}

                    {/* BUTTON */}

                    <button
                        type="submit"
                        className="delivery-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Submitting Application..."
                            : "Submit Delivery Partner Application"}
                    </button>

                </form>

                {/* BACK TO LOGIN */}

                <div className="delivery-back-login">

                    <span>
                        Already have an account?
                    </span>

                    <button
                        type="button"
                        onClick={onBackToLogin}
                    >
                        Back to Login
                    </button>

                </div>

            </div>
        </div>
    );
}

export default DeliveryPartnerRegistration;