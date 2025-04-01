import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { apiMovies } from "../../apis/movieApi";

const MoviesShowing = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const response = await apiMovies.getUpcomingMovies();
                setMovies(response.content.movies || []); // Giả sử response có content.movies
                setLoading(false);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách phim:", error.message);
                setError(error.message || "Không thể tải danh sách phim");
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (error) {
        return <div className="w-full h-screen flex items-center justify-center">Lỗi: {error}</div>;
    }

    return (
        <div className="w-full py-8">
            <Swiper
                modules={[Navigation, Autoplay]}
                navigation
                autoplay={{ delay: 3000 }}
                loop
                spaceBetween={40} // Tăng khoảng cách giữa các slide
                slidesPerView={5} // Mặc định 1 slide trên mobile
                breakpoints={{
                    320: { slidesPerView: 1, spaceBetween: 10 }, // 1 slide trên mobile
                    768: { slidesPerView: 2, spaceBetween: 30 }, // 2 slide trên tablet
                    1024: { slidesPerView: 2, spaceBetween: 40 }, // 2 slide trên desktop
                }}
                className="w-full h-[500px] md:h-[450px]" // Tăng chiều cao một chút
            >
                {movies.map((movie) => (
                    <SwiperSlide key={movie._id}>
                        <div className="w-[300px] h-[450px] mx-auto relative group cursor-pointer">
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Overlay */}
                            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 text-white p-2 text-center">
                                <h2 className="text-lg font-bold truncate">{movie.title}</h2>
                            </div>
                            {/* Hiệu ứng hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                <button className="bg-red-500 px-4 py-2 rounded-lg text-white mb-2 hover:bg-red-600">
                                    Mua vé
                                </button>
                                <button className="bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-600">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default MoviesShowing;