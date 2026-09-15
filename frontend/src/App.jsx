import { useState } from "react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const RAZORPAY_KEY_ID = "rzp_test_Tb9K0WydM5EmRH";

function App() {
  // Login states
  const [username, setUsername] = useState("api_customer1");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  // Payment states
  const [orderId] = useState(4);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // CUSTOMER LOGIN
  // -----------------------------
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("Logging in...");

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.message ||
            "Login failed. Please check your username and password."
        );

        setLoading(false);
        return;
      }

      // Save JWT access token in browser
      localStorage.setItem("access_token", data.access);

      setLoggedIn(true);
      setPassword("");
      setMessage("✅ Login successful!");

      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to Django backend.");
      setLoading(false);
    }
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setMessage("Logged out successfully.");
  };

  // -----------------------------
  // RAZORPAY PAYMENT
  // -----------------------------
  const handlePayment = async () => {
    try {
      setLoading(true);
      setMessage("Creating Razorpay order...");

      // Get JWT token from localStorage
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("Please login first.");
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      // -----------------------------
      // STEP 1:
      // Create Razorpay Order
      // -----------------------------
      const response = await fetch(
        `${API_BASE_URL}/api/payments/${orderId}/create/`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({}),
        }
      );

      const paymentData = await response.json();

      if (!response.ok) {
        setMessage(
          paymentData.detail ||
            "Unable to create payment order."
        );

        setLoading(false);
        return;
      }

      console.log("Payment order:", paymentData);

      // -----------------------------
      // STEP 2:
      // Open Razorpay Checkout
      // -----------------------------
      if (!window.Razorpay) {
        setMessage(
          "Razorpay Checkout failed to load. Please refresh the page."
        );

        setLoading(false);
        return;
      }

      const options = {
        key: RAZORPAY_KEY_ID,

        amount: Math.round(
          Number(paymentData.amount) * 100
        ),

        currency: "INR",

        name: "AgriConnect AI",

        description: `Payment for Order #${orderId}`,

        order_id: paymentData.razorpay_order_id,

        handler: async function (paymentResponse) {
          try {
            setMessage(
              "Payment successful. Verifying payment..."
            );

            // -----------------------------
            // STEP 3:
            // Verify Payment
            // -----------------------------
            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/payments/${orderId}/verify/`,
              {
                method: "POST",

                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
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

            if (verifyResponse.ok) {
              setMessage(
                "✅ Payment successful and verified!"
              );
            } else {
              setMessage(
                verifyData.detail ||
                  "Payment verification failed."
              );
            }
          } catch (error) {
            console.error(error);

            setMessage(
              "Payment verification request failed."
            );
          }
        },

        prefill: {
          name: "AgriConnect Customer",
        },

        theme: {
          color: "#2e7d32",
        },

        modal: {
          ondismiss: function () {
            setMessage("Payment window closed.");
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();

      setLoading(false);
    } catch (error) {
      console.error(error);

      setMessage(
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  // -----------------------------
  // LOGIN SCREEN
  // -----------------------------
  if (!loggedIn) {
    return (
      <div className="app-container">
        <div className="payment-card">
          <h1>🌱 AgriConnect AI</h1>

          <p className="subtitle">
            Farmer-to-Customer Marketplace
          </p>

          <h2>Customer Login</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------
  // PAYMENT SCREEN
  // -----------------------------
  return (
    <div className="app-container">
      <div className="payment-card">
        <h1>🌱 AgriConnect AI</h1>

        <p className="subtitle">
          Farmer-to-Customer Marketplace
        </p>

        <p className="success-text">
          ✅ Customer logged in
        </p>

        <div className="order-box">
          <h2>Order #{orderId}</h2>

          <p>
            <strong>Product:</strong> Potato
          </p>

          <p>
            <strong>Quantity:</strong> 2 kg
          </p>

          <p>
            <strong>Price:</strong> ₹55/kg
          </p>

          <p className="total">
            Total: ₹110.00
          </p>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : "Pay ₹110"}
        </button>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;