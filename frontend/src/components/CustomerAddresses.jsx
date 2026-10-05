import { useEffect, useState } from "react";
import api from "../api/api";
import "./CustomerAddresses.css";

const EMPTY_FORM = {
    address_type: "HOME",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
};

function CustomerAddresses() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // =========================================================
    // FETCH ADDRESSES
    // =========================================================

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/api/auth/addresses/"
            );

            setAddresses(
                response.data?.addresses || []
            );
        } catch (error) {
            console.error(
                "Address fetch error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to load your addresses."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    // =========================================================
    // FORM
    // =========================================================

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    const openAddForm = () => {
        setEditingAddressId(null);
        setForm(EMPTY_FORM);

        setMessage("");
        setError("");

        setShowForm(true);
    };

    const openEditForm = (address) => {
        setEditingAddressId(address.id);

        setForm({
            address_type:
                address.address_type || "HOME",
            full_name:
                address.full_name || "",
            phone:
                address.phone || "",
            address_line1:
                address.address_line1 || "",
            address_line2:
                address.address_line2 || "",
            city:
                address.city || "",
            state:
                address.state || "",
            postal_code:
                address.postal_code || "",
            country:
                address.country || "India",
            is_default:
                Boolean(address.is_default),
        });

        setMessage("");
        setError("");

        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) {
            return;
        }

        setShowForm(false);
        setEditingAddressId(null);
        setForm(EMPTY_FORM);

        setMessage("");
        setError("");
    };

    // =========================================================
    // VALIDATION
    // =========================================================

    const validateForm = () => {
        if (!form.full_name.trim()) {
            return "Full name is required.";
        }

        if (!form.phone.trim()) {
            return "Phone number is required.";
        }

        if (!form.address_line1.trim()) {
            return "Address line 1 is required.";
        }

        if (!form.city.trim()) {
            return "City is required.";
        }

        if (!form.state.trim()) {
            return "State is required.";
        }

        if (!form.postal_code.trim()) {
            return "Postal code is required.";
        }

        if (!form.country.trim()) {
            return "Country is required.";
        }

        return "";
    };

    // =========================================================
    // ADD / UPDATE ADDRESS
    // =========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);

            const requestData = {
                address_type: form.address_type,
                full_name: form.full_name.trim(),
                phone: form.phone.trim(),
                address_line1:
                    form.address_line1.trim(),
                address_line2:
                    form.address_line2.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                postal_code:
                    form.postal_code.trim(),
                country: form.country.trim(),
                is_default: form.is_default,
            };

            if (editingAddressId) {
                await api.put(
                    `/api/auth/addresses/${editingAddressId}/`,
                    requestData
                );

                setMessage(
                    "Address updated successfully."
                );
            } else {
                await api.post(
                    "/api/auth/addresses/",
                    requestData
                );

                setMessage(
                    "Address added successfully."
                );
            }

            await fetchAddresses();

            setShowForm(false);
            setEditingAddressId(null);
            setForm(EMPTY_FORM);

        } catch (error) {
            console.error(
                "Address save error:",
                error
            );

            const errorData =
                error.response?.data;

            if (errorData) {
                const firstError = Object.values(
                    errorData
                )[0];

                if (Array.isArray(firstError)) {
                    setError(firstError[0]);
                } else if (
                    typeof firstError === "string"
                ) {
                    setError(firstError);
                } else {
                    setError(
                        "Unable to save address."
                    );
                }
            } else {
                setError(
                    "Unable to save address."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // DELETE ADDRESS
    // =========================================================

    const handleDelete = async (addressId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(addressId);

            await api.delete(
                `/api/auth/addresses/${addressId}/`
            );

            setMessage(
                "Address deleted successfully."
            );

            await fetchAddresses();

        } catch (error) {
            console.error(
                "Address delete error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                error.response?.data?.error ||
                "Unable to delete address."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =========================================================
    // SET DEFAULT ADDRESS
    // =========================================================

    const handleSetDefault = async (address) => {
        if (address.is_default) {
            return;
        }

        try {
            setError("");
            setMessage("");

            await api.put(
                `/api/auth/addresses/${address.id}/`,
                {
                    is_default: true,
                }
            );

            setMessage(
                "Default address updated successfully."
            );

            await fetchAddresses();

        } catch (error) {
            console.error(
                "Default address error:",
                error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to set default address."
            );
        }
    };

    // =========================================================
    // FORMAT ADDRESS
    // =========================================================

    const getFullAddress = (address) => {
        const parts = [
            address.address_line1,
            address.address_line2,
            address.city,
            address.state,
            address.postal_code,
            address.country,
        ].filter(Boolean);

        return parts.join(", ");
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="customer-addresses">

                <div className="addresses-header">
                    <div>
                        <h2>My Addresses</h2>
                        <p>
                            Manage your delivery addresses
                        </p>
                    </div>
                </div>

                <div className="addresses-loading">
                    Loading your addresses...
                </div>

            </div>
        );
    }

    return (
        <div className="customer-addresses">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="addresses-header">

                <div>
                    <h2>My Addresses</h2>

                    <p>
                        Manage your saved delivery
                        addresses
                    </p>
                </div>

                {!showForm && (
                    <button
                        type="button"
                        className="add-address-button"
                        onClick={openAddForm}
                    >
                        ➕ Add New Address
                    </button>
                )}

            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {message && (
                <div className="address-success">
                    ✅ {message}
                </div>
            )}

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
                <div className="address-error">
                    ❌ {error}
                </div>
            )}

            {/* =================================================
                ADD / EDIT FORM
            ================================================= */}

            {showForm && (
                <div className="address-form-card">

                    <div className="address-form-header">

                        <div>
                            <h3>
                                {editingAddressId
                                    ? "✏️ Edit Address"
                                    : "➕ Add New Address"}
                            </h3>

                            <p>
                                Enter your delivery
                                address details
                            </p>
                        </div>

                        <button
                            type="button"
                            className="address-close-button"
                            onClick={closeForm}
                            disabled={saving}
                            aria-label="Close address form"
                        >
                            ✕
                        </button>

                    </div>

                    <form
                        className="address-form"
                        onSubmit={handleSubmit}
                    >

                        {/* ADDRESS TYPE */}

                        <div className="address-form-group">

                            <label>
                                Address Type
                            </label>

                            <select
                                name="address_type"
                                value={
                                    form.address_type
                                }
                                onChange={
                                    handleInputChange
                                }
                                disabled={saving}
                            >
                                <option value="HOME">
                                    🏠 Home
                                </option>

                                <option value="OFFICE">
                                    🏢 Office
                                </option>

                                <option value="OTHER">
                                    📍 Other
                                </option>
                            </select>

                        </div>

                        <div className="address-form-grid">

                            {/* FULL NAME */}

                            <div className="address-form-group">

                                <label>
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    name="full_name"
                                    value={
                                        form.full_name
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter full name"
                                    disabled={saving}
                                />

                            </div>

                            {/* PHONE */}

                            <div className="address-form-group">

                                <label>
                                    Phone Number *
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter phone number"
                                    disabled={saving}
                                />

                            </div>

                        </div>

                        {/* ADDRESS LINE 1 */}

                        <div className="address-form-group">

                            <label>
                                Address Line 1 *
                            </label>

                            <input
                                type="text"
                                name="address_line1"
                                value={
                                    form.address_line1
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="House / Flat / Street"
                                disabled={saving}
                            />

                        </div>

                        {/* ADDRESS LINE 2 */}

                        <div className="address-form-group">

                            <label>
                                Address Line 2
                            </label>

                            <input
                                type="text"
                                name="address_line2"
                                value={
                                    form.address_line2
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Landmark / Area (optional)"
                                disabled={saving}
                            />

                        </div>

                        <div className="address-form-grid">

                            {/* CITY */}

                            <div className="address-form-group">

                                <label>
                                    City *
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter city"
                                    disabled={saving}
                                />

                            </div>

                            {/* STATE */}

                            <div className="address-form-group">

                                <label>
                                    State *
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter state"
                                    disabled={saving}
                                />

                            </div>

                        </div>

                        <div className="address-form-grid">

                            {/* POSTAL CODE */}

                            <div className="address-form-group">

                                <label>
                                    Postal Code *
                                </label>

                                <input
                                    type="text"
                                    name="postal_code"
                                    value={
                                        form.postal_code
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    placeholder="Enter postal code"
                                    disabled={saving}
                                />

                            </div>

                            {/* COUNTRY */}

                            <div className="address-form-group">

                                <label>
                                    Country *
                                </label>

                                <input
                                    type="text"
                                    name="country"
                                    value={
                                        form.country
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    disabled={saving}
                                />

                            </div>

                        </div>

                        {/* DEFAULT */}

                        <label className="default-address-option">

                            <input
                                type="checkbox"
                                name="is_default"
                                checked={
                                    form.is_default
                                }
                                onChange={
                                    handleInputChange
                                }
                                disabled={saving}
                            />

                            <span>
                                Set as default delivery
                                address
                            </span>

                        </label>

                        {/* BUTTONS */}

                        <div className="address-form-actions">

                            <button
                                type="submit"
                                className="save-address-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingAddressId
                                    ? "💾 Update Address"
                                    : "💾 Save Address"}
                            </button>

                            <button
                                type="button"
                                className="cancel-address-button"
                                onClick={closeForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* =================================================
                ADDRESS LIST
            ================================================= */}

            {!showForm && (
                <>
                    {addresses.length === 0 ? (

                        <div className="no-addresses">

                            <div className="no-address-icon">
                                📍
                            </div>

                            <h3>
                                No Saved Addresses
                            </h3>

                            <p>
                                Add a delivery address
                                to make checkout faster
                                and easier.
                            </p>

                            <button
                                type="button"
                                className="add-address-button"
                                onClick={openAddForm}
                            >
                                ➕ Add Your First Address
                            </button>

                        </div>

                    ) : (

                        <div className="address-list">

                            {addresses.map((address) => (

                                <div
                                    key={address.id}
                                    className={
                                        address.is_default
                                            ? "address-card default"
                                            : "address-card"
                                    }
                                >

                                    {/* CARD HEADER */}

                                    <div className="address-card-header">

                                        <div className="address-type">

                                            <span className="address-type-icon">
                                                {address.address_type ===
                                                "HOME"
                                                    ? "🏠"
                                                    : address.address_type ===
                                                      "OFFICE"
                                                    ? "🏢"
                                                    : "📍"}
                                            </span>

                                            <strong>
                                                {address.address_type}
                                            </strong>

                                        </div>

                                        {address.is_default && (
                                            <span className="default-badge">
                                                ⭐ Default
                                            </span>
                                        )}

                                    </div>

                                    {/* CARD BODY */}

                                    <div className="address-card-body">

                                        <h3>
                                            {address.full_name}
                                        </h3>

                                        <p className="address-phone">
                                            📞 {address.phone}
                                        </p>

                                        <p className="address-text">
                                            {getFullAddress(
                                                address
                                            )}
                                        </p>

                                    </div>

                                    {/* CARD ACTIONS */}

                                    <div className="address-card-actions">

                                        {!address.is_default && (
                                            <button
                                                type="button"
                                                className="set-default-button"
                                                onClick={() =>
                                                    handleSetDefault(
                                                        address
                                                    )
                                                }
                                            >
                                                ⭐ Set Default
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="edit-address-button"
                                            onClick={() =>
                                                openEditForm(
                                                    address
                                                )
                                            }
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-address-button"
                                            onClick={() =>
                                                handleDelete(
                                                    address.id
                                                )
                                            }
                                            disabled={
                                                deletingId ===
                                                address.id
                                            }
                                        >
                                            {deletingId ===
                                            address.id
                                                ? "Deleting..."
                                                : "🗑️ Delete"}
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}
                </>
            )}

        </div>
    );
}

export default CustomerAddresses;