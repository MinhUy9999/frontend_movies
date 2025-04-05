import { api, handleError } from "./index";

const userApi = {
  async register(userData) {
    try {
      const response = await api.post("/users/register", userData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async getWebSocketToken() {
    try {
      const response = await api.get("/users/ws-token");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async login(credentials) {
    try {
      const response = await api.post("/users/login", credentials);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async refreshToken() {
    try {
      const response = await api.post("/users/refresh-token");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async logout() {
    try {
      const response = await api.post("/users/logout");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post("/users/forgot-password", email);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async resetPassword(data) {
    try {
      const response = await api.post("/users/reset-password", data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async updateUser(id, updateData) {
    try {
      const response = await api.put(`/users/${id}`, updateData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

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
