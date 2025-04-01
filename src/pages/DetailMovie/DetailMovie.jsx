import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiMovies } from "../../apis/movieApi";
import { FaPlay } from "react-icons/fa"; // Import biểu tượng play từ react-icons

const MovieDetail = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // State để quản lý modal

    useEffect(() => {
        const fetchMovieDetail = async () => {
            try {
                setLoading(true);
                const response = await apiMovies.getMovieById(id);
                console.log("Dữ liệu từ API getMovieById:", response);
                setMovie(response.content.movie);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết phim:", error.message);
                setError(error.message || "Không thể tải chi tiết phim");
                setLoading(false);
            }
        };
        fetchMovieDetail();
    }, [id]);

    // Hàm mở modal
    const openModal = () => {
        setIsModalOpen(true);
    };

    // Hàm đóng modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (error) {
        return <div className="w-full h-screen flex items-center justify-center">Lỗi: {error}</div>;
    }

    return (
        <div className="w-full min-h-screen bg-white py-8 px-4">
            {movie ? (
                <div className="max-w-4xl mx-auto ">
                    <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
                    <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-[500px] object-cover rounded-lg mb-4"
                    />
                    <div className="text-lg space-y-2">
                        <p>
                            <span className="font-bold">Mô tả:</span> {movie.description}
                        </p>
                        <p>
                            <span className="font-bold">Thời lượng:</span> {movie.duration} phút
                        </p>
                        <p>
                            <span className="font-bold">Thể loại:</span> {movie.genre.join(", ")}
                        </p>
                        <p>
                            <span className="font-bold">Ngôn ngữ:</span> {movie.language}
                        </p>
                        <p>
                            <span className="font-bold">Ngày phát hành:</span>{" "}
                            {new Date(movie.releaseDate).toLocaleDateString()}
                        </p>
                        <p>
                            <span className="font-bold">Ngày kết thúc:</span>{" "}
                            {new Date(movie.endDate).toLocaleDateString()}
                        </p>
                        <p>
                            <span className="font-bold">Đạo diễn:</span> {movie.director}
                        </p>
                        <p>
                            <span className="font-bold">Diễn viên:</span> {movie.cast.join(", ")}
                        </p>
                        <p>
                            <span className="font-bold">Điểm đánh giá:</span> {movie.rating}
                        </p>
                        <p>
                            <span className="font-bold">Trailer:</span>{" "}
                            <button
                                onClick={openModal}
                                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                                <FaPlay className="mr-2" /> Xem trailer
                            </button>
                        </p>
                        <p>
                            <span className="font-bold">Trạng thái:</span>{" "}
                            {movie.isActive ? "Đang hoạt động" : "Không hoạt động"}
                        </p>
                        <p>
                            <span className="font-bold">Ngày tạo:</span>{" "}
                            {new Date(movie.createdAt).toLocaleString()}
                        </p>
                        <p>
                            <span className="font-bold">Ngày cập nhật:</span>{" "}
                            {new Date(movie.updatedAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center">Không tìm thấy thông tin phim</div>
            )}

            {/* Modal hiển thị trailer */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Trailer: {movie.title}</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <video
                            src={movie.trailerUrl}
                            controls
                            autoPlay
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieDetail;