// apis/apiMovies.js
import { api, getAuthHeader } from "./index"; // Import từ index.js

const apiMovies = {
    // Lấy danh sách phim đang hoạt động
    getActiveMovies: async () => {
        try {
            const response = await api.get("/movies/");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching active movies");
        }
    },

    // Tìm kiếm phim
    searchMovies: async (query) => {
        try {
            const response = await api.get("/movies/search", { params: { q: query } });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error searching movies");
        }
    },

    // Lấy danh sách phim sắp chiếu
    getUpcomingMovies: async () => {
        try {
            const response = await api.get("/movies/upcoming");
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching upcoming movies");
        }
    },

    // Lấy phim theo thể loại
    getMoviesByGenre: async (genre) => {
        try {
            const response = await api.get(`/movies/genre/${genre}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching movies by genre");
        }
    },

    // Lấy chi tiết phim theo ID
    getMovieById: async (id) => {
        try {
            const response = await api.get(`/movies/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching movie by ID");
        }
    },

    // Lấy lịch chiếu của phim theo ID
    getMovieShowtimes: async (id) => {
        try {
            const response = await api.get(`/movies/${id}/showtimes`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching movie showtimes");
        }
    },

    // Tạo phim mới (admin)
    createMovie: async (movieData) => {
        try {
            const response = await api.post("/movies/", movieData, {
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error creating movie");
        }
    },

    // Cập nhật phim (admin)
    updateMovie: async (id, movieData) => {
        try {
            const response = await api.put(`/movies/${id}`, movieData, {
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error updating movie");
        }
    },

    // Xóa phim (admin)
    deleteMovie: async (id) => {
        try {
            const response = await api.delete(`/movies/${id}`, {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error deleting movie");
        }
    },

    // Lấy tất cả phim (bao gồm không hoạt động - admin)
    getAllMovies: async () => {
        try {
            const response = await api.get("/movies/all/include-inactive", {
                headers: getAuthHeader(),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Error fetching all movies");
        }
    },
};

export { apiMovies };