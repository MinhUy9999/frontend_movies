import { api, handleError } from "./index";

const showtimeApi = {
    getShowtimes: async () => {
        try {
            const response = await api.get("/showtimes");
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    getShowtimeById: async (id) => {
        try {
            const response = await api.get(`/showtimes/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    createShowtime: async (showtimeData) => {
        try {
            const response = await api.post("/showtimes", showtimeData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    updateShowtime: async (id, showtimeData) => {
        try {
            const response = await api.put(`/showtimes/${id}`, showtimeData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    deleteShowtime: async (id) => {
        try {
            const response = await api.delete(`/showtimes/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
};

export default showtimeApi;
