import { useState } from "react";
import "./App.css";
import CustomerOrders from "./components/CustomerOrders";
import FarmerDashboard from "./components/FarmerDashboard";
import AdminDashboard from "./components/AdminDashboard";

const API_BASE_URL = "http://127.0.0.1:8000";
const RAZORPAY_KEY_ID = "rzp_test_Tb9K0WydM5EmRH";

function App() {
  // --------------------------------
  // LOGIN STATES
  // --------------------------------
  const [username, setUsername] = useState("api_customer1");
  const [password, setPassword] = useState("");

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  // Get saved role from localStorage
  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || ""
  );

  // --------------------------------
  // PAYMENT STATES
  // --------------------------------
  const [orderId] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------
  // LOGIN
  // --------------------------------
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

      // --------------------------------
      // SAVE JWT ACCESS TOKEN
      // --------------------------------
      localStorage.setItem("access_token", data.access);

      // --------------------------------
      // GET USER ROLE
      // --------------------------------
      const role = data.user?.role || data.role;

      if (!role) {
        setMessage(
          "Login successful, but user role was not returned by the server."
        );

        localStorage.removeItem("access_token");

        setLoading(false);
        return;
      }

      // Save role in localStorage
      localStorage.setItem("user_role", role);

      // Update React state
      setUserRole(role);
      setLoggedIn(true);

      setPassword("");
      setMessage("✅ Login successful!");

      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Unable to connect to Django backend."
      );

      setLoading(false);
    }
  };

  // --------------------------------
  // LOGOUT
  // --------------------------------
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");

    setLoggedIn(false);
    setUserRole("");
    setMessage("Logged out successfully.");
  };

  // --------------------------------
  // RAZORPAY PAYMENT
  // --------------------------------
  const handlePayment = async () => {
    try {
      setLoading(true);
      setMessage("Creating Razorpay order...");

      // Get JWT token
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("Please login first.");

        setLoggedIn(false);
        setUserRole("");
        setLoading(false);

        return;
      }

      // --------------------------------
      // STEP 1:
      // CREATE RAZORPAY ORDER
      // --------------------------------
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

      console.log(
        "Payment order:",
        paymentData
      );

      // --------------------------------
      // STEP 2:
      // OPEN RAZORPAY CHECKOUT
      // --------------------------------
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

        order_id:
          paymentData.razorpay_order_id,

        handler: async function (
          paymentResponse
        ) {
          try {
            setMessage(
              "Payment successful. Verifying payment..."
            );

            // --------------------------------
            // STEP 3:
            // VERIFY PAYMENT
            // --------------------------------
            const verifyResponse =
              await fetch(
                `${API_BASE_URL}/api/payments/${orderId}/verify/`,
                {
                  method: "POST",

                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type":
                      "application/json",
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
            console.error(
              "Payment verification error:",
              error
            );

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
            setMessage(
              "Payment window closed."
            );

            setLoading(false);
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();

      setLoading(false);
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setMessage(
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  };

  // --------------------------------
  // LOGIN SCREEN
  // --------------------------------
  if (!loggedIn || !userRole) {
    return (
      <div className="app-container">
        <div className="payment-card">
          <h1>🌱 AgriConnect AI</h1>

          <p className="subtitle">
            Farmer-to-Customer Marketplace
          </p>

          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
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

  // ==========================================
  // FARMER DASHBOARD
  // ==========================================
  if (userRole === "FARMER") {
    return (
      <div className="app-container">
        <FarmerDashboard />

        <div className="farmer-logout-container">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </div>
    );
  }

  // ==========================================
  // CUSTOMER DASHBOARD
  // ==========================================
  if (userRole === "CUSTOMER") {
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

          {/* --------------------------------
              CUSTOMER ORDERS
          -------------------------------- */}
          <CustomerOrders />

          {/* --------------------------------
              RAZORPAY PAYMENT
          -------------------------------- */}
          <div className="order-box">

            <h2>Payment Test</h2>

            <p>
              <strong>
                Order:
              </strong>{" "}
              #{orderId}
            </p>

            <p>
              <strong>
                Product:
              </strong>{" "}
              Potato
            </p>

            <p>
              <strong>
                Quantity:
              </strong>{" "}
              2 kg
            </p>

            <p>
              <strong>
                Price:
              </strong>{" "}
              ₹55/kg
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

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  if (userRole === "ADMIN") {
    return (
      <div className="app-container">
        <AdminDashboard />

        <div className="admin-logout-container">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </div>
    );
  }

  // ==========================================
  // UNKNOWN ROLE
  // ==========================================
  return (
    <div className="app-container">
      <div className="payment-card">

        <h2>
          Unknown User Role
        </h2>

        <p>
          Your account role is:
          <strong> {userRole}</strong>
        </p>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default App;