import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import DetailMovie from "../pages/DetailMovie/DetailMovie";
import BookingPage from "../pages/Booking/BookingPage";
import MyBookings from "../pages/User/MyBookings";
import BookingDetails from "../pages/User/BookingDetails";
import AdminPage from "../pages/AminPage/Admin"; // AdminPage là trang riêng
import UserManagement from "../pages/AminPage/UserManagement";
import MovieManagement from "../pages/AminPage/MovieManagement";
import SeatManagement from "../pages/AminPage/SeatManagement";
import TheaterManagement from "../pages/AminPage/TheaterManagement";
import ScreenManagement from "../pages/AminPage/ScreenManagement";
import ShowTimeManagement from "../pages/AminPage/ShowTimeManagement";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Home />, // Trang mặc định là Home
            },
            {
                path: "login",
                element: <Login />,
            },
            {
                path: "register",
                element: <Register />,
            },
            {
                path: "movie/:id",
                element: <DetailMovie />, // Route cho trang chi tiết phim
            },
            {
                path: "booking/:showtimeId",
                element: <BookingPage />, // Route cho trang đặt vé
            },
            {
                path: "user/bookings",
                element: <MyBookings />, // Route cho trang danh sách đặt vé của người dùng
            },
            {
                path: "user/bookings/:bookingId",
                element: <BookingDetails />, // Route cho trang chi tiết đặt vé
            },
        ],
    },
    {
        path: "/admin",
        element: <AdminPage />, // AdminPage là route cấp cao, không nằm trong App
        children: [
            {
                path: "users", // Đường dẫn tương đối: /admin/users
                element: <UserManagement />,
            },
            {
                path: "movies", // Đường dẫn tương đối: /admin/movies
                element: <MovieManagement />,
            },
            {
                path: "seats", // /admin/seats
                element: <SeatManagement />,
            },
            {
                path: "theaters", // /admin/theaters
                element: <TheaterManagement />,
            },
            {
                path: "screens", // /admin/screens
                element: <ScreenManagement />,
            },
            {
                path: "showtimes", // /admin/showtimes
                element: <ShowTimeManagement />,
            },
        ],
    },
]);

export default router;