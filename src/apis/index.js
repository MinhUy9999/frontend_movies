// apis/index.js
import axios from "axios";

// Định nghĩa base URL từ biến môi trường hoặc mặc định
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Tạo instance axios chung
const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Gửi cookie (refreshToken) nếu cần
});

// Hàm lấy header Authorization từ accessToken trong localStorage
const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Interceptor để gắn accessToken vào mọi request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Hàm xử lý lỗi chung
const handleError = (error) => {
    if (error.response) {
        return {
            statusCode: error.response.status,
            content: null,
            message: error.response.data.message || "An error occurred",
            date: new Date().toISOString(),
        };
    }
    return {
        statusCode: 500,
        content: null,
        message: error.message || "Network error",
        date: new Date().toISOString(),
    };
};

// Export instance axios và các hàm hỗ trợ
export { api, getAuthHeader, handleError };