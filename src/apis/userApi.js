// apis/userApi.js
import { api, handleError } from "./index"; // Import từ index.js

const userApi = {
    // Đăng ký người dùng
    async register(userData) {
        try {
            const response = await api.post("/users/register", userData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Đăng nhập
    async login(credentials) {
        try {
            const response = await api.post("/users/login", credentials);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Làm mới token
    async refreshToken() {
        try {
            const response = await api.post("/users/refresh-token");
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Đăng xuất
    async logout() {
        try {
            const response = await api.post("/users/logout");
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Gửi email quên mật khẩu
    async forgotPassword(email) {
        try {
            const response = await api.post("/users/forgot-password", email);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Đặt lại mật khẩu
    async resetPassword(data) {
        try {
            const response = await api.post("/users/reset-password", data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    // Lấy thông tin người dùng theo ID
    async getUserById(id) {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật thông tin người dùng (yêu cầu admin)
    async updateUser(id, updateData) {
        try {
            const response = await api.put(`/users/${id}`, updateData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa người dùng (yêu cầu admin)
    async deleteUser(id) {
        try {
            const response = await api.delete(`/users/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy danh sách tất cả người dùng (yêu cầu admin)
    async getAllUsers() {
        try {
            const response = await api.get("/admin/users");
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
};

export { userApi };