import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/userSlice";
import logo from "../assets/logocinema.png";
import { FaBars, FaSearch, FaUserCircle, FaTicketAlt } from "react-icons/fa";

const Header = () => {
    const [activeMenu, setActiveMenu] = useState("");
    const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const movieTimeout = useRef(null);
    const userTimeout = useRef(null);

    const { username, role, isAuthenticated } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleMouseEnterMovie = () => {
        clearTimeout(movieTimeout.current);
        setIsMovieDropdownOpen(true);
    };

    const handleMouseLeaveMovie = () => {
        movieTimeout.current = setTimeout(() => {
            setIsMovieDropdownOpen(false);
        }, 500);
    };

    const handleMouseEnterUser = () => {
        clearTimeout(userTimeout.current);
        setIsUserDropdownOpen(true);
    };

    const handleMouseLeaveUser = () => {
        userTimeout.current = setTimeout(() => {
            setIsUserDropdownOpen(false);
        }, 500);
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        dispatch(logout());
        navigate("/");
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-gray-800 bg-opacity-90 shadow-md" : "bg-gray-800"
                }`}
        >
            <div className="container mx-auto px-4 flex items-center justify-between py-3">
                <Link to="/">
                    <img src={logo} alt="logo" width={120} className="md:w-[100px] zoom-animation" />
                </Link>
                <button
                    className="text-white text-3xl md:hidden"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <FaBars />
                </button>
                <nav className="hidden md:flex space-x-6 text-white text-lg">
                    <div
                        className="relative cursor-pointer"
                        onMouseEnter={handleMouseEnterMovie}
                        onMouseLeave={handleMouseLeaveMovie}
                    >
                        <span className="relative group hover:text-yellow-400">
                            Phim
                            <span
                                className={`absolute left-0 bottom-0 h-[3px] bg-yellow-400 w-0 group-hover:w-full transition-all duration-300 ${activeMenu === "phim" ? "w-full" : ""
                                    }`}
                            ></span>
                        </span>
                        {isMovieDropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg w-40 z-50">
                                <ul className="py-2">
                                    <li className="px-4 py-2 hover:bg-gray-700">
                                        <Link to="/" className="block w-full">Phim đang chiếu</Link>
                                    </li>
                                    <li className="px-4 py-2 hover:bg-gray-700">
                                        <Link to="/" className="block w-full">Phim sắp chiếu</Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <span
                        className="relative group hover:text-yellow-400 cursor-pointer"
                        onClick={() => setActiveMenu("rap")}
                    >
                        Rạp
                    </span>
                    
                    {isAuthenticated && (
                        <Link to="/user/bookings" className="relative group hover:text-yellow-400">
                            <span className="flex items-center">
                                <FaTicketAlt className="mr-1" /> Vé của tôi
                            </span>
                        </Link>
                    )}
                </nav>
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-gray-900 text-white md:hidden flex flex-col items-center py-4 space-y-4 z-50">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-yellow-400">
                            Phim
                        </Link>
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-yellow-400">
                            Rạp
                        </Link>
                        {isAuthenticated && (
                            <Link to="/user/bookings" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-yellow-400">
                                Vé của tôi
                            </Link>
                        )}
                        {isAuthenticated ? (
                            <>
                                {role === "admin" && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="hover:text-yellow-400"
                                    >
                                        Admin Page
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="hover:text-yellow-400"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="hover:text-yellow-400"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="hover:text-yellow-400"
                                >
                                    Đăng ký
                                </Link>
                            </>
                        )}
                    </div>
                )}
                <div className="flex items-center space-x-4">
                    <button
                        className="cursor-pointer p-2 rounded-full bg-gray-800 text-white hover:bg-yellow-500 hover:text-black transition-all duration-300"
                        onClick={() => setIsSearchModalOpen(true)}
                    >
                        <FaSearch className="text-xl" />
                    </button>
                    <div
                        className="relative"
                        onMouseEnter={handleMouseEnterUser}
                        onMouseLeave={handleMouseLeaveUser}
                    >
                        <div className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer active:scale-95 bg-gray-800 text-white transition-all duration-300 hover:bg-yellow-500 hover:text-black">
                            <FaUserCircle className="text-2xl" />
                        </div>
                        {isUserDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg w-40 z-50">
                                <ul className="py-2">
                                    {isAuthenticated ? (
                                        <>
                                            <li className="px-4 py-2 text-center">{username}</li>
                                            <li className="px-4 py-2 hover:bg-gray-700">
                                                <Link to="/user/bookings" className="block w-full">
                                                    Vé của tôi
                                                </Link>
                                            </li>
                                            {role === "admin" && (
                                                <li className="px-4 py-2 hover:bg-gray-700">
                                                    <Link to="/admin" className="block w-full">
                                                        Admin Page
                                                    </Link>
                                                </li>
                                            )}
                                            <li
                                                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                                onClick={handleLogout}
                                            >
                                                Đăng xuất
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li className="px-4 py-2 hover:bg-gray-700">
                                                <Link to="/register" className="block w-full">
                                                    Đăng ký
                                                </Link>
                                            </li>
                                            <li className="px-4 py-2 hover:bg-gray-700">
                                                <Link to="/login" className="block w-full">
                                                    Đăng nhập
                                                </Link>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isSearchModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white text-black p-6 rounded-lg w-[90%] max-w-md shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Tìm kiếm</h2>
                            <button
                                onClick={() => setIsSearchModalOpen(false)}
                                className="text-gray-600 hover:text-red-600 text-3xl"
                            >
                                ×
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Nhập tên phim..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;