import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";
import "./CustomerShopping.css";

function CustomerShopping() {
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =========================
    // SEARCH & FILTER STATES
    // =========================
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] =
        useState("");

    // =========================
    // REVIEW STATES
    // =========================
    const [selectedProduct, setSelectedProduct] =
        useState(null);

    const [reviews, setReviews] = useState([]);

    const [reviewsLoading, setReviewsLoading] =
        useState(false);

    const API_BASE_URL =
        api.defaults.baseURL ||
        "http://127.0.0.1:8000";

    // =========================
    // API ERROR MESSAGE
    // =========================
    const getApiErrorMessage = (
        error,
        fallbackMessage
    ) => {
        return (
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            error?.message ||
            fallbackMessage
        );
    };

    // =========================
    // FETCH ALL PRODUCTS
    // =========================
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            let url = "/api/products/";
            let allProducts = [];

            while (url) {
                const response = await api.get(url);

                const data = response.data;

                if (Array.isArray(data)) {
                    allProducts = [
                        ...allProducts,
                        ...data,
                    ];

                    url = null;
                } else {
                    allProducts = [
                        ...allProducts,
                        ...(data.results || []),
                    ];

                    url = data.next || null;
                }
            }

            setProducts(allProducts);

            console.log(
                "All products loaded:",
                allProducts
            );
        } catch (error) {
            console.error(
                "Fetch products error:",
                error
            );

            setError(
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LOAD PRODUCTS
    // =========================
    useEffect(() => {
        fetchProducts();
    }, []);

    // =========================
    // CLOSE REVIEW WITH ESCAPE
    // =========================
    useEffect(() => {
        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
                selectedProduct
            ) {
                handleCloseReviews();
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
    }, [selectedProduct]);

    // =========================
    // CATEGORY LIST
    // =========================
    const categories = useMemo(() => {
        const categoryList = products
            .map((product) => product.category)
            .filter(
                (category) =>
                    category &&
                    String(category).trim() !== ""
            )
            .map((category) =>
                String(category).trim()
            );

        return [...new Set(categoryList)].sort(
            (a, b) =>
                a.localeCompare(b)
        );
    }, [products]);

    // =========================
    // SEARCH + CATEGORY FILTER
    // =========================
    const filteredProducts = useMemo(() => {
        const search = searchTerm
            .trim()
            .toLowerCase();

        return products.filter((product) => {
            const productName =
                String(product.name || "")
                    .toLowerCase();

            const description =
                String(product.description || "")
                    .toLowerCase();

            const category =
                String(product.category || "")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                productName.includes(search) ||
                description.includes(search);

            const matchesCategory =
                !selectedCategory ||
                category ===
                    selectedCategory.toLowerCase();

            return (
                matchesSearch &&
                matchesCategory
            );
        });
    }, [
        products,
        searchTerm,
        selectedCategory,
    ]);

    // =========================
    // CLEAR FILTERS
    // =========================
    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("");
    };

    // =========================
    // QUANTITY CHANGE
    // =========================
    const handleQuantityChange = (
        productId,
        value
    ) => {
        setQuantities((previous) => ({
            ...previous,
            [productId]: value,
        }));
    };

    // =========================
    // ADD TO CART
    // =========================
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
            await api.post(
                "/api/cart/items/",
                {
                    product: product.id,
                    quantity: quantity,
                }
            );

            setMessage(
                `${product.name} added to cart successfully.`
            );

            setQuantities((previous) => ({
                ...previous,
                [product.id]: 1,
            }));
        } catch (error) {
            setError(
                getApiErrorMessage(
                    error,
                    "Something went wrong while adding the product to cart."
                )
            );
        }
    };

    // =========================
    // VIEW REVIEWS
    // =========================
    const handleViewReviews = async (
        product
    ) => {
        setMessage("");
        setError("");

        setSelectedProduct(product);
        setReviews([]);
        setReviewsLoading(true);

        try {
            const response = await api.get(
                `/api/products/${product.id}/reviews/`
            );

            setReviews(
                response.data?.reviews || []
            );
        } catch (error) {
            setError(
                getApiErrorMessage(
                    error,
                    "Something went wrong while loading reviews."
                )
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    // =========================
    // CLOSE REVIEWS
    // =========================
    const handleCloseReviews = () => {
        setSelectedProduct(null);
        setReviews([]);
        setReviewsLoading(false);
    };

    // =========================
    // CLOSE WHEN CLICKING
    // OUTSIDE MODAL
    // =========================
    const handleReviewOverlayClick = (
        event
    ) => {
        if (
            event.target ===
            event.currentTarget
        ) {
            handleCloseReviews();
        }
    };

    // =========================
    // LOADING
    // =========================
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

    // =========================
    // MAIN PAGE
    // =========================
    return (
        <div className="customer-shopping">

            {/* =========================
                PAGE HEADING
            ========================= */}
            <h2>
                🛍️ Shop Products
            </h2>

            <p className="shopping-description">
                Buy fresh products directly
                from verified farmers.
            </p>

            {/* =========================
                SUCCESS MESSAGE
            ========================= */}
            {message && (
                <div className="shopping-success">
                    ✅ {message}
                </div>
            )}

            {/* =========================
                ERROR MESSAGE
            ========================= */}
            {error && (
                <div className="shopping-error">
                    ❌ {error}
                </div>
            )}

            {/* =========================
                SEARCH & CATEGORY FILTER
            ========================= */}
            {products.length > 0 && (
                <div className="shopping-filter-section">

                    {/* SEARCH */}
                    <div className="shopping-search-box">

                        <span className="search-icon">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    {/* CATEGORY */}
                    <div className="shopping-category-box">

                        <label>
                            Category
                        </label>

                        <select
                            value={
                                selectedCategory
                            }
                            onChange={(event) =>
                                setSelectedCategory(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                All Categories
                            </option>

                            {categories.map(
                                (category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* CLEAR */}
                    {(searchTerm ||
                        selectedCategory) && (
                        <button
                            type="button"
                            className="clear-filter-button"
                            onClick={
                                handleClearFilters
                            }
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
            )}

            {/* =========================
                RESULT INFORMATION
            ========================= */}
            {products.length > 0 && (
                <div className="shopping-result-info">

                    <span>
                        Showing{" "}
                        <strong>
                            {
                                filteredProducts.length
                            }
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {products.length}
                        </strong>{" "}
                        products
                    </span>

                    {selectedCategory && (
                        <span>
                            Category:{" "}
                            <strong>
                                {
                                    selectedCategory
                                }
                            </strong>
                        </span>
                    )}
                </div>
            )}

            {/* =========================
                PRODUCTS
            ========================= */}
            {products.length === 0 ? (
                <p>
                    No products are currently
                    available.
                </p>
            ) : filteredProducts.length ===
              0 ? (
                <div className="no-products-found">

                    <div className="no-products-icon">
                        🔍
                    </div>

                    <h3>
                        No Products Found
                    </h3>

                    <p>
                        We couldn't find any
                        products matching your
                        search or category.
                    </p>

                    <button
                        type="button"
                        className="clear-filter-button"
                        onClick={
                            handleClearFilters
                        }
                    >
                        View All Products
                    </button>
                </div>
            ) : (
                <div className="customer-product-grid">

                    {filteredProducts.map(
                        (product) => {

                            const imageUrl =
                                product.image
                                    ? product.image.startsWith(
                                          "http"
                                      )
                                        ? product.image
                                        : `${API_BASE_URL}${product.image}`
                                    : null;

                            const availableQuantity =
                                Number(
                                    product.available_quantity ||
                                        0
                                );

                            const isAvailable =
                                product.is_available &&
                                availableQuantity >
                                    0;

                            const averageRating =
                                Number(
                                    product.average_rating ||
                                        0
                                );

                            const reviewCount =
                                Number(
                                    product.review_count ||
                                        0
                                );

                            return (
                                <div
                                    className="customer-product-card"
                                    key={
                                        product.id
                                    }
                                >

                                    {/* =========================
                                        PRODUCT IMAGE
                                    ========================= */}
                                    {imageUrl ? (
                                        <img
                                            src={
                                                imageUrl
                                            }
                                            alt={
                                                product.name
                                            }
                                            className="customer-product-image"
                                        />
                                    ) : (
                                        <div className="customer-product-image">
                                            🥬
                                        </div>
                                    )}

                                    {/* =========================
                                        PRODUCT NAME
                                    ========================= */}
                                    <h3>
                                        {
                                            product.name
                                        }
                                    </h3>

                                    {/* =========================
                                        CATEGORY
                                    ========================= */}
                                    <p>
                                        <strong>
                                            Category:
                                        </strong>{" "}
                                        {
                                            product.category
                                        }
                                    </p>

                                    {/* =========================
                                        PRICE
                                    ========================= */}
                                    <p>
                                        <strong>
                                            Price:
                                        </strong>{" "}
                                        ₹
                                        {
                                            product.price_per_kg
                                        }
                                        /kg
                                    </p>

                                    {/* =========================
                                        AVAILABLE QUANTITY
                                    ========================= */}
                                    <p>
                                        <strong>
                                            Available:
                                        </strong>{" "}
                                        {
                                            product.available_quantity
                                        }{" "}
                                        {
                                            product.unit ||
                                            "kg"
                                        }
                                    </p>

                                    {/* =========================
                                        RATING
                                    ========================= */}
                                    <div className="product-rating">

                                        <div className="rating-stars">
                                            {Array.from({ length: 5 }).map(
                                                (_, index) => (
                                                    <span
                                                        key={index}
                                                        className={
                                                            index <
                                                            Math.round(averageRating)
                                                                ? "star-filled"
                                                                : "star-empty"
                                                        }
                                                    >
                                                        ★
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        <strong className="rating-number">
                                            {averageRating.toFixed(
                                                1
                                            )}
                                        </strong>

                                        <span className="rating-count">
                                            (
                                            {
                                                reviewCount
                                            }{" "}
                                            {reviewCount ===
                                            1
                                                ? "review"
                                                : "reviews"}
                                            )
                                        </span>

                                    </div>

                                    {/* =========================
                                        VIEW REVIEWS
                                    ========================= */}
                                    <button
                                        type="button"
                                        className="view-reviews-button"
                                        onClick={() =>
                                            handleViewReviews(
                                                product
                                            )
                                        }
                                    >
                                        ⭐ View Reviews
                                    </button>

                                    {/* =========================
                                        QUANTITY
                                    ========================= */}
                                    <div className="quantity-section">
                                        <span className="quantity-label">
                                            Quantity
                                        </span>

                                        <div className="quantity-selector">
                                            <button
                                                type="button"
                                                className="quantity-btn"
                                                onClick={() => {
                                                    const current =
                                                        Number(quantities[product.id] || 1);

                                                    if (current > 1) {
                                                        handleQuantityChange(
                                                            product.id,
                                                            current - 1
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    Number(quantities[product.id] || 1) <= 1
                                                }
                                            >
                                                −
                                            </button>

                                            <span className="quantity-value">
                                                {quantities[product.id] || 1}
                                            </span>

                                            <button
                                                type="button"
                                                className="quantity-btn"
                                                onClick={() => {
                                                    const current =
                                                        Number(quantities[product.id] || 1);

                                                    const available =
                                                        Number(product.available_quantity);

                                                    if (current < available) {
                                                        handleQuantityChange(
                                                            product.id,
                                                            current + 1
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    Number(quantities[product.id] || 1) >=
                                                    Number(product.available_quantity)
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                    </div>

                                    {/* =========================
                                        ADD TO CART
                                    ========================= */}
                                    <button
                                        type="button"
                                        className="add-to-cart-button"
                                        onClick={() =>
                                            handleAddToCart(
                                                product
                                            )
                                        }
                                        disabled={
                                            !isAvailable
                                        }
                                    >
                                        {isAvailable
                                            ? "🛒 Add to Cart"
                                            : "Unavailable"}
                                    </button>

                                </div>
                            );
                        }
                    )}

                </div>
            )}

            {/* =================================================
                REVIEW MODAL
            ================================================= */}
            {selectedProduct && (
                <div
                    className="customer-review-overlay"
                    onClick={
                        handleReviewOverlayClick
                    }
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="review-modal-title"
                >

                    <div
                        className="customer-review-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* =========================
                            MODAL HEADER
                        ========================= */}
                        <div className="customer-review-header">

                            <div>
                                <h2 id="review-modal-title">
                                    ⭐{" "}
                                    {
                                        selectedProduct.name
                                    }{" "}
                                    Reviews
                                </h2>

                                <p className="review-modal-subtitle">
                                    Customer reviews
                                    and ratings
                                </p>
                            </div>

                            <button
                                type="button"
                                className="customer-review-close"
                                onClick={
                                    handleCloseReviews
                                }
                                aria-label="Close reviews"
                                title="Close"
                            >
                                ✕
                            </button>

                        </div>

                        {/* =========================
                            REVIEW CONTENT
                        ========================= */}
                        <div className="customer-review-content">

                            {reviewsLoading ? (
                                <div className="review-loading">
                                    <div className="review-loading-icon">
                                        ⭐
                                    </div>

                                    <p>
                                        Loading reviews...
                                    </p>
                                </div>
                            ) : reviews.length ===
                              0 ? (
                                <div className="no-reviews-message">

                                    <div className="no-reviews-icon">
                                        ⭐
                                    </div>

                                    <h3>
                                        No Reviews Yet
                                    </h3>

                                    <p>
                                        No reviews are
                                        available for
                                        this product
                                        yet.
                                    </p>

                                </div>
                            ) : (
                                <div className="customer-review-list">

                                    {reviews.map(
                                        (
                                            review
                                        ) => (
                                            <div
                                                className="customer-review-item"
                                                key={
                                                    review.id
                                                }
                                            >

                                                <div className="customer-review-top">

                                                    <div className="review-customer-info">

                                                        <div className="review-customer-avatar">
                                                            {String(
                                                                review.customer_name ||
                                                                    "C"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}
                                                        </div>

                                                        <strong>
                                                            {
                                                                review.customer_name
                                                            }
                                                        </strong>

                                                    </div>

                                                    <span className="review-rating">
                                                        ⭐{" "}
                                                        {
                                                            review.rating
                                                        }
                                                        /5
                                                    </span>

                                                </div>

                                                {review.comment && (
                                                    <p className="review-comment">
                                                        {
                                                            review.comment
                                                        }
                                                    </p>
                                                )}

                                                <small className="review-date">
                                                    {new Date(
                                                        review.created_at
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </small>

                                            </div>
                                        )
                                    )}

                                </div>
                            )}

                        </div>

                        {/* =========================
                            MODAL FOOTER
                        ========================= */}
                        <div className="customer-review-footer">

                            <button
                                type="button"
                                className="customer-review-footer-button"
                                onClick={
                                    handleCloseReviews
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default CustomerShopping;