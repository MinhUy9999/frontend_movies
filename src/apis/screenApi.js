// apis/screenApi.js
import { api, handleError } from "./index";

const SCREEN_ENDPOINT = "screens"; // Để trống vì router không dùng /screens

export const ScreenApi = {
    getAllScreens: async () => {
        try {
            const response = await api.get(`${SCREEN_ENDPOINT}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    getScreenById: async (id) => {
        try {
            const response = await api.get(`${SCREEN_ENDPOINT}/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    createScreen: async (screenData) => {
        try {
            const response = await api.post(`${SCREEN_ENDPOINT}/`, screenData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    updateScreen: async (id, screenData) => {
        try {
            const response = await api.put(`${SCREEN_ENDPOINT}/${id}`, screenData);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    deleteScreen: async (id) => {
        try {
            const response = await api.delete(`${SCREEN_ENDPOINT}/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    getScreenSeats: async (id) => {
        try {
            const response = await api.get(`${SCREEN_ENDPOINT}/${id}/seats`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    updateScreenSeats: async (id, seats) => {
        try {
            const response = await api.put(`${SCREEN_ENDPOINT}/${id}/seats`, { seats });
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
};