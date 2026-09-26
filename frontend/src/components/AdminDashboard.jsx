import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

function AdminDashboard() {
  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const [stats, setStats] = useState({
    total_users: 0,
    total_farmers: 0,
    total_customers: 0,
    total_products: 0,
    total_orders: 0,
    total_payments: 0,
  });

  // ==========================================
  // USERS
  // ==========================================

  const [users, setUsers] = useState([]);

  //products//

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  //order//

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");

  //payment//

  const [payments, setPayments] = useState([]);

  //EDIT products//

  const [editingProduct, setEditingProduct] = useState(null);

  const [productEditForm, setProductEditForm] = useState({
    name: "",
    category: "",
    description: "",
    price_per_kg: "",
    available_quantity: "",
    unit: "",
    is_available: true,
  });

  // ==========================================
  // EDIT USER
  // ==========================================

  const [editingUser, setEditingUser] = useState(null);

  const [editForm, setEditForm] = useState({
    email: "",
    phone: "",
    role: "",
  });

  // ==========================================
  // LOADING STATES
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [usersLoading, setUsersLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // ==========================================
  // MESSAGE
  // ==========================================

  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    fetchDashboardStats();
    fetchUsers();
    fetchProducts();
    fetchOrders();
    fetchPayments();
  }, []);

  // ==========================================
  // FETCH DASHBOARD STATISTICS
  // ==========================================

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setMessage("Please login as admin.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/dashboard/`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            "Unable to load admin dashboard."
        );

        setLoading(false);
        return;
      }

      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setMessage(
        "Unable to connect to Django backend."
      );

      setLoading(false);
    }
  };

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem(
        "access_token"
      );

      if (!token) {
        return;
      }

      setUsersLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/users/`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            "Unable to load users."
        );

        setUsersLoading(false);
        return;
      }

      setUsers(data.users || []);

      setUsersLoading(false);
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      setMessage("Unable to load users.");

      setUsersLoading(false);
    }
  };

  //fetch products//

  const fetchProducts = async () => {
    try {
        const token = localStorage.getItem(
        "access_token"
        );

        if (!token) {
        return;
        }

        setProductsLoading(true);

        const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/products/`,
        {
            method: "GET",

            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
        }
        );

        const data = await response.json();

        if (!response.ok) {
        setMessage(
            data.detail ||
            data.error ||
            "Unable to load products."
        );

        setProductsLoading(false);
        return;
        }

        setProducts(data.products || []);

        setProductsLoading(false);

    } catch (error) {
        console.error(
        "Fetch products error:",
        error
        );

        setMessage(
        "Unable to load products."
        );

        setProductsLoading(false);
    }
    };


    //fetch orders//

  const fetchOrders = async () => {
    setOrdersLoading(true);

    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/orders/`,
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
            data.detail || data.error || "Failed to fetch orders"
        );
        }

        // Support both a plain array response and wrapped responses
        // such as {"orders": [...]} or {"results": [...]}.
        const ordersData = Array.isArray(data)
          ? data
          : data.orders || data.results || [];

        setOrders(ordersData);
    } catch (error) {
        console.error("Fetch orders error:", error);
        setMessage(error.message);
    } finally {
        setOrdersLoading(false);
    }
    };

  // ==========================================
// FETCH PAYMENTS
// ==========================================

const fetchPayments = async () => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Please login as admin.");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/auth/admin/payments/`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.detail ||
          data.error ||
          "Unable to load payments."
      );

      setPayments([]);
      return;
    }

    // Support different API response formats
    const paymentsData = Array.isArray(data)
      ? data
      : data.payments || data.results || [];

    setPayments(paymentsData);

    console.log(
      "Admin payments:",
      paymentsData
    );
  } catch (error) {
    console.error(
      "Fetch payments error:",
      error
    );

    setMessage(
      "Unable to load payments."
    );

    setPayments([]);
  }
}; 

    //edit products//
  const handleProductEditClick = (product) => {
    setEditingProduct(product);

    setProductEditForm({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        price_per_kg: product.price_per_kg || "",
        available_quantity:
        product.available_quantity || "",
        unit: product.unit || "kg",
        is_available: product.is_available,
    });

    setMessage("");
  };

  const handleProductEditChange = (event) => {
    const { name, value, type, checked } = event.target;

    setProductEditForm({
        ...productEditForm,
        [name]:
        type === "checkbox"
            ? checked
            : value,
    });
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();

    if (!editingProduct) {
        return;
    }

    try {
        const token = localStorage.getItem(
        "access_token"
        );

        if (!token) {
        setMessage("Please login as admin.");
        return;
        }

        setActionLoading(true);

        const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/products/${editingProduct.id}/`,
        {
            method: "PUT",

            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },

            body: JSON.stringify(productEditForm),
        }
        );

        const data = await response.json();

        if (!response.ok) {
        setMessage(
            data.detail ||
            data.error ||
            "Unable to update product."
        );

        setActionLoading(false);
        return;
        }

        setMessage(
        "✅ Product updated successfully."
        );

        setEditingProduct(null);

        await fetchProducts();

        await fetchDashboardStats();

        setActionLoading(false);
    } catch (error) {
        console.error(
        "Update product error:",
        error
        );

        setMessage(
        "Unable to connect to Django backend."
        );

        setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
        `Are you sure you want to delete product "${product.name}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem(
        "access_token"
        );

        if (!token) {
        setMessage("Please login as admin.");
        return;
        }

        setActionLoading(true);

        const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/products/${product.id}/`,
        {
            method: "DELETE",

            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
        }
        );

        const data = await response.json();

        if (!response.ok) {
        setMessage(
            data.detail ||
            data.error ||
            "Unable to delete product."
        );

        setActionLoading(false);
        return;
        }

        setMessage(
        `✅ Product "${product.name}" deleted successfully.`
        );

        if (
        editingProduct &&
        editingProduct.id === product.id
        ) {
        setEditingProduct(null);
        }

        await fetchProducts();

        await fetchDashboardStats();

        setActionLoading(false);
    } catch (error) {
        console.error(
        "Delete product error:",
        error
        );

        setMessage(
        "Unable to connect to Django backend."
        );

        setActionLoading(false);
    }
  };



  // ==========================================
  // EDIT USER
  // ==========================================

  const handleEditClick = (user) => {
    setEditingUser(user);

    setEditForm({
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
    });

    setMessage("");
  };

  // ==========================================
  // EDIT FORM CHANGE
  // ==========================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // ==========================================
  // UPDATE USER
  // ==========================================

  const handleUpdateUser = async (event) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      const token = localStorage.getItem(
        "access_token"
      );

      if (!token) {
        setMessage("Please login as admin.");
        return;
      }

      setActionLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/users/${editingUser.id}/`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            "Unable to update user."
        );

        setActionLoading(false);
        return;
      }

      setMessage(
        "✅ User updated successfully."
      );

      setEditingUser(null);

      setEditForm({
        email: "",
        phone: "",
        role: "",
      });

      await fetchUsers();

      await fetchDashboardStats();

      setActionLoading(false);
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      setMessage(
        "Unable to connect to Django backend."
      );

      setActionLoading(false);
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingUser(null);

    setEditForm({
      email: "",
      phone: "",
      role: "",
    });

    setMessage("");
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const handleDeleteUser = async (user) => {
    // ------------------------------------------
    // CONFIRMATION DIALOG
    // ------------------------------------------

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem(
        "access_token"
      );

      if (!token) {
        setMessage("Please login as admin.");
        return;
      }

      setActionLoading(true);

      // ----------------------------------------
      // DELETE USER API
      // ----------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/api/auth/admin/users/${user.id}/`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      // ----------------------------------------
      // ERROR RESPONSE
      // ----------------------------------------

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            "Unable to delete user."
        );

        setActionLoading(false);
        return;
      }

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      setMessage(
        `✅ User "${user.username}" deleted successfully.`
      );

      // If the deleted user was being edited,
      // close the edit form.
      if (
        editingUser &&
        editingUser.id === user.id
      ) {
        setEditingUser(null);

        setEditForm({
          email: "",
          phone: "",
          role: "",
        });
      }

      // Refresh user list
      await fetchUsers();

      // Refresh dashboard numbers
      await fetchDashboardStats();

      setActionLoading(false);
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      setMessage(
        "Unable to connect to Django backend."
      );

      setActionLoading(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    setOrderDetailsLoading(true);
    setMessage("");

    try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
            `${API_BASE_URL}/api/auth/admin/orders/${orderId}/`,
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
                data.detail || data.error || "Failed to fetch order details"
            );
            }

        // Support both a plain order object and {"order": {...}}.
        const orderData = data.order || data;

        setSelectedOrder(orderData);
        setSelectedOrderStatus(orderData.status || "");
    } catch (error) {
        console.error("View order error:", error);
        setMessage(error.message);
    } finally {
        setOrderDetailsLoading(false);
    }
    };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) {
        return;
    }

    if (!selectedOrderStatus) {
        setMessage("Please select an order status.");
        return;
    }

    if (selectedOrderStatus === selectedOrder.status) {
        setMessage("Please select a different status.");
        return;
    }

    try {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setMessage("Please login as admin.");
            return;
        }

        setOrderStatusLoading(true);
        setMessage("");

        const response = await fetch(
            `${API_BASE_URL}/api/orders/${selectedOrder.id}/status/`,
            {
                method: "PUT",
                headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                status: selectedOrderStatus,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setMessage(
                data.detail ||
                data.error ||
                "Unable to update order status."
            );

        setOrderStatusLoading(false);
        return;
        }

        setMessage("✅ Order status updated successfully.");

        // Update the selected order immediately
        const updatedOrder =
            data.order || data.updated_order || data;

        setSelectedOrder((previousOrder) => ({
            ...previousOrder,
            ...updatedOrder,
            status: updatedOrder.status || selectedOrderStatus,
        }));

        setSelectedOrderStatus(
            updatedOrder.status || selectedOrderStatus
        );

        // Refresh order list
        await fetchOrders();

        // Refresh dashboard statistics
        await fetchDashboardStats();

        setOrderStatusLoading(false);
    } catch (error) {
        console.error("Update order status error:", error);

        setMessage(
        "Unable to connect to Django backend."
        );

        setOrderStatusLoading(false);
    }
    };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="payment-card">

        <h1>
          🌱 AgriConnect AI
        </h1>

        <h2>
          ⚙️ Admin Dashboard
        </h2>

        <p>
          Loading dashboard...
        </p>

      </div>
    );
  }

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  return (
    <div className="admin-dashboard">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="admin-header">

        <div>

          <h1>
            🌱 AgriConnect AI
          </h1>

          <p>
            Admin Dashboard
          </p>

        </div>

      </div>

      {/* ======================================
          MESSAGE
      ======================================= */}

      {message && (
        <p className="message">
          {message}
        </p>
      )}

      {/* ======================================
          DASHBOARD STATISTICS
      ======================================= */}

      <div className="admin-stats">

        <div className="stat-card">

          <h3>
            👥 Total Users
          </h3>

          <p>
            {stats.total_users}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            👨‍🌾 Total Farmers
          </h3>

          <p>
            {stats.total_farmers}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            🛒 Total Customers
          </h3>

          <p>
            {stats.total_customers}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            🥕 Total Products
          </h3>

          <p>
            {stats.total_products}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            📦 Total Orders
          </h3>

          <p>
            {stats.total_orders}
          </p>

        </div>

        <div className="stat-card">

          <h3>
            💳 Total Payments
          </h3>

          <p>
            {stats.total_payments}
          </p>

        </div>

      </div>

      {/* ======================================
          USER MANAGEMENT
      ======================================= */}

      <div className="admin-section">

        <h2>
          👥 User Management
        </h2>

        {usersLoading ? (

          <p>
            Loading users...
          </p>

        ) : users.length === 0 ? (

          <p>
            No users found.
          </p>

        ) : (

          <div className="admin-table-container">

            <table className="admin-table">

              {/* ================================
                  TABLE HEADER
              ================================= */}

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              {/* ================================
                  TABLE BODY
              ================================= */}

              <tbody>

                {users.map((user) => (

                  <tr key={user.id}>

                    <td>
                      {user.id}
                    </td>

                    <td>
                      {user.username}
                    </td>

                    <td>
                      {user.email || "-"}
                    </td>

                    <td>
                      {user.phone || "-"}
                    </td>

                    <td>

                      <span className="role-badge">
                        {user.role}
                      </span>

                    </td>

                    {/* ==========================
                        ACTION BUTTONS
                    =========================== */}

                    <td>

                      <div className="admin-action-buttons">

                        <button
                          type="button"
                          className="admin-edit-button"
                          onClick={() =>
                            handleEditClick(user)
                          }
                          disabled={actionLoading}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() =>
                            handleDeleteUser(user)
                          }
                          disabled={actionLoading}
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ======================================
            PRODUCT MANAGEMENT
        ======================================= */}

        <div className="admin-section">

        <h2>
            🥕 Product Management
        </h2>

        {productsLoading ? (

            <p>
            Loading products...
            </p>

        ) : products.length === 0 ? (

            <p>
            No products found.
            </p>

        ) : (

            <div className="admin-table-container">

            <table className="admin-table">

                <thead>

                <tr>

                    <th>
                    ID
                    </th>

                    <th>
                    Product
                    </th>

                    <th>
                    Category
                    </th>

                    <th>
                    Farmer
                    </th>

                    <th>
                    Price/kg
                    </th>

                    <th>
                    Quantity
                    </th>

                    <th>
                    Unit
                    </th>

                    <th>
                    Available
                    </th>

                    <th>
                    Action
                    </th>

                </tr>

                </thead>

                <tbody>

                {products.map((product) => (

                    <tr key={product.id}>

                    <td>
                        {product.id}
                    </td>

                    <td>
                        {product.name}
                    </td>

                    <td>
                        {product.category}
                    </td>

                    <td>
                        {product.farmer}
                    </td>

                    <td>
                        ₹{product.price_per_kg}
                    </td>

                    <td>
                        {product.available_quantity}
                    </td>

                    <td>
                        {product.unit}
                    </td>

                    <td>

                        {product.is_available
                        ? "✅ Yes"
                        : "❌ No"}

                    </td>

                    <td>

                        <div className="admin-action-buttons">

                            <button
                            type="button"
                            className="admin-edit-button"
                            onClick={() =>
                                handleProductEditClick(product)
                            }
                            disabled={actionLoading}
                            >
                            Edit
                            </button>

                            <button
                            type="button"
                            className="admin-delete-button"
                            onClick={() =>
                                handleDeleteProduct(product)
                            }
                            disabled={actionLoading}
                            >
                            Delete
                            </button>

                        </div>

                    </td>

                    </tr>

                ))}

                </tbody>

            </table>

            </div>

        )}

        </div>

        {editingProduct && (
            <div className="admin-edit-section">
                <h2>✏️ Edit Product</h2>

                <div className="admin-form-grid">

                <div className="admin-form-group">
                    <label>Product Name</label>
                    <input
                    type="text"
                    name="name"
                    value={productEditForm.name}
                    onChange={handleProductEditChange}
                    />
                </div>

                <div className="admin-form-group">
                    <label>Category</label>
                    <select
                    name="category"
                    value={productEditForm.category}
                    onChange={handleProductEditChange}
                    >
                    <option value="VEGETABLE">Vegetable</option>
                    <option value="FRUIT">Fruit</option>
                    <option value="GRAIN">Grain</option>
                    <option value="PULSE">Pulse</option>
                    <option value="SPICE">Spice</option>
                    <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="admin-form-group admin-full-width">
                    <label>Description</label>
                    <textarea
                    name="description"
                    value={productEditForm.description}
                    onChange={handleProductEditChange}
                    rows="4"
                    />
                </div>

                <div className="admin-form-group">
                    <label>Price per kg</label>
                    <input
                    type="number"
                    name="price_per_kg"
                    step="0.01"
                    value={productEditForm.price_per_kg}
                    onChange={handleProductEditChange}
                    />
                </div>

                <div className="admin-form-group">
                    <label>Available Quantity</label>
                    <input
                    type="number"
                    name="available_quantity"
                    step="0.01"
                    value={productEditForm.available_quantity}
                    onChange={handleProductEditChange}
                    />
                </div>

                <div className="admin-form-group">
                    <label>Unit</label>
                    <input
                    type="text"
                    name="unit"
                    value={productEditForm.unit}
                    onChange={handleProductEditChange}
                    />
                </div>

                <div className="admin-form-group">
                    <label>Available</label>

                    <select
                    name="is_available"
                    value={productEditForm.is_available ? "true" : "false"}
                    onChange={(e) =>
                        setProductEditForm({
                        ...productEditForm,
                        is_available: e.target.value === "true",
                        })
                    }
                    >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                    </select>
                </div>

                </div>

                <div className="admin-form-actions">

                <button
                    type="button"
                    className="admin-save-button"
                    onClick={handleUpdateProduct}
                    disabled={actionLoading}
                >
                    {actionLoading ? "Updating..." : "Update Product"}
                </button>

                <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => {
                    setEditingProduct(null);
                    setMessage("");
                    }}
                    disabled={actionLoading}
                >
                    Cancel
                </button>

                </div>
            </div>
        )}

        <div className="admin-section">
          <h2>📦 Order Management</h2>

          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>

                      <td>
                        {order.customer_username ||
                          order.customer_name ||
                          order.customer?.username ||
                          order.customer?.email ||
                          order.customer ||
                          "N/A"}
                      </td>

                      <td>
                        ₹
                        {order.total_amount ??
                          order.total_price ??
                          order.total ??
                          "0.00"}
                      </td>

                      <td>{order.status || "N/A"}</td>

                      <td>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString()
                          : "N/A"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-edit-button"
                          onClick={() => handleViewOrder(order.id)}
                          disabled={orderDetailsLoading}
                        >
                          {orderDetailsLoading ? "Loading..." : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedOrder && (
            <div className="admin-edit-section">
                <h2>📋 Order #{selectedOrder.id} Details</h2>

                <p>
                <strong>Customer:</strong>{" "}
                {selectedOrder.customer_username ||
                    selectedOrder.customer_name ||
                    selectedOrder.customer?.username ||
                    selectedOrder.customer?.email ||
                    selectedOrder.customer ||
                    "N/A"}
                </p>

                <p>
                <strong>Current Status:</strong>{" "}
                {selectedOrder.status || "N/A"}
                </p>

                <p>
                <strong>Total Amount:</strong> ₹
                {selectedOrder.total_amount ??
                    selectedOrder.total_price ??
                    selectedOrder.total ??
                    "0.00"}
                </p>

                <p>
                <strong>Created:</strong>{" "}
                {selectedOrder.created_at
                    ? new Date(
                        selectedOrder.created_at
                    ).toLocaleString()
                    : "N/A"}
                </p>

                {/* =====================================
                    UPDATE ORDER STATUS
                ====================================== */}

                <div className="admin-order-status-section">
                <h3>🔄 Update Order Status</h3>

                <div className="admin-form-group">
                    <label>Change Status</label>

                    <select
                    value={selectedOrderStatus}
                    onChange={(event) =>
                        setSelectedOrderStatus(event.target.value)
                    }
                    disabled={orderStatusLoading}
                    >
                    <option value="">Select Status</option>

                    <option value="PENDING">
                        PENDING
                    </option>

                    <option value="CONFIRMED">
                        CONFIRMED
                    </option>

                    <option value="PROCESSING">
                        PROCESSING
                    </option>

                    <option value="SHIPPED">
                        SHIPPED
                    </option>

                    <option value="DELIVERED">
                        DELIVERED
                    </option>

                    <option value="CANCELLED">
                        CANCELLED
                    </option>
                    </select>
                </div>

                <button
                    type="button"
                    className="admin-save-button"
                    onClick={handleUpdateOrderStatus}
                    disabled={
                    orderStatusLoading ||
                    !selectedOrderStatus ||
                    selectedOrderStatus === selectedOrder.status
                    }
                >
                    {orderStatusLoading
                    ? "Updating..."
                    : "Update Status"}
                </button>
                </div>

                {/* =====================================
                    ORDER ITEMS
                ====================================== */}

                <h3>🛒 Order Items</h3>

                {(() => {
                const orderItems =
                    selectedOrder.items ||
                    selectedOrder.order_items ||
                    [];

                return orderItems.length > 0 ? (
                    <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price/kg</th>
                            <th>Subtotal</th>
                        </tr>
                        </thead>

                        <tbody>
                        {orderItems.map((item, index) => (
                            <tr
                            key={
                                item.id ||
                                `${selectedOrder.id}-${index}`
                            }
                            >
                            <td>
                                {item.product_name ||
                                item.product?.name ||
                                item.product ||
                                "N/A"}
                            </td>

                            <td>
                                {item.quantity ?? "N/A"}
                            </td>

                            <td>
                                ₹
                                {item.price_per_kg ??
                                item.price ??
                                "0.00"}
                            </td>

                            <td>
                                ₹
                                {item.subtotal ??
                                item.total_price ??
                                item.total ??
                                "0.00"}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p>No items found.</p>
                );
                })()}

                <button
                type="button"
                className="admin-cancel-button"
                onClick={() => {
                    setSelectedOrder(null);
                    setSelectedOrderStatus("");
                    setMessage("");
                }}
                disabled={orderStatusLoading}
                >
                Close
                </button>
            </div>
            )}
        </div>

        {/* Payment Management */}
            <div className="admin-section">
            <h3>💳 Payment Management</h3>

            {payments.length === 0 ? (
                <p>No payments found.</p>
            ) : (
                <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Order</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                    </thead>

                    <tbody>
                    {payments.map((payment) => (
                        <tr key={payment.id}>
                        <td>{payment.id}</td>

                        <td>
                            {payment.customer_username ||
                            payment.customer ||
                            payment.username ||
                            "N/A"}
                        </td>

                        <td>
                            #{payment.order_id || payment.order || "N/A"}
                        </td>

                        <td>
                            ₹
                            {payment.amount !== undefined
                            ? Number(payment.amount).toFixed(2)
                            : "0.00"}
                        </td>

                        <td>
                            <span
                            className={`admin-payment-status ${
                                payment.status
                                ? payment.status.toLowerCase()
                                : ""
                            }`}
                            >
                            {payment.status || "N/A"}
                            </span>
                        </td>

                        <td>
                            {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : "N/A"}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>

      {/* ======================================
          EDIT USER SECTION
      ======================================= */}

      {editingUser && (

        <div className="admin-edit-section">

          <h2>
            ✏️ Edit User
          </h2>

          <form
            onSubmit={handleUpdateUser}
          >

            {/* ==============================
                USERNAME
            =============================== */}

            <div className="form-group">

              <label>
                Username
              </label>

              <input
                type="text"
                value={editingUser.username}
                disabled
              />

            </div>

            {/* ==============================
                EMAIL
            =============================== */}

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
              />

            </div>

            {/* ==============================
                PHONE
            =============================== */}

            <div className="form-group">

              <label>
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
              />

            </div>

            {/* ==============================
                ROLE
            =============================== */}

            <div className="form-group">

              <label>
                Role
              </label>

              <select
                name="role"
                value={editForm.role}
                onChange={handleEditChange}
              >

                <option value="CUSTOMER">
                  CUSTOMER
                </option>

                <option value="FARMER">
                  FARMER
                </option>

                <option value="DELIVERY_PARTNER">
                  DELIVERY PARTNER
                </option>

                <option value="ADMIN">
                  ADMIN
                </option>

              </select>

            </div>

            {/* ==============================
                SAVE BUTTON
            =============================== */}

            <button
              type="submit"
              disabled={actionLoading}
            >

              {actionLoading
                ? "Saving..."
                : "Save Changes"}

            </button>

            {/* ==============================
                CANCEL BUTTON
            =============================== */}

            <button
              type="button"
              className="logout-button"
              onClick={handleCancelEdit}
              disabled={actionLoading}
            >
              Cancel
            </button>

          </form>

        </div>

      )}

    </div>
  );
}

export default AdminDashboard;