import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, InputNumber, DatePicker } from "antd";
import { apiSeats } from "../../apis/seatApi"; // Import từ seatApi.js
import { ScreenApi } from "../../apis/screenApi"; // Import để lấy danh sách màn hình
import showtimeApi from "../../apis/showtimeApi"; // Import để lấy danh sách lịch chiếu
import dayjs from "dayjs";

const { Option } = Select;

const SeatManagement = () => {
    const [seats, setSeats] = useState([]);
    const [screens, setScreens] = useState([]); // Danh sách màn hình để chọn
    const [showtimes, setShowtimes] = useState([]); // Danh sách lịch chiếu để chọn
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();

    useEffect(() => {
        fetchSeats();
        fetchScreens(); // Lấy danh sách màn hình
        fetchShowtimes(); // Lấy danh sách lịch chiếu
    }, []);

    const fetchSeats = async () => {
        setLoading(true);
        try {
            const response = await apiSeats.getAllSeats();
            console.log("Full Seats Response:", response);
    
            const seatsData = response.content || response;
            console.log("Processed Seats Data:", seatsData);
            
            setSeats(seatsData);
        } catch (error) {
            console.error("Error fetching seats:", error);
            message.error(error.message || "Lỗi khi lấy danh sách ghế");
            setSeats([]);
        } finally {
            setLoading(false);
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

    const fetchShowtimes = async () => {
        try {
            const response = await showtimeApi.getShowtimes();
            console.log("Phản hồi từ API getShowtimes:", response);
            if (response.content) {
                setShowtimes(response.content.showtimes);
            } else {
                console.error("Không tìm thấy dữ liệu showtimes:", response);
                setShowtimes([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách lịch chiếu");
            console.error("Lỗi fetchShowtimes:", error);
            setShowtimes([]);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa ghế này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa seat với ID:", id);
                    const response = await apiSeats.deleteSeat(id);
                    console.log("Phản hồi từ API deleteSeat:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa ghế thành công");
                        await fetchSeats();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error);
                    message.error(error.message || "Lỗi khi xóa ghế");
                }
            },
            onCancel() {
                console.log("Hủy xóa seat với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (seat) => {
        setSelectedSeat(seat);
        form.setFieldsValue({
            screenId: seat.screenId || "",
            row: seat.row || "",
            seatNumber: seat.seatNumber || 0,
            seatType: seat.seatType || "standard",
            isActive: seat.isActive || false,
            showtimeId: seat.showtimeId || "",
            bookingId: seat.bookingId || "",
            status: seat.status || "available",
            expiresAt: seat.expiresAt ? dayjs(seat.expiresAt) : null,
        });
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const seatData = {
                screenId: values.screenId,
                row: values.row,
                seatNumber: values.seatNumber,
                seatType: values.seatType,
                isActive: values.isActive,
                showtimeId: values.showtimeId,
                bookingId: values.bookingId || undefined, // Optional field
                status: values.status,
                expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined, // Optional field
            };

            console.log("Dữ liệu gửi đi (update):", seatData);
            const response = await apiSeats.updateSeat(selectedSeat._id, seatData);
            console.log("Phản hồi từ API updateSeat:", response);

            if (response && response.statusCode === 200) {
                message.success("Cập nhật ghế thành công");
                setIsModalVisible(false);
                await fetchSeats();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            message.error(error.message || "Lỗi khi cập nhật ghế");
        }
    };

    const handleCreate = async (values) => {
        try {
            const seatData = {
                screenId: values.screenId,
                row: values.row,
                seatNumber: values.seatNumber,
                seatType: values.seatType,
                isActive: values.isActive,
                showtimeId: values.showtimeId,
                bookingId: values.bookingId || undefined, // Optional field
                status: values.status,
                expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined, // Optional field
            };

            console.log("Dữ liệu gửi đi (create):", seatData);
            const response = await apiSeats.createSeat(seatData);
            console.log("Phản hồi từ API createSeat:", response);

            if (response && response.statusCode === 201) {
                message.success("Tạo ghế thành công");
                setIsCreateModalVisible(false);
                createForm.resetFields();
                await fetchSeats();
            } else {
                message.error(`Tạo ghế thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo ghế:", error);
            message.error(error.message || "Lỗi khi tạo ghế");
        }
    };

    const showCreateModal = () => {
        setIsCreateModalVisible(true);
    };

    const columns = [
        {
            title: "Màn hình",
            dataIndex: "screenId",
            key: "screenId",
            render: (screenId) => {
                const screen = screens.find(s => s._id === screenId);
                return screen ? screen.name : screenId;
            },
        },
        {
            title: "Hàng",
            dataIndex: "row",
            key: "row",
        },
        {
            title: "Số ghế",
            dataIndex: "seatNumber",
            key: "seatNumber",
        },
        {
            title: "Loại ghế",
            dataIndex: "seatType",
            key: "seatType",
        },
        {
            title: "Lịch chiếu",
            dataIndex: "showtimeId",
            key: "showtimeId",
            render: (showtimeId) => {
                const showtime = showtimes.find(st => st._id === showtimeId);
                return showtime 
                    ? new Date(showtime.startTime).toLocaleString() 
                    : showtimeId;
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
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
            <h2>Quản lý ghế</h2>
            <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
                Thêm ghế mới
            </Button>
            <Table
                columns={columns}
                dataSource={seats}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa ghế"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="screenId" label="Màn hình" rules={[{ required: true, message: "Vui lòng chọn màn hình!" }]}>
                        <Select placeholder="Chọn màn hình">
                            {screens.map((screen) => (
                                <Option key={screen._id} value={screen._id}>
                                    {screen.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="row" label="Hàng" rules={[{ required: true, message: "Vui lòng nhập hàng!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="seatNumber" label="Số ghế" rules={[{ required: true, message: "Vui lòng nhập số ghế!" }]}>
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="seatType" label="Loại ghế" rules={[{ required: true, message: "Vui lòng chọn loại ghế!" }]}>
                        <Select placeholder="Chọn loại ghế">
                            <Option value="standard">Standard</Option>
                            <Option value="premium">Premium</Option>
                            <Option value="vip">VIP</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái hoạt động" rules={[{ required: true, message: "Vui lòng chọn trạng thái hoạt động!" }]}>
                        <Select>
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="showtimeId" label="Lịch chiếu" rules={[{ required: true, message: "Vui lòng chọn lịch chiếu!" }]}>
                        <Select placeholder="Chọn lịch chiếu">
                            {showtimes.map((showtime) => (
                                <Option key={showtime._id} value={showtime._id}>
                                    {new Date(showtime.startTime).toLocaleString()}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="bookingId" label="ID Đặt vé (nếu có)">
                        <Input placeholder="Nhập ID đặt vé (tùy chọn)" />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái ghế" rules={[{ required: true, message: "Vui lòng chọn trạng thái ghế!" }]}>
                        <Select placeholder="Chọn trạng thái ghế">
                            <Option value="reserved">Đã đặt tạm</Option>
                            <Option value="booked">Đã đặt</Option>
                            <Option value="available">Còn trống</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="expiresAt" label="Thời gian hết hạn (nếu có)">
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
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
                title="Tạo ghế mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="screenId" label="Màn hình" rules={[{ required: true, message: "Vui lòng chọn màn hình!" }]}>
                        <Select placeholder="Chọn màn hình">
                            {screens.map((screen) => (
                                <Option key={screen._id} value={screen._id}>
                                    {screen.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="row" label="Hàng" rules={[{ required: true, message: "Vui lòng nhập hàng!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="seatNumber" label="Số ghế" rules={[{ required: true, message: "Vui lòng nhập số ghế!" }]}>
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="seatType" label="Loại ghế" rules={[{ required: true, message: "Vui lòng chọn loại ghế!" }]}>
                        <Select placeholder="Chọn loại ghế">
                            <Option value="standard">Standard</Option>
                            <Option value="premium">Premium</Option>
                            <Option value="vip">VIP</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái hoạt động" initialValue={true} rules={[{ required: true, message: "Vui lòng chọn trạng thái hoạt động!" }]}>
                        <Select>
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="showtimeId" label="Lịch chiếu" rules={[{ required: true, message: "Vui lòng chọn lịch chiếu!" }]}>
                        <Select placeholder="Chọn lịch chiếu">
                            {showtimes.map((showtime) => (
                                <Option key={showtime._id} value={showtime._id}>
                                    {new Date(showtime.startTime).toLocaleString()}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="bookingId" label="ID Đặt vé (nếu có)">
                        <Input placeholder="Nhập ID đặt vé (tùy chọn)" />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái ghế" initialValue="available" rules={[{ required: true, message: "Vui lòng chọn trạng thái ghế!" }]}>
                        <Select placeholder="Chọn trạng thái ghế">
                            <Option value="reserved">Đã đặt tạm</Option>
                            <Option value="booked">Đã đặt</Option>
                            <Option value="available">Còn trống</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="expiresAt" label="Thời gian hết hạn (nếu có)">
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
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

export default SeatManagement;