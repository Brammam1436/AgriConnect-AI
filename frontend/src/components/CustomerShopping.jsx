import { useEffect, useState } from "react";

function CustomerShopping() {

    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const fetchProducts = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                "http://127.0.0.1:8000/api/products/",
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
                    "Failed to load products."
                );
            }

            setProducts(
                Array.isArray(data)
                    ? data
                    : data.results || []
            );

        }
        catch (error) {

            setError(
                error.message ||
                "Something went wrong while loading products."
            );

        }
        finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchProducts();

    }, []);


    const handleQuantityChange = (
        productId,
        value
    ) => {

        setQuantities((previous) => ({
            ...previous,
            [productId]: value,
        }));

    };


    const handleAddToCart = async (product) => {

        setMessage("");
        setError("");

        const quantity =
            quantities[product.id] || 1;

        if (Number(quantity) <= 0) {

            setError(
                "Quantity must be greater than 0."
            );

            return;
        }

        if (
            Number(quantity) >
            Number(product.available_quantity)
        ) {

            setError(
                "Requested quantity is greater than available stock."
            );

            return;
        }


        try {

            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                "http://127.0.0.1:8000/api/cart/items/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        product: product.id,
                        quantity: quantity,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to add product to cart."
                );

            }

            setMessage(
                `${product.name} added to cart successfully.`
            );

        }
        catch (error) {

            setError(
                error.message ||
                "Something went wrong while adding the product to cart."
            );

        }

    };


    if (loading) {

        return (
            <div className="customer-shopping">

                <h2>
                    🛍️ Shop Products
                </h2>

                <p>
                    Loading products...
                </p>

            </div>
        );

    }


    return (
        <div className="customer-shopping">

            <h2>
                🛍️ Shop Products
            </h2>

            <p className="shopping-description">
                Buy fresh products directly
                from verified farmers.
            </p>


            {message && (
                <div className="shopping-success">
                    ✅ {message}
                </div>
            )}


            {error && (
                <div className="shopping-error">
                    ❌ {error}
                </div>
            )}


            {products.length === 0 ? (

                <p>
                    No products are currently available.
                </p>

            ) : (

                <div className="customer-product-grid">

                    {products.map((product) => (

                        <div
                            className="customer-product-card"
                            key={product.id}
                        >

                            {product.image && (
                                <img
                                    src={
                                        product.image.startsWith("http")
                                            ? product.image
                                            : `http://127.0.0.1:8000${product.image}`
                                    }
                                    alt={product.name}
                                    className="customer-product-image"
                                />
                            )}


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
                                ₹{product.price_per_kg}/kg
                            </p>


                            <p>
                                <strong>
                                    Available:
                                </strong>{" "}
                                {product.available_quantity}{" "}
                                {product.unit || "kg"}
                            </p>


                            <div className="shopping-quantity">

                                <label>
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    max={
                                        product.available_quantity
                                    }
                                    value={
                                        quantities[product.id] || 1
                                    }
                                    onChange={(event) =>
                                        handleQuantityChange(
                                            product.id,
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            <button
                                type="button"
                                className="add-to-cart-button"
                                onClick={() =>
                                    handleAddToCart(product)
                                }
                                disabled={
                                    !product.is_available
                                }
                            >

                                {product.is_available
                                    ? "🛒 Add to Cart"
                                    : "Unavailable"}

                            </button>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default CustomerShopping;