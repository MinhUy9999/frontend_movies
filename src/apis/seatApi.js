// apis/seatApi.js
import { api, getAuthHeader } from "./index";

const apiSeats = {
    // Lấy danh sách tất cả ghế (admin only)
    getAllSeats: async () => {
        try {
            const response = await api.get("/seats");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching all seats");
        }
    },

    // Lấy thông tin một ghế theo ID (admin only)
    getSeatById: async (seatId) => {
        try {
            const response = await api.get(`/seats/${seatId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching seat by ID");
        }
    },

    // Tạo ghế mới (admin only)
    createSeat: async (seatData) => {
        try {
            const response = await api.post("/seats", seatData, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating seat");
        }
    },

    // Cập nhật thông tin ghế (admin only)
    updateSeat: async (seatId, seatData) => {
        try {
            const response = await api.put(`/seats/${seatId}`, seatData, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating seat");
        }
    },

    // Xóa ghế (admin only)
    deleteSeat: async (seatId) => {
        try {
            const response = await api.delete(`/seats/${seatId}`, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error deleting seat");
        }
    },

    // Đặt ghế tạm thời (authenticated users)
    reserveSeat: async (seatId) => {
        try {
            const response = await api.post("/seats/reserve", { seatId });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error reserving seat");
        }
    },

    // Xác nhận đặt ghế (authenticated users)
    bookSeat: async (seatId, bookingId) => {
        try {
            const response = await api.post("/seats/book", { seatId, bookingId });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error booking seat");
        }
    },

    // Hủy đặt ghế (authenticated users)
    releaseSeat: async (seatId) => {
        try {
            const response = await api.post("/seats/release", { seatId });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error releasing seat");
        }
    },
};

export { apiSeats };