import { useSelector, useDispatch } from "react-redux"; // Thêm useDispatch
import { useState } from "react";
import { Button, Menu } from "antd";
import { Link, useNavigate, Outlet } from "react-router-dom";
import {
    UserOutlined,
    VideoCameraOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ShareAltOutlined,
    BankOutlined,
    DesktopOutlined,
    CalendarOutlined,
    MessageOutlined,
} from "@ant-design/icons";
import { logout } from "../../store/userSlice"; // Import logout action

const menuItems = [
    {
        key: "users",
        icon: <UserOutlined />,
        label: <Link to="/admin/users">Quản lý người dùng</Link>,
    },
    {
        key: "movies",
        icon: <VideoCameraOutlined />,
        label: <Link to="/admin/movies">Quản lý phim</Link>,
    },
    {
        key: "seats",
        icon: <ShareAltOutlined />, // Icon ghế
        label: <Link to="/admin/seats">Quản lý ghế</Link>,
    },
    {
        key: "theaters",
        icon: <BankOutlined />, // Icon rạp chiếu
        label: <Link to="/admin/theaters">Quản lý rạp chiếu</Link>,
    },
    {
        key: "screens",
        icon: <DesktopOutlined />, // Icon màn hình
        label: <Link to="/admin/screens">Quản lý màn hình</Link>,
    },
    {
        key: "showtimes",
        icon: <CalendarOutlined />, // Icon lịch chiếu
        label: <Link to="/admin/showtimes">Quản lý lịch chiếu</Link>,
    },
    {
        key: "chat",
        icon: <MessageOutlined />, // Icon tin nhắn
        label: <Link to="/admin/chat">Quản lý tin nhắn</Link>,
    },
];

const AdminPage = () => {
    const { username, role } = useSelector((state) => state.user);
    const dispatch = useDispatch(); // Thêm dispatch
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleMenuClick = ({ key }) => {
        navigate(`/admin/${key}`);
    };

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    const handleLogout = () => {
        dispatch(logout()); // Dispatch logout action
        localStorage.removeItem("accessToken"); // Xóa token
        localStorage.removeItem("user"); // Xóa thông tin user
        navigate("/login"); // Chuyển về trang login
    };

    if (role !== "admin") {
        return (
            <div className="text-center mt-20">Bạn không có quyền truy cập trang này!</div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <div style={{ width: collapsed ? 80 : 256, transition: "width 0.2s" }}>
                <Button
                    type="primary"
                    onClick={toggleCollapsed}
                    style={{ margin: "16px", width: "calc(100% - 32px)" }}
                >
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </Button>
                <Menu
                    mode="inline"
                    theme="dark"
                    inlineCollapsed={collapsed}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ height: "100%", borderRight: 0 }}
                />
            </div>
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">
                            Trang Quản Trị - Chào mừng, {username}!
                        </h1>
                        <Button
                            type="primary"
                            danger
                            onClick={handleLogout}
                            className="ml-4"
                        >
                            Đăng xuất
                        </Button>
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminPage;