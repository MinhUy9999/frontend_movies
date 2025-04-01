import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../index.css";
import { apiMovies } from "../apis/movieApi";

const Banner = () => {
    const [movies, setMovies] = useState([]);
    const [trailerUrl, setTrailerUrl] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const swiperRef = useRef(null); // Tham chiếu đến Swiper

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await apiMovies.getActiveMovies();
                setMovies(response.content.movies);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách phim:", error.message);
            }
        };
        fetchMovies();
    }, []);

    const openTrailer = (url) => {
        setTrailerUrl(url); // ✅ Sử dụng trực tiếp Cloudinary URL
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setTrailerUrl("");
        setIsModalOpen(false);
    };

    return (
        <div className="w-full h-[500px] relative">
            {/* Swiper */}
            <Swiper
                ref={swiperRef}
                modules={[Navigation, Pagination, Autoplay]}
                navigation={false} // ❌ Tắt mặc định để tự tạo nút
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                speed={1000}
                loop={true}
                className="w-full h-full"
            >
                {movies.length > 0 ? (
                    movies.map((movie) => (
                        <SwiperSlide key={movie._id} className="relative">
                            <img
                                src={movie.posterUrl} // ✅ Hiển thị ảnh từ Cloudinary
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = "/fallback-image.jpg"; }}
                            />
                            <div className="absolute bottom-10 left-10 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-[400px]">
                                <h2 className="text-2xl font-bold">{movie.title}</h2>
                                <p className="mt-2">{movie.description}</p>
                                <button
                                    onClick={() => openTrailer(movie.trailerUrl)}
                                    className="mt-2 bg-red-600 px-4 py-2 rounded-full text-white hover:bg-red-800 transition"
                                >
                                    Xem Trailer
                                </button>
                            </div>
                        </SwiperSlide>
                    ))
                ) : (
                    <div className="text-center text-white text-lg">Đang tải dữ liệu...</div>
                )}
            </Swiper>

            {/* Nút điều hướng với z-index cao */}
            <button
                onClick={() => swiperRef.current.swiper.slidePrev()}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-red-600 bg-opacity-75 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl hover:bg-red-800 transition shadow-lg z-50"
            >
                ❮
            </button>
            <button
                onClick={() => swiperRef.current.swiper.slideNext()}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-600 bg-opacity-75 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl hover:bg-red-800 transition shadow-lg z-50"
            >
                ❯
            </button>

            {/* Modal Trailer */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 relative w-[90%] max-w-2xl">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-gray-600 hover:text-red-600 text-3xl"
                        >
                            &times;
                        </button>
                        <div className="aspect-w-16 aspect-h-9">
                            <video
                                controls
                                className="w-full h-[315px] md:h-[400px]"
                                src={trailerUrl} // ✅ Phát video từ Cloudinary
                                onError={(e) => { e.target.src = "/fallback-video.mp4"; }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banner;
