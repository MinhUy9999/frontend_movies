// apis/theaterApi.js
import { api, handleError } from "./index";

const BASE_PATH = "/theaters";

export const TheaterAPI = {
    // Lấy danh sách tất cả các rạp phim
    getAllTheaters: async () => {
        try {
            const response = await api.get(BASE_PATH);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Lấy thông tin chi tiết một rạp phim theo ID
    getTheaterById: async (id) => {
        try {
            const response = await api.get(`${BASE_PATH}/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Tạo mới một rạp phim
    createTheater: async (theaterData) => {
        try {
            const response = await api.post(BASE_PATH, theaterData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Cập nhật thông tin một rạp phim
    updateTheater: async (id, updatedData) => {
        try {
            const response = await api.put(`${BASE_PATH}/${id}`, updatedData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Xóa một rạp phim
    deleteTheater: async (id) => {
        try {
            const response = await api.delete(`${BASE_PATH}/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
};
