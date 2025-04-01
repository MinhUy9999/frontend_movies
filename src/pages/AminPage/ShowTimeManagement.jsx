import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Select, message, InputNumber, DatePicker } from "antd";
import showtimeApi from "../../apis/showtimeApi"; // Import từ showtimeApi.js
import { apiMovies } from "../../apis/movieApi"; // Import để lấy danh sách phim
import { ScreenApi } from "../../apis/screenApi"; // Import để lấy danh sách màn hình
import dayjs from "dayjs";

const { Option } = Select;

const ShowtimeManagement = () => {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]); // Danh sách phim để chọn
    const [screens, setScreens] = useState([]); // Danh sách màn hình để chọn
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();

    useEffect(() => {
        fetchShowtimes();
        fetchMovies(); // Lấy danh sách phim
        fetchScreens(); // Lấy danh sách màn hình
    }, []);

    const fetchShowtimes = async () => {
        setLoading(true);
        try {
            const response = await showtimeApi.getShowtimes();
            console.log("Phản hồi từ API getShowtimes:", response);
            if (response.content) {
                setShowtimes(response.content.showtimes); // Giả sử API trả về mảng showtimes trong content
            } else {
                console.error("Không tìm thấy dữ liệu showtimes:", response);
                setShowtimes([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách lịch chiếu");
            console.error("Lỗi fetchShowtimes:", error);
            setShowtimes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMovies = async () => {
        try {
            const response = await apiMovies.getAllMovies();
            console.log("Phản hồi từ API getAllMovies:", response);
            if (response.content && response.content.movies) {
                setMovies(response.content.movies);
            } else {
                console.error("Không tìm thấy dữ liệu movies:", response);
                setMovies([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách phim");
            console.error("Lỗi fetchMovies:", error);
            setMovies([]);
        }
    };

    const fetchScreens = async () => {
        try {
            const response = await ScreenApi.getAllScreens();
            console.log("Phản hồi từ API getAllScreens:", response);
            if (response.content) {
                setScreens(response.content.screens);
            } else {
                console.error("Không tìm thấy dữ liệu screens:", response);
                setScreens([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách màn hình");
            console.error("Lỗi fetchScreens:", error);
            setScreens([]);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa lịch chiếu này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa showtime với ID:", id);
                    const response = await showtimeApi.deleteShowtime(id);
                    console.log("Phản hồi từ API deleteShowtime:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa lịch chiếu thành công");
                        await fetchShowtimes();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error);
                    message.error(error.message || "Lỗi khi xóa lịch chiếu");
                }
            },
            onCancel() {
                console.log("Hủy xóa showtime với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (showtime) => {
        setSelectedShowtime(showtime);
        form.setFieldsValue({
            movieId: showtime.movieId || "",
            screenId: showtime.screenId || "",
            startTime: showtime.startTime ? dayjs(showtime.startTime) : null,
            endTime: showtime.endTime ? dayjs(showtime.endTime) : null,
            priceStandard: showtime.price?.standard || 0,
            pricePremium: showtime.price?.premium || 0,
            priceVip: showtime.price?.vip || 0,
            isActive: showtime.isActive || false,
        });
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const showtimeData = {
                movieId: values.movieId,
                screenId: values.screenId,
                startTime: values.startTime ? values.startTime.toISOString() : null,
                endTime: values.endTime ? values.endTime.toISOString() : null,
                price: {
                    standard: values.priceStandard,
                    premium: values.pricePremium,
                    vip: values.priceVip,
                },
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (update):", showtimeData);
            const response = await showtimeApi.updateShowtime(selectedShowtime._id, showtimeData);
            console.log("Phản hồi từ API updateShowtime:", response);

            if (response && response.statusCode === 200) {
                message.success("Cập nhật lịch chiếu thành công");
                setIsModalVisible(false);
                await fetchShowtimes();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            message.error(error.message || "Lỗi khi cập nhật lịch chiếu");
        }
    };

    const handleCreate = async (values) => {
        try {
            const showtimeData = {
                movieId: values.movieId,
                screenId: values.screenId,
                startTime: values.startTime ? values.startTime.toISOString() : null,
                endTime: values.endTime ? values.endTime.toISOString() : null,
                price: {
                    standard: values.priceStandard,
                    premium: values.pricePremium,
                    vip: values.priceVip,
                },
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (create):", showtimeData);
            const response = await showtimeApi.createShowtime(showtimeData);
            console.log("Phản hồi từ API createShowtime:", response);

            if (response && response.statusCode === 201) {
                message.success("Tạo lịch chiếu thành công");
                setIsCreateModalVisible(false);
                createForm.resetFields();
                await fetchShowtimes();
            } else {
                message.error(`Tạo lịch chiếu thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo lịch chiếu:", error);
            message.error(error.message || "Lỗi khi tạo lịch chiếu");
        }
    };

    const showCreateModal = () => {
        setIsCreateModalVisible(true);
    };

    const columns = [
        {
            title: "Phim",
            dataIndex: "movieId",
            key: "movieId",
            render: (movieId) => {
                const movie = movies.find((m) => m._id === movieId);
                return movie ? movie.title : "N/A";
            },
        },
        {
            title: "Màn hình",
            dataIndex: "screenId",
            key: "screenId",
            render: (screenId) => {
                const screen = screens.find((s) => s._id === screenId);
                return screen ? screen.name : "N/A";
            },
        },
        {
            title: "Thời gian bắt đầu",
            dataIndex: "startTime",
            key: "startTime",
            render: (startTime) => (startTime ? new Date(startTime).toLocaleString() : "N/A"),
        },
        {
            title: "Thời gian kết thúc",
            dataIndex: "endTime",
            key: "endTime",
            render: (endTime) => (endTime ? new Date(endTime).toLocaleString() : "N/A"),
        },
        {
            title: "Giá vé (Standard)",
            dataIndex: ["price", "standard"],
            key: "priceStandard",
            render: (price) => (price ? `${price} VND` : "N/A"),
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            key: "isActive",
            render: (isActive) => (isActive ? "Hoạt động" : "Không hoạt động"),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <span>
                    <Button type="link" onClick={() => handleEdit(record)}>
                        Sửa
                    </Button>
                    <Button type="link" danger onClick={() => handleDelete(record._id)}>
                        Xóa
                    </Button>
                </span>
            ),
        },
    ];

    return (
        <div>
            <h2>Quản lý lịch chiếu</h2>
            <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
                Thêm lịch chiếu mới
            </Button>
            <Table
                columns={columns}
                dataSource={showtimes}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa lịch chiếu"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="movieId" label="Phim" rules={[{ required: true, message: "Vui lòng chọn phim!" }]}>
                        <Select placeholder="Chọn phim">
                            {movies.map((movie) => (
                                <Option key={movie._id} value={movie._id}>
                                    {movie.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="screenId" label="Màn hình" rules={[{ required: true, message: "Vui lòng chọn màn hình!" }]}>
                        <Select placeholder="Chọn màn hình">
                            {screens.map((screen) => (
                                <Option key={screen._id} value={screen._id}>
                                    {screen.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="startTime" label="Thời gian bắt đầu" rules={[{ required: true, message: "Vui lòng chọn thời gian bắt đầu!" }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endTime" label="Thời gian kết thúc" rules={[{ required: true, message: "Vui lòng chọn thời gian kết thúc!" }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="priceStandard" label="Giá vé Standard (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé standard!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="pricePremium" label="Giá vé Premium (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé premium!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="priceVip" label="Giá vé VIP (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé VIP!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
                        <Select>
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Cập nhật
                        </Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setIsModalVisible(false)}>
                            Hủy
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            {/* Modal tạo mới */}
            <Modal
                title="Tạo lịch chiếu mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="movieId" label="Phim" rules={[{ required: true, message: "Vui lòng chọn phim!" }]}>
                        <Select placeholder="Chọn phim">
                            {movies.map((movie) => (
                                <Option key={movie._id} value={movie._id}>
                                    {movie.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="screenId" label="Màn hình" rules={[{ required: true, message: "Vui lòng chọn màn hình!" }]}>
                        <Select placeholder="Chọn màn hình">
                            {screens.map((screen) => (
                                <Option key={screen._id} value={screen._id}>
                                    {screen.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="startTime" label="Thời gian bắt đầu" rules={[{ required: true, message: "Vui lòng chọn thời gian bắt đầu!" }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endTime" label="Thời gian kết thúc" rules={[{ required: true, message: "Vui lòng chọn thời gian kết thúc!" }]}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="priceStandard" label="Giá vé Standard (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé standard!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="pricePremium" label="Giá vé Premium (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé premium!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="priceVip" label="Giá vé VIP (VND)" rules={[{ required: true, message: "Vui lòng nhập giá vé VIP!" }]}>
                        <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái" initialValue={true} rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
                        <Select>
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Tạo mới
                        </Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setIsCreateModalVisible(false)}>
                            Hủy
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ShowtimeManagement;