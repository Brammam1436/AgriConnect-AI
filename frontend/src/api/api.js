import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================
// Automatically attach JWT token to every request

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
// Automatically clear session if JWT is
// expired or invalid

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Session expired or unauthorized. Clearing session.");

            // Clear old authentication data
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role");
            localStorage.removeItem("current_username");

            // Redirect to login screen
            window.location.reload();
        }

        return Promise.reject(error);
    }
);

export default api;