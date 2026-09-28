import { useState } from "react";

function FarmerDemandPrediction({ products }) {
    const [selectedProduct, setSelectedProduct] = useState("");
    const [year, setYear] = useState("2026");
    const [month, setMonth] = useState("9");

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handlePredictDemand = async () => {

        // Clear previous result/error
        setPrediction(null);
        setError("");

        // Check product selection
        if (!selectedProduct) {
            setError("Please select a product.");
            return;
        }

        // Check year
        if (!year) {
            setError("Please enter a year.");
            return;
        }

        // Check month
        if (!month) {
            setError("Please select a month.");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem(
                "access_token"
            );

            const response = await fetch(
                `http://127.0.0.1:8000/api/ai/demand/${selectedProduct}/?year=${year}&month=${month}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Failed to generate demand prediction."
                );
            }

            setPrediction(data);

        } catch (error) {
            setError(
                error.message ||
                "Something went wrong while predicting demand."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="farmer-ai-section">

            <h2>AI Demand Prediction</h2>

            <p>
                Predict the expected demand for your agricultural products.
            </p>

            {/* Product Selection */}

            <div className="ai-form-group">

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

            {/* Year */}

            <div className="ai-form-group">

                <label>
                    Year
                </label>

                <input
                    type="number"
                    value={year}
                    min="2000"
                    onChange={(event) =>
                        setYear(event.target.value)
                    }
                />

            </div>

            {/* Month */}

            <div className="ai-form-group">

                <label>
                    Month
                </label>

                <select
                    value={month}
                    onChange={(event) =>
                        setMonth(event.target.value)
                    }
                >
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>

            </div>

            {/* Predict Button */}

            <button
                type="button"
                className="ai-predict-button"
                onClick={handlePredictDemand}
                disabled={loading}
            >
                {loading
                    ? "Predicting..."
                    : "Predict Demand"}
            </button>

            {/* Error */}

            {error && (
                <div className="ai-error">
                    ❌ {error}
                </div>
            )}

            {/* Prediction Result */}

            {prediction && (
                <div className="ai-result">

                    <h3>
                        📊 Demand Prediction
                    </h3>

                    <p>
                        <strong>Product:</strong>{" "}
                        {prediction.product_name}
                    </p>

                    <p>
                        <strong>Category:</strong>{" "}
                        {prediction.product_category}
                    </p>

                    <p>
                        <strong>Year:</strong>{" "}
                        {prediction.year}
                    </p>

                    <p>
                        <strong>Month:</strong>{" "}
                        {prediction.month}
                    </p>

                    <p>
                        <strong>Predicted Demand:</strong>{" "}
                        {prediction.predicted_demand !== null
                            ? `${prediction.predicted_demand} kg`
                            : "Not available"}
                    </p>

                    <p>
                        <strong>Prediction Method:</strong>{" "}
                        {prediction.prediction_method ||
                            "Not available"}
                    </p>

                    <p>
                        {prediction.message}
                    </p>

                </div>
            )}

        </div>
    );
}

export default FarmerDemandPrediction;