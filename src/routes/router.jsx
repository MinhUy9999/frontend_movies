import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import DetailMovie from "../pages/DetailMovie/DetailMovie";
import BookingPage from "../pages/Booking/BookingPage";
import MyBookings from "../pages/User/MyBookings";
import BookingDetails from "../pages/User/BookingDetails";
import AdminPage from "../pages/AminPage/Admin"; 
import UserManagement from "../pages/AminPage/UserManagement";
import MovieManagement from "../pages/AminPage/MovieManagement";
import SeatManagement from "../pages/AminPage/SeatManagement";
import TheaterManagement from "../pages/AminPage/TheaterManagement";
import ScreenManagement from "../pages/AminPage/ScreenManagement";
import ShowTimeManagement from "../pages/AminPage/ShowTimeManagement";
import TheatersAndScreens from "../pages/AminPage/TheatersAndScreens"; 
import AdminChat from "../pages/AminPage/AdminChat";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Home />, 
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
                element: <DetailMovie />, 
            },
            {
                path: "booking/:showtimeId",
                element: <BookingPage />,
            },
            {
                path: "user/bookings",
                element: <MyBookings />, 
            },
            {
                path: "user/bookings/:bookingId",
                element: <BookingDetails />,
            },
        ],
    },
    {
        path: "/admin",
        element: <AdminPage />, 
        children: [
            {
                path: "users",
                element: <UserManagement />,
            },
            {
                path: "movies",
                element: <MovieManagement />,
            },
            {
                path: "seats",
                element: <SeatManagement />,
            },
            {
                path: "theaters",
                element: <TheaterManagement />,
            },
            {
                path: "screens", 
                element: <ScreenManagement />,
            },
            {
                path: "theaters-and-screens", 
                element: <TheatersAndScreens />,
            },
            {
                path: "showtimes", 
                element: <ShowTimeManagement />,
            },
            {
                path: "/admin",
                element: <AdminPage />,
                children: [
                    {
                        path: "chat",
                        element: <AdminChat />,
                    },
                ],
            },
        ],
    },
]);

export default router;