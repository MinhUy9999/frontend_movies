// apis/seatApi.js
import { api, getAuthHeader } from "./index";

const apiSeats = {
    // Lấy danh sách tất cả ghế (public - không cần xác thực)
    getAllSeats: async (queryString = "") => {
        try {
            const response = await api.get(`/seats${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi lấy danh sách ghế");
        }
    },

    // Lấy ghế theo ID suất chiếu (public - không cần xác thực)
    getSeatsByShowtime: async (showtimeId) => {
        try {
            const response = await api.get(`/seats/showtime/${showtimeId}`);
            console.log('API response:', response.data); // Debug dữ liệu trả về
            return response.data;
        } catch (error) {
            console.error('API error:', error.response || error.message); // Debug lỗi
            throw new Error(error.response?.data?.message || "Lỗi khi lấy ghế theo suất chiếu");
        }
    },

    // Lấy thông tin một ghế theo ID (public - không cần xác thực)
    getSeatById: async (seatId) => {
        try {
            const response = await api.get(`/seats/${seatId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi lấy thông tin ghế");
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
            throw new Error(error.response?.data?.message || "Lỗi khi tạo ghế");
        }
    },

    // Tạo nhiều ghế cùng lúc (admin only)
    createManySeats: async (seatsData) => {
        try {
            const response = await api.post("/seats/bulk", { seats: seatsData }, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi tạo nhiều ghế");
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
            throw new Error(error.response?.data?.message || "Lỗi khi cập nhật ghế");
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
            throw new Error(error.response?.data?.message || "Lỗi khi xóa ghế");
        }
    },

    // Đặt ghế tạm thời (authenticated users)
    reserveSeat: async (seatId) => {
        try {
            const response = await api.post("/seats/reserve", { seatId }, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi đặt ghế tạm thời");
        }
    },

    // Đặt nhiều ghế tạm thời cùng lúc (authenticated users)
    reserveMultipleSeats: async (seatIds) => {
        try {
            const response = await api.post("/seats/reserve-multiple", { seatIds }, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi đặt nhiều ghế tạm thời");
        }
    },

    // Xác nhận đặt ghế (authenticated users)
    bookSeat: async (seatId, bookingId) => {
        try {
            const response = await api.post("/seats/book", { seatId, bookingId }, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi xác nhận đặt ghế");
        }
    },

    // Hủy đặt ghế (authenticated users)
    releaseSeat: async (seatId) => {
        try {
            const response = await api.post("/seats/release", { seatId }, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi hủy đặt ghế");
        }
    },

    // Kiểm tra trạng thái ghế (public - không cần xác thực)
    checkSeatStatus: async (seatId) => {
        try {
            const response = await api.get(`/seats/${seatId}/status`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Lỗi khi kiểm tra trạng thái ghế");
        }
    }
};

export { apiSeats };