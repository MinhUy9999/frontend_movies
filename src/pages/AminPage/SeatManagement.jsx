import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, InputNumber, DatePicker, Badge, Space, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiSeats } from "../../apis/seatApi";
import { ScreenApi } from "../../apis/screenApi";
import showtimeApi from "../../apis/showtimeApi";
import dayjs from "dayjs";

const { Option } = Select;
const { confirm } = Modal;

const SeatManagement = () => {
    const [seats, setSeats] = useState([]);
    const [screens, setScreens] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        screenId: undefined,
        status: undefined,
        searchText: ""
    });

    useEffect(() => {
        fetchSeats();
        fetchScreens();
        fetchShowtimes();
    }, [pagination.current, pagination.pageSize, filters]);

    const buildQueryString = () => {
        const params = new URLSearchParams();

        params.append('page', pagination.current.toString());
        params.append('limit', pagination.pageSize.toString());

        if (filters.screenId) {
            params.append('screenId', filters.screenId);
        }

        if (filters.status) {
            params.append('status', filters.status);
        }

        if (filters.searchText) {
            params.append('search', filters.searchText);
        }

        return params.toString();
    };

    const fetchSeats = async () => {
        setLoading(true);
        try {
            const queryString = buildQueryString();
            console.log("Fetching seats with query:", queryString);

            const response = await apiSeats.getAllSeats(queryString);
            console.log("Phản hồi từ API getAllSeats:", response);

            // Xử lý dữ liệu tùy thuộc vào cấu trúc phản hồi từ API
            let seatsData = [];
            let totalCount = 0;

            if (response.content?.seats) {
                seatsData = response.content.seats;
                totalCount = response.content.total || seatsData.length;
            } else if (Array.isArray(response.content)) {
                seatsData = response.content;
                totalCount = seatsData.length;
            } else if (Array.isArray(response)) {
                seatsData = response;
                totalCount = response.length;
            }

            console.log("Dữ liệu ghế đã xử lý:", seatsData);

            setSeats(seatsData);
            setPagination({
                ...pagination,
                total: totalCount
            });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách ghế:", error);
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
        confirm({
            title: "Xác nhận xóa",
            icon: <ExclamationCircleOutlined />,
            content: "Bạn có chắc chắn muốn xóa ghế này?",
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            async onOk() {
                try {
                    console.log("Bắt đầu xóa seat với ID:", id);
                    const response = await apiSeats.deleteSeat(id);
                    console.log("Phản hồi từ API deleteSeat:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa ghế thành công");
                        await fetchSeats();
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error);
                    message.error(error.message || "Lỗi khi xóa ghế");
                }
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
            isActive: seat.isActive !== false, // Mặc định là true nếu không có giá trị
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
        createForm.resetFields();
        createForm.setFieldsValue({
            isActive: true,
            status: 'available'
        });
        setIsCreateModalVisible(true);
    };

    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };

    const handleScreenFilter = (value) => {
        setFilters({ ...filters, screenId: value });
        setPagination({ ...pagination, current: 1 }); // Reset to first page when filtering
    };

    const handleStatusFilter = (value) => {
        setFilters({ ...filters, status: value });
        setPagination({ ...pagination, current: 1 }); // Reset to first page when filtering
    };

    const handleSearch = (value) => {
        setFilters({ ...filters, searchText: value });
        setPagination({ ...pagination, current: 1 }); // Reset to first page when searching
    };

    const resetFilters = () => {
        setFilters({
            screenId: undefined,
            status: undefined,
            searchText: ""
        });
        setPagination({ ...pagination, current: 1 });
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
            render: (seatType) => {
                switch (seatType) {
                    case "standard": return "Thường";
                    case "premium": return "Cao cấp";
                    case "vip": return "VIP";
                    default: return seatType;
                }
            },
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
            render: (status) => {
                switch (status) {
                    case "available":
                        return <Badge status="success" text="Còn trống" />;
                    case "reserved":
                        return <Badge status="warning" text="Đã đặt tạm" />;
                    case "booked":
                        return <Badge status="error" text="Đã đặt" />;
                    default:
                        return <Badge status="default" text={status} />;
                }
            },
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                    >
                        Sửa
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record._id)}
                        size="small"
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    // Form cho cả tạo mới và chỉnh sửa
    const renderSeatForm = (form, onFinish, title, submitText) => (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
        >
            <Form.Item name="screenId" label="Màn hình" rules={[{ required: true, message: "Vui lòng chọn màn hình!" }]}>
                <Select
                    placeholder="Chọn màn hình"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {screens.map((screen) => (
                        <Option key={screen._id} value={screen._id}>
                            {screen.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="row" label="Hàng" rules={[{ required: true, message: "Vui lòng chọn hàng!" }]}>
                <Select placeholder="Chọn hàng">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                        <Option key={row} value={row}>{row}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item name="seatNumber" label="Số ghế" rules={[{ required: true, message: "Vui lòng nhập số ghế!" }]}>
                <InputNumber min={1} max={20} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="seatType" label="Loại ghế" rules={[{ required: true, message: "Vui lòng chọn loại ghế!" }]}>
                <Select placeholder="Chọn loại ghế">
                    <Option value="standard">Thường</Option>
                    <Option value="premium">Cao cấp</Option>
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
                <Select
                    placeholder="Chọn lịch chiếu"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
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
                    <Option value="available">Còn trống</Option>
                    <Option value="reserved">Đã đặt tạm</Option>
                    <Option value="booked">Đã đặt</Option>
                </Select>
            </Form.Item>

            <Form.Item name="expiresAt" label="Thời gian hết hạn (nếu có)">
                <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Chọn thời gian hết hạn"
                />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        {submitText}
                    </Button>
                    <Button onClick={() => title === "Tạo ghế mới" ? setIsCreateModalVisible(false) : setIsModalVisible(false)}>
                        Hủy
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );

    return (
        <div className="p-6">
            <div className="mb-4">
                <Row justify="space-between" align="middle">
                    <Col>
                        <h2 className="text-2xl font-bold">Quản lý ghế</h2>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchSeats}
                            >
                                Làm mới
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={showCreateModal}
                            >
                                Thêm ghế mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            <div className="mb-4 bg-white p-4 rounded shadow">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Input.Search
                            placeholder="Tìm kiếm ghế..."
                            value={filters.searchText}
                            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                            onSearch={handleSearch}
                            style={{ width: '100%' }}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Lọc theo màn hình"
                            value={filters.screenId}
                            onChange={handleScreenFilter}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {screens.map((screen) => (
                                <Option key={screen._id} value={screen._id}>
                                    {screen.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Select
                            placeholder="Lọc theo trạng thái"
                            value={filters.status}
                            onChange={handleStatusFilter}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            <Option value="available">Còn trống</Option>
                            <Option value="reserved">Đã đặt tạm</Option>
                            <Option value="booked">Đã đặt</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Button onClick={resetFilters} style={{ width: '100%' }}>
                            Đặt lại bộ lọc
                        </Button>
                    </Col>
                </Row>
            </div>

            <Table
                columns={columns}
                dataSource={seats}
                rowKey="_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                className="bg-white rounded shadow"
                scroll={{ x: 'max-content' }}
            />

            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa ghế"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                {renderSeatForm(form, handleUpdate, "Chỉnh sửa ghế", "Cập nhật")}
            </Modal>

            {/* Modal tạo mới */}
            <Modal
                title="Tạo ghế mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                {renderSeatForm(createForm, handleCreate, "Tạo ghế mới", "Tạo mới")}
            </Modal>
        </div>
    );
};

export default SeatManagement;