// src/apis/bookingApi.js
import { api, handleError } from "./index";

const bookingApi = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post("/bookings", bookingData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Process payment for a booking
  processPayment: async (bookingId, paymentData) => {
    try {
      const response = await api.post(`/bookings/payment`, {
        bookingId,
        ...paymentData,
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Cancel a booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get all user bookings
  getUserBookings: async () => {
    try {
      const response = await api.get("/bookings");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

export default bookingApi;
