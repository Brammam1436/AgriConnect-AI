import { useEffect, useState } from "react";
import api from "../api/api";

function FarmerDashboard() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    // Fetch farmer products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/products/");

            console.log("Product API response:", response.data);

            setProducts(response.data.results || []);
        } catch (err) {
            console.error("Product API error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (event) => {
        const { name, value, type, checked, files } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "file"
                    ? files[0]
                    : value,
        }));
    };

    // Add new product
    const handleAddProduct = async (event) => {
        event.preventDefault();

        try {
            setFormLoading(true);
            setFormError("");

            const data = new FormData();

            data.append("name", formData.name);
            data.append("category", formData.category);
            data.append("description", formData.description);
            data.append("price_per_kg", formData.price_per_kg);
            data.append(
                "available_quantity",
                formData.available_quantity
            );
            data.append("unit", formData.unit);
            data.append(
                "is_available",
                formData.is_available
            );

            if (formData.image) {
                data.append("image", formData.image);
            }

            const response = await api.post(
                "/api/products/",
                data
            );

            console.log(
                "Product created:",
                response.data
            );

            alert("Product added successfully!");

            // Clear form
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

            // Close form
            setShowForm(false);

            // Refresh products
            await fetchProducts();

        } catch (err) {
            console.error(
                "Add product error:",
                err
            );

            setFormError(
                err.response?.data
                    ? JSON.stringify(err.response.data)
                    : "Unable to add product."
            );
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditProduct = async (event) => {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        try {
            setFormLoading(true);
            setFormError("");

            const data = new FormData();

            data.append("name", formData.name);
            data.append("category", formData.category);
            data.append("description", formData.description);
            data.append("price_per_kg", formData.price_per_kg);
            data.append(
                "available_quantity",
                formData.available_quantity
            );

            data.append("unit", formData.unit);

            const quantity = Number(formData.available_quantity);

            data.append(
                "is_available",
                quantity > 0 && formData.is_available
            );

            if (formData.image) {
                data.append("image", formData.image);
            }

            const response = await api.put(
                `/api/products/${editingProduct.id}/`,
                data
            );

            console.log(
                "Product updated:",
                response.data
            );

            alert("Product updated successfully!");

            setEditingProduct(null);
            setShowForm(false);

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

            await fetchProducts();

        } catch (err) {
            console.error(
                "Update product error:",
                err
            );

            setFormError(
                err.response?.data
                    ? JSON.stringify(err.response.data)
                    : "Unable to update product."
            );
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteProduct = async (productId, productName) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${productName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/api/products/${productId}/`);

            alert("Product deleted successfully!");

            // If the deleted product was being edited
            if (editingProduct?.id === productId) {
                setEditingProduct(null);
                setShowForm(false);
            }

            // Refresh product list
            await fetchProducts();
        } catch (err) {
            console.error("Delete product error:", err);

            alert(
                err.response?.data?.detail ||
                "Unable to delete product."
            );
        }
    };

    const handleToggleAvailability = async (product) => {
        try {
            setError("");

            const data = new FormData();

            const newAvailability = !product.is_available;

            data.append("is_available", newAvailability);

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
            console.error("Availability update error:", err);

            setError(
                err.response?.data?.detail ||
                "Unable to update product availability."
            );
        }
    };


    const startEditingProduct = (product) => {
        setEditingProduct(product);

        setFormData({
            name: product.name || "",
            category: product.category || "",
            description: product.description || "",
            price_per_kg: product.price_per_kg || "",
            available_quantity:
                product.available_quantity || "",
            unit: product.unit || "kg",
            is_available:
                product.is_available ?? true,
            image: null,
        });

        setFormError("");
        setShowForm(true);
    };

    // Load products when component starts
    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="farmer-dashboard">

            <h1>🌾 Farmer Dashboard</h1>

            <p>
                Welcome to your Farmer Dashboard!
            </p>

            <div className="farmer-dashboard-info">

                <h2>My Products</h2>

                {/* Add Product Button */}
                <button
                    type="button"
                    className="add-product-button"
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            setEditingProduct(null);
                            setFormError("");
                        } else {
                            setShowForm(true);
                            setEditingProduct(null);
                            setFormError("");
                        }
                    }}
                >
                    {showForm
                        ? "Close Form"
                        : "+ Add New Product"}
                </button>

                {/* Add Product Form */}
                {showForm && (
                   <form
                        className="add-product-form"
                        onSubmit={
                            editingProduct
                                ? handleEditProduct
                                : handleAddProduct
                        }
                    >

                        <h3>
                            {editingProduct
                                ? "Edit Product"
                                : "Add New Product"}
                        </h3>

                        {formError && (
                            <p className="form-error">
                                {formError}
                            </p>
                        )}

                        {/* Product Name */}
                        <label>
                            Product Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter product name"
                            required
                        />

                        {/* Category */}
                        <label>
                            Category
                        </label>

                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            placeholder="Example: VEGETABLE"
                            required
                        />

                        {/* Description */}
                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter product description"
                            rows="4"
                        />

                        {/* Price */}
                        <label>
                            Price per kg
                        </label>

                        <input
                            type="number"
                            name="price_per_kg"
                            value={formData.price_per_kg}
                            onChange={handleInputChange}
                            placeholder="Example: 55"
                            min="0"
                            step="0.01"
                            required
                        />

                        {/* Quantity */}
                        <label>
                            Available Quantity
                        </label>

                        <input
                            type="number"
                            name="available_quantity"
                            value={formData.available_quantity}
                            onChange={handleInputChange}
                            placeholder="Example: 100"
                            min="0"
                            step="0.01"
                            required
                        />

                        {/* Unit */}
                        <label>
                            Unit
                        </label>

                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
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

                        {/* Image */}
                        <label>
                            Product Image
                        </label>

                        <input
                            type="file"
                            name="image"
                            accept="image/*"
                            onChange={handleInputChange}
                        />

                        {/* Availability */}
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

                            Product is available

                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="save-product-button"
                            disabled={formLoading}
                        >
                            {formLoading
                                ? "Saving..."
                                : editingProduct
                                ? "Update Product"
                                : "Add Product"}
                        </button>

                    </form>
                )}

                {/* Loading */}
                {loading && (
                    <p>
                        Loading products...
                    </p>
                )}

                {/* Error */}
                {error && (
                    <p className="error-message">
                        {error}
                    </p>
                )}

                {/* No Products */}
                {!loading &&
                    !error &&
                    products.length === 0 && (
                        <p>
                            No products found.
                        </p>
                    )}

                {/* Product List */}
                {!loading &&
                    !error &&
                    products.length > 0 && (

                        <div className="farmer-products-grid">

                            {products.map((product) => (

                                <div
                                    key={product.id}
                                    className="farmer-product-card"
                                >

                                    <h3>
                                        {product.name}
                                    </h3>

                                    <p>
                                        <strong>
                                            Category:
                                        </strong>{" "}
                                        {product.category}
                                    </p>

                                    <p>
                                        <strong>
                                            Price:
                                        </strong>{" "}
                                        ₹
                                        {Number(
                                            product.price_per_kg
                                        ).toFixed(2)}
                                        /{product.unit}
                                    </p>

                                    <p>
                                        Available Quantity: {product.available_quantity} {product.unit}
                                    </p>

                                    <p
                                        className={
                                            product.is_available
                                                ? "available-status"
                                                : "unavailable-status"
                                        }
                                    >
                                        Availability:{" "}
                                        {product.is_available ? "Available" : "Not Available"}
                                    </p>

                                    {Number(product.available_quantity) <= 10 && (
                                        <p className="low-stock-warning">
                                            ⚠️ Low stock
                                        </p>
                                    )}

                                    {Number(product.available_quantity) <= 0 && (
                                        <p className="out-of-stock-warning">
                                            ❌ Out of stock
                                        </p>
                                    )}

                                    <div className="product-actions">
                                        <button
                                            type="button"
                                            className="edit-product-button"
                                            onClick={() => startEditingProduct(product)}
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-product-button"
                                            onClick={() =>
                                                handleDeleteProduct(product.id, product.name)
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
                                                handleToggleAvailability(product)
                                            }
                                        >
                                            {product.is_available
                                                ? "Mark Unavailable"
                                                : "Mark Available"}
                                        </button>
                                    </div>

                                </div>

                            ))}

                        </div>
                    )}

            </div>

        </div>
    );
}

export default FarmerDashboard;