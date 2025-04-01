import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, InputNumber } from "antd";
import { ScreenApi } from "../../apis/screenApi"; // Import từ screenApi.js
import { TheaterAPI } from "../../apis/theaterApi"; // Import để lấy danh sách rạp

const { Option } = Select;

const ScreenManagement = () => {
    const [screens, setScreens] = useState([]);
    const [theaters, setTheaters] = useState([]); // Danh sách rạp để chọn
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedScreen, setSelectedScreen] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();

    useEffect(() => {
        fetchScreens();
        fetchTheaters(); // Lấy danh sách rạp khi component mount
    }, []);

    const fetchScreens = async () => {
        setLoading(true);
        try {
            const response = await ScreenApi.getAllScreens();
            console.log("Phản hồi từ API getAllScreens:", response);
            if (response.content) {
                setScreens(response.content.screens); // Giả sử API trả về mảng screens trong content
            } else {
                console.error("Không tìm thấy dữ liệu screens:", response);
                setScreens([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách màn hình");
            console.error("Lỗi fetchScreens:", error);
            setScreens([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTheaters = async () => {
        try {
            const response = await TheaterAPI.getAllTheaters();
            console.log("Phản hồi từ API getAllTheaters:", response);
            if (response.content) {
                setTheaters(response.content.theaters); // Lưu danh sách rạp
            } else {
                console.error("Không tìm thấy dữ liệu theaters:", response);
                setTheaters([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách rạp phim");
            console.error("Lỗi fetchTheaters:", error);
            setTheaters([]);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa màn hình này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa screen với ID:", id);
                    const response = await ScreenApi.deleteScreen(id);
                    console.log("Phản hồi từ API deleteScreen:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa màn hình thành công");
                        await fetchScreens();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error);
                    message.error(error.message || "Lỗi khi xóa màn hình");
                }
            },
            onCancel() {
                console.log("Hủy xóa screen với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (screen) => {
        setSelectedScreen(screen);
        form.setFieldsValue({
            name: screen.name || "",
            theaterId: screen.theaterId || "",
            capacity: screen.capacity || 0,
            screenType: screen.screenType || "standard",
            isActive: screen.isActive || false,
        });
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const screenData = {
                name: values.name,
                theaterId: values.theaterId,
                capacity: values.capacity,
                screenType: values.screenType,
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (update):", screenData);
            const response = await ScreenApi.updateScreen(selectedScreen._id, screenData);
            console.log("Phản hồi từ API updateScreen:", response);

            if (response && response.statusCode === 200) {
                message.success("Cập nhật màn hình thành công");
                setIsModalVisible(false);
                await fetchScreens();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            message.error(error.message || "Lỗi khi cập nhật màn hình");
        }
    };

    const handleCreate = async (values) => {
        try {
            const screenData = {
                name: values.name,
                theaterId: values.theaterId,
                capacity: values.capacity,
                screenType: values.screenType,
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (create):", screenData);
            const response = await ScreenApi.createScreen(screenData);
            console.log("Phản hồi từ API createScreen:", response);

            if (response && response.statusCode === 201) {
                message.success("Tạo màn hình thành công");
                setIsCreateModalVisible(false);
                createForm.resetFields();
                await fetchScreens();
            } else {
                message.error(`Tạo màn hình thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo màn hình:", error);
            message.error(error.message || "Lỗi khi tạo màn hình");
        }
    };

    const showCreateModal = () => {
        setIsCreateModalVisible(true);
    };

    const columns = [
        {
            title: "Tên màn hình",
            dataIndex: "name",
            key: "name",
            render: (text) => text || "N/A",
        },
        {
            title: "Rạp chiếu",
            dataIndex: "theaterId",
            key: "theaterId",
            render: (theaterId) => {
                const theater = theaters.find((t) => t._id === theaterId);
                return theater ? theater.name : "N/A";
            },
        },
        {
            title: "Sức chứa",
            dataIndex: "capacity",
            key: "capacity",
            render: (capacity) => capacity || "N/A",
        },
        {
            title: "Loại màn hình",
            dataIndex: "screenType",
            key: "screenType",
            render: (screenType) => screenType || "N/A",
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
            <h2>Quản lý màn hình</h2>
            <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
                Thêm màn hình mới
            </Button>
            <Table
                columns={columns}
                dataSource={screens}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa màn hình"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="name" label="Tên màn hình" rules={[{ required: true, message: "Vui lòng nhập tên màn hình!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="theaterId" label="Rạp chiếu" rules={[{ required: true, message: "Vui lòng chọn rạp chiếu!" }]}>
                        <Select placeholder="Chọn rạp chiếu">
                            {theaters.map((theater) => (
                                <Option key={theater._id} value={theater._id}>
                                    {theater.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="screenType" label="Loại màn hình" rules={[{ required: true, message: "Vui lòng chọn loại màn hình!" }]}>
                        <Select placeholder="Chọn loại màn hình">
                            <Option value="standard">Standard</Option>
                            <Option value="imax">IMAX</Option>
                            <Option value="vip">VIP</Option>
                            <Option value="4dx">4DX</Option>
                        </Select>
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
                title="Tạo màn hình mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="name" label="Tên màn hình" rules={[{ required: true, message: "Vui lòng nhập tên màn hình!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="theaterId" label="Rạp chiếu" rules={[{ required: true, message: "Vui lòng chọn rạp chiếu!" }]}>
                        <Select placeholder="Chọn rạp chiếu">
                            {theaters.map((theater) => (
                                <Option key={theater._id} value={theater._id}>
                                    {theater.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="screenType" label="Loại màn hình" rules={[{ required: true, message: "Vui lòng chọn loại màn hình!" }]}>
                        <Select placeholder="Chọn loại màn hình">
                            <Option value="standard">Standard</Option>
                            <Option value="imax">IMAX</Option>
                            <Option value="vip">VIP</Option>
                            <Option value="4dx">4DX</Option>
                        </Select>
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

export default ScreenManagement;