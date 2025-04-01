import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiMovies } from "../../apis/movieApi";
import { FaPlay, FaTicketAlt } from "react-icons/fa"; // Import ticket icon
import { Card, Button, Select, message, Divider } from "antd";

const { Option } = Select;

const MovieDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector(state => state.user);
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTheater, setSelectedTheater] = useState(null);
    const [selectedShowtime, setSelectedShowtime] = useState(null);

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
        
        const fetchShowtimes = async () => {
            try {
                const response = await apiMovies.getMovieShowtimes(id);
                console.log("Dữ liệu lịch chiếu từ API:", response);
                if (response.content && response.content.showtimes) {
                    setShowtimes(response.content.showtimes);
                }
            } catch (error) {
                console.error("Lỗi khi lấy lịch chiếu:", error.message);
            }
        };
        
        fetchMovieDetail();
        fetchShowtimes();
    }, [id]);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    
    const handleTheaterChange = (theaterId) => {
        setSelectedTheater(theaterId);
        setSelectedShowtime(null); // Reset selected showtime when theater changes
    };
    
    const handleShowtimeChange = (showtimeId) => {
        setSelectedShowtime(showtimeId);
    };
    
    const handleBooking = () => {
        if (!isAuthenticated) {
            message.warning("Please log in to book tickets");
            navigate("/login");
            return;
        }
        
        if (!selectedShowtime) {
            message.warning("Please select a showtime first");
            return;
        }
        
        navigate(`/booking/${selectedShowtime}`);
    };

    if (loading) {
        return <div className="w-full h-screen flex items-center justify-center">Đang tải...</div>;
    }

    if (error) {
        return <div className="w-full h-screen flex items-center justify-center">Lỗi: {error}</div>;
    }
    
    // Group showtimes by theater
    const theaters = showtimes.map(theater => ({
        id: theater.theaterId,
        name: theater.theaterName,
        location: theater.location,
        showtimes: theater.showtimes
    }));

    return (
        <div className="w-full min-h-screen bg-white py-8 px-4">
            {movie ? (
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Movie Poster */}
                        <div className="md:w-1/3">
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full rounded-lg shadow-lg object-cover"
                            />
                            
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={openModal}
                                    className="flex-1 flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <FaPlay className="mr-2" /> Watch Trailer
                                </button>
                            </div>
                        </div>
                        
                        {/* Movie Details */}
                        <div className="md:w-2/3">
                            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {movie.genre.map((genre, index) => (
                                    <span key={index} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-600">Director: <span className="font-medium text-black">{movie.director}</span></p>
                                    <p className="text-gray-600">Duration: <span className="font-medium text-black">{movie.duration} minutes</span></p>
                                    <p className="text-gray-600">Language: <span className="font-medium text-black">{movie.language}</span></p>
                                    <p className="text-gray-600">Rating: <span className="font-medium text-black">{movie.rating}/10</span></p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Release Date: <span className="font-medium text-black">{new Date(movie.releaseDate).toLocaleDateString()}</span></p>
                                    <p className="text-gray-600">End Date: <span className="font-medium text-black">{new Date(movie.endDate).toLocaleDateString()}</span></p>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2">Description</h2>
                                <p className="text-gray-800">{movie.description}</p>
                            </div>
                            
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2">Cast</h2>
                                <div className="flex flex-wrap gap-2">
                                    {movie.cast.map((actor, index) => (
                                        <span key={index} className="bg-blue-100 px-3 py-1 rounded-full text-blue-800">
                                            {actor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Showtimes and Booking */}
                    <Divider className="my-8" />
                    
                    <Card title="Book Tickets" className="mt-6">
                        {theaters.length > 0 ? (
                            <div>
                                <div className="mb-4">
                                    <label className="block mb-2 font-medium">Select Theater:</label>
                                    <Select 
                                        placeholder="Select a theater" 
                                        style={{ width: '100%' }}
                                        onChange={handleTheaterChange}
                                        value={selectedTheater}
                                    >
                                        {theaters.map(theater => (
                                            <Option key={theater.id} value={theater.id}>
                                                {theater.name} - {theater.location?.city}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                                
                                {selectedTheater && (
                                    <div className="mb-4">
                                        <label className="block mb-2 font-medium">Select Showtime:</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {theaters
                                                .find(t => t.id === selectedTheater)
                                                ?.showtimes.map(showtime => (
                                                    <Button 
                                                        key={showtime.id}
                                                        type={selectedShowtime === showtime.id ? "primary" : "default"}
                                                        onClick={() => handleShowtimeChange(showtime.id)}
                                                        className="text-center"
                                                    >
                                                        {new Date(showtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </Button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<FaTicketAlt className="mr-2" />}
                                        onClick={handleBooking}
                                        disabled={!selectedShowtime}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No showtimes available for this movie at the moment.
                            </div>
                        )}
                    </Card>
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