import { useState } from "react";

function FarmerPriceRecommendation({ products }) {

    const [selectedProduct, setSelectedProduct] = useState("");

    const [recommendation, setRecommendation] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const handleRecommendPrice = async () => {

        // Clear previous result/error
        setRecommendation(null);
        setError("");


        // Check product selection
        if (!selectedProduct) {

            setError(
                "Please select a product."
            );

            return;
        }


        setLoading(true);


        try {

            // Get JWT token
            const token =
                localStorage.getItem(
                    "access_token"
                );


            // Call backend API
            const response = await fetch(
                `http://127.0.0.1:8000/api/ai/price/${selectedProduct}/`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            const data =
                await response.json();


            // Check API response
            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to generate price recommendation."
                );
            }


            // Save result
            setRecommendation(data);

        }
        catch (error) {

            setError(
                error.message ||
                "Something went wrong while generating price recommendation."
            );

        }
        finally {

            setLoading(false);

        }

    };


    return (

        <div className="farmer-price-section">

            <h2>
                AI Price Recommendation
            </h2>


            <p>
                Get a recommended selling price
                based on your current price and
                historical delivered order prices.
            </p>


            {/* Product Selection */}

            <div className="price-form-group">

                <label>
                    Select Product
                </label>


                <select
                    value={selectedProduct}
                    onChange={(event) =>
                        setSelectedProduct(
                            event.target.value
                        )
                    }
                >

                    <option value="">
                        Select a product
                    </option>


                    {products.map((product) => (

                        <option
                            key={product.id}
                            value={product.id}
                        >
                            {product.name}
                        </option>

                    ))}

                </select>

            </div>


            {/* Recommendation Button */}

            <button
                type="button"
                className="price-recommend-button"
                onClick={handleRecommendPrice}
                disabled={loading}
            >

                {loading
                    ? "Generating..."
                    : "Get Price Recommendation"}

            </button>


            {/* Error */}

            {error && (

                <div className="price-error">

                    ❌ {error}

                </div>

            )}


            {/* Recommendation Result */}

            {recommendation && (

                <div className="price-result">

                    <h3>
                        💰 Price Recommendation
                    </h3>


                    <p>
                        <strong>
                            Product:
                        </strong>{" "}

                        {recommendation.product_name}

                    </p>


                    <p>
                        <strong>
                            Category:
                        </strong>{" "}

                        {recommendation.product_category}

                    </p>


                    <p>
                        <strong>
                            Current Price:
                        </strong>{" "}

                        ₹
                        {recommendation.current_price_per_kg}
                        /kg

                    </p>


                    <p>
                        <strong>
                            Historical Average:
                        </strong>{" "}

                        {recommendation.historical_average_price !== null
                            ? `₹${recommendation.historical_average_price}/kg`
                            : "Not available"}

                    </p>


                    <p>
                        <strong>
                            Recommended Price:
                        </strong>{" "}

                        {recommendation.recommended_price_per_kg !== null
                            ? `₹${recommendation.recommended_price_per_kg}/kg`
                            : "Not available"}

                    </p>


                    <p>
                        {recommendation.message}
                    </p>

                </div>

            )}

        </div>

    );

}


export default FarmerPriceRecommendation;