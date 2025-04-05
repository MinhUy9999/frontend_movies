import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://backend-movies-busc.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export { api, getAuthHeader, handleError };
