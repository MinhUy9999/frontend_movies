// src/routes/router.jsx (update)
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import DetailMovie from "../pages/DetailMovie/DetailMovie";
import BookingPage from "../pages/Booking/BookingPage";
import MyBookings from "../pages/User/MyBookings";
import BookingDetails from "../pages/User/BookingDetails";
import AdminPage from "../pages/AminPage/Admin"; // AdminPage is a separate page
import UserManagement from "../pages/AminPage/UserManagement";
import MovieManagement from "../pages/AminPage/MovieManagement";
import SeatManagement from "../pages/AminPage/SeatManagement";
import TheaterManagement from "../pages/AminPage/TheaterManagement";
import ScreenManagement from "../pages/AminPage/ScreenManagement";
import ShowTimeManagement from "../pages/AminPage/ShowTimeManagement";
import TheatersAndScreens from "../pages/AminPage/TheatersAndScreens"; // New component

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Home />, // Default home page
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
                element: <DetailMovie />, // Movie details page
            },
            {
                path: "booking/:showtimeId",
                element: <BookingPage />, // Booking page
            },
            {
                path: "user/bookings",
                element: <MyBookings />, // User bookings list
            },
            {
                path: "user/bookings/:bookingId",
                element: <BookingDetails />, // Booking details
            },
        ],
    },
    {
        path: "/admin",
        element: <AdminPage />, // Admin section as a top-level route
        children: [
            {
                path: "users", // Path: /admin/users
                element: <UserManagement />,
            },
            {
                path: "movies", // Path: /admin/movies
                element: <MovieManagement />,
            },
            {
                path: "seats", // Path: /admin/seats
                element: <SeatManagement />,
            },
            {
                path: "theaters", // Path: /admin/theaters
                element: <TheaterManagement />,
            },
            {
                path: "screens", // Path: /admin/screens
                element: <ScreenManagement />,
            },
            {
                path: "theaters-and-screens", // Path: /admin/theaters-and-screens
                element: <TheatersAndScreens />, // New comprehensive theater management UI
            },
            {
                path: "showtimes", // Path: /admin/showtimes
                element: <ShowTimeManagement />,
            },
        ],
    },
]);

export default router;