import { useState, useEffect } from "react";
import axios from "axios";

const Footer = () => {
    const [movies, setMovies] = useState([]);
    const BASE_URL = "http://localhost:5001"; // Domain của backend

    useEffect(() => {
        axios.get(`${BASE_URL}/api/movies/upcoming`)
            .then((response) => {
                console.log("API Response:", response.data);
                setMovies(response.data.content.movies || []);
            })
            .catch((error) => {
                console.error("Lỗi khi lấy phim:", error);
            });
    }, []);

    return (
        <div>
            <h3>Footer - Danh sách phim</h3>
            {movies.length > 0 ? (
                <ul>
                    {movies.map((movie) => (
                        <li key={movie._id}>
                            <div>
                                <strong>Tiêu đề:</strong> {movie.title}<br />
                                <strong>Mô tả:</strong> {movie.description}<br />
                                <strong>Thời lượng:</strong> {movie.duration} phút<br />
                                <strong>Thể loại:</strong> {movie.genre.join(", ")}<br />
                                <strong>Ngôn ngữ:</strong> {movie.language}<br />
                                <strong>Ngày phát hành:</strong> {new Date(movie.releaseDate).toLocaleDateString()}<br />
                                <strong>Ngày kết thúc:</strong> {new Date(movie.endDate).toLocaleDateString()}<br />
                                <strong>Đạo diễn:</strong> {movie.director}<br />
                                <strong>Diễn viên:</strong> {movie.cast.length > 0 ? movie.cast.join(", ") : "Chưa có"}<br />
                                <strong>Điểm đánh giá:</strong> {movie.rating}<br />
                                <strong>Poster:</strong>
                                <img
                                    src={`${BASE_URL}${movie.posterUrl}`}
                                    alt={movie.title}
                                    style={{ maxWidth: "200px" }}
                                    onError={() => console.error(`Error loading poster: ${movie.posterUrl}`)}
                                /><br />
                                <strong>Trailer:</strong>
                                <video
                                    controls
                                    width="300"
                                    src={`${BASE_URL}${movie.trailerUrl}`}
                                    onError={() => console.error(`Error loading trailer: ${movie.trailerUrl}`)}
                                /><br />
                                <strong>Trạng thái:</strong> {movie.isActive ? "Hoạt động" : "Không hoạt động"}<br />
                                <strong>ID:</strong> {movie._id}<br />
                                <strong>Ngày tạo:</strong> {new Date(movie.createdAt).toLocaleString()}<br />
                                <strong>Ngày cập nhật:</strong> {new Date(movie.updatedAt).toLocaleString()}<br />
                            </div>
                            <hr />
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Không có phim nào để hiển thị.</p>
            )}
        </div>
    );
};

export default Footer;