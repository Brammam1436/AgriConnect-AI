import { useState } from "react";
import "./App.css";

import CustomerOrders from "./components/CustomerOrders";
import CustomerShopping from "./components/CustomerShopping";
import FarmerDashboard from "./components/FarmerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CustomerCart from "./components/CustomerCart";
import CustomerNotifications from "./components/CustomerNotifications";
import CustomerDashboard from "./components/CustomerDashboard";

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

  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || ""
  );

  // --------------------------------
  // REGISTER / LOGIN SCREEN STATE
  // --------------------------------

  const [showRegister, setShowRegister] = useState(false);

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerRole, setRegisterRole] = useState("CUSTOMER");
  const [registerPassword, setRegisterPassword] = useState("");

  // Farmer profile fields
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmVillage, setFarmVillage] = useState("");
  const [farmDistrict, setFarmDistrict] = useState("");
  const [farmState, setFarmState] = useState("");
  const [farmPincode, setFarmPincode] = useState("");

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

      // --------------------------------
      // SAVE USER ROLE
      // --------------------------------

      localStorage.setItem("user_role", role);

      // --------------------------------
      // SAVE USERNAME
      // --------------------------------

      localStorage.setItem(
        "current_username",
        data.user?.username || username
      );

      // --------------------------------
      // UPDATE REACT STATE
      // --------------------------------

      setUserRole(role);
      setLoggedIn(true);
      setPassword("");

      setMessage("✅ Login successful!");

      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);

      setMessage("Unable to connect to Django backend.");

      setLoading(false);
    }
  };

  // --------------------------------
  // REGISTER
  // --------------------------------

  const handleRegister = async (event) => {
    event.preventDefault();

    // Basic frontend password validation
    if (registerPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Creating your account...");

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: registerUsername,
            email: registerEmail,
            phone: registerPhone,
            role: registerRole,
            password: registerPassword,

            // Farmer profile details
            farm_name: farmName,
            address: farmAddress,
            village: farmVillage,
            district: farmDistrict,
            state: farmState,
            pincode: farmPincode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Registration error:", data);

        // Handle Django serializer errors
        const errorMessages = [];

        Object.keys(data).forEach((field) => {
          const errors = data[field];

          if (Array.isArray(errors)) {
            errorMessages.push(
              `${field}: ${errors.join(", ")}`
            );
          } else {
            errorMessages.push(
              `${field}: ${errors}`
            );
          }
        });

        setMessage(
          errorMessages.length > 0
            ? errorMessages.join(" | ")
            : "Registration failed. Please check your details."
        );

        setLoading(false);

        return;
      }

      // --------------------------------
      // REGISTRATION SUCCESS
      // --------------------------------

      setMessage(
        "✅ Registration successful! Please login with your new account."
      );

      // Clear registration form
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterRole("CUSTOMER");
      setRegisterPassword("");

      // Clear farmer fields
      setFarmName("");
      setFarmAddress("");
      setFarmVillage("");
      setFarmDistrict("");
      setFarmState("");
      setFarmPincode("");

      // Switch back to login
      setShowRegister(false);

      // Put registered username into login form
      setUsername(registerUsername);

      setLoading(false);
    } catch (error) {
      console.error("Registration error:", error);

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
    // Remove authentication information
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("current_username");

    // Reset React authentication state
    setLoggedIn(false);
    setUserRole("");

    // Clear password
    setPassword("");

    // Show login screen
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

        // --------------------------------
        // PAYMENT SUCCESS
        // --------------------------------

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

        // --------------------------------
        // CUSTOMER DETAILS
        // --------------------------------

        prefill: {
          name: "AgriConnect Customer",
        },

        // --------------------------------
        // RAZORPAY THEME
        // --------------------------------

        theme: {
          color: "#2e7d32",
        },

        // --------------------------------
        // PAYMENT MODAL
        // --------------------------------

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

  // ==========================================
  // LOGIN / REGISTER SCREEN
  // ==========================================

  if (!loggedIn || !userRole) {
    return (
      <div className="app-container">

        <div className="payment-card">

          <h1>
            🌱 AgriConnect AI
          </h1>

          <p className="subtitle">
            Farmer-to-Customer Marketplace
          </p>

          {!showRegister ? (
            <>
              {/* =================================
                  LOGIN
              ================================= */}

              <h2>
                Login
              </h2>

              <form
                onSubmit={handleLogin}
              >

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

              {/* =================================
                  REGISTER BUTTON
              ================================= */}

              <p className="auth-switch">
                Don't have an account?
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowRegister(true);
                  setMessage("");
                }}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              {/* =================================
                  REGISTRATION
              ================================= */}

              <h2>
                Create Account
              </h2>

              <p className="subtitle">
                Register as a Customer or Farmer
              </p>

              <form
                onSubmit={handleRegister}
              >

                {/* USERNAME */}

                <div className="form-group">

                  <label>
                    Username
                  </label>

                  <input
                    type="text"
                    value={registerUsername}
                    onChange={(event) =>
                      setRegisterUsername(
                        event.target.value
                      )
                    }
                    placeholder="Enter username"
                    required
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(event) =>
                      setRegisterEmail(
                        event.target.value
                      )
                    }
                    placeholder="Enter email"
                    required
                  />

                </div>

                {/* PHONE */}

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(event) =>
                      setRegisterPhone(
                        event.target.value
                      )
                    }
                    placeholder="Enter phone number"
                    required
                  />

                </div>

                {/* ROLE */}

                <div className="form-group">

                  <label>
                    Register As
                  </label>

                  <select
                    value={registerRole}
                    onChange={(event) =>
                      setRegisterRole(event.target.value)
                    }
                    required
                  >
                    <option value="CUSTOMER">
                      Customer
                    </option>

                    <option value="FARMER">
                      Farmer
                    </option>
                  </select>

                </div>

                {/* =================================
                    FARMER PROFILE DETAILS
                ================================= */}

                {registerRole === "FARMER" && (
                  <>
                    {/* FARM NAME */}

                    <div className="form-group">

                      <label>
                        Farm Name
                      </label>

                      <input
                        type="text"
                        value={farmName}
                        onChange={(event) =>
                          setFarmName(event.target.value)
                        }
                        placeholder="Enter farm name"
                        required
                      />

                    </div>

                    {/* ADDRESS */}

                    <div className="form-group">

                      <label>
                        Farm Address
                      </label>

                      <textarea
                        value={farmAddress}
                        onChange={(event) =>
                          setFarmAddress(event.target.value)
                        }
                        placeholder="Enter farm address"
                        rows="3"
                        required
                      />

                    </div>

                    {/* VILLAGE */}

                    <div className="form-group">

                      <label>
                        Village
                      </label>

                      <input
                        type="text"
                        value={farmVillage}
                        onChange={(event) =>
                          setFarmVillage(event.target.value)
                        }
                        placeholder="Enter village"
                        required
                      />

                    </div>

                    {/* DISTRICT */}

                    <div className="form-group">

                      <label>
                        District
                      </label>

                      <input
                        type="text"
                        value={farmDistrict}
                        onChange={(event) =>
                          setFarmDistrict(event.target.value)
                        }
                        placeholder="Enter district"
                        required
                      />

                    </div>

                    {/* STATE */}

                    <div className="form-group">

                      <label>
                        State
                      </label>

                      <input
                        type="text"
                        value={farmState}
                        onChange={(event) =>
                          setFarmState(event.target.value)
                        }
                        placeholder="Enter state"
                        required
                      />

                    </div>

                    {/* PINCODE */}

                    <div className="form-group">

                      <label>
                        Pincode
                      </label>

                      <input
                        type="text"
                        value={farmPincode}
                        onChange={(event) =>
                          setFarmPincode(event.target.value)
                        }
                        placeholder="Enter pincode"
                        maxLength={10}
                        required
                      />

                    </div>
                  </>
                )}

                {/* PASSWORD */}

                <div className="form-group">

                  <label>
                    Password
                  </label>

                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(event) =>
                      setRegisterPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />

                </div>

                {/* REGISTER */}

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Creating Account..."
                    : "Register"}
                </button>

              </form>

              {/* BACK TO LOGIN */}

              <p className="auth-switch">
                Already have an account?
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowRegister(false);
                  setMessage("");
                }}
              >
                Back to Login
              </button>
            </>
          )}

          {/* MESSAGE */}

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
      <FarmerDashboard
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // CUSTOMER DASHBOARD
  // ==========================================

  if (userRole === "CUSTOMER") {
    return (
      <CustomerDashboard
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  if (userRole === "ADMIN") {
    return (
        <AdminDashboard
            onLogout={handleLogout}
        />
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

          <strong>
            {" "}
            {userRole}
          </strong>
        </p>

        <button
          type="button"
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