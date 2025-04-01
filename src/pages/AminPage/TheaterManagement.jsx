import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message } from "antd";
import { TheaterAPI } from "../../apis/theaterApi"; // Import từ theaterApi.js

const { Option } = Select;


const TheaterManagement = () => {
    const [theaters, setTheaters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedTheater, setSelectedTheater] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();

    useEffect(() => {
        fetchTheaters();
    }, []);

    const fetchTheaters = async () => {
        setLoading(true);
        try {
            const response = await TheaterAPI.getAllTheaters();
            console.log("Phản hồi từ API getAllTheaters:", response);
            if (response.content) {
                setTheaters(response.content.theaters); // Giả sử API trả về mảng theaters trong content
            } else {
                console.error("Không tìm thấy dữ liệu theaters:", response);
                setTheaters([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách rạp phim");
            console.error("Lỗi fetchTheaters:", error);
            setTheaters([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa rạp phim này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa theater với ID:", id);
                    const response = await TheaterAPI.deleteTheater(id);
                    console.log("Phản hồi từ API deleteTheater:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa rạp phim thành công");
                        await fetchTheaters();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error);
                    message.error(error.message || "Lỗi khi xóa rạp phim");
                }
            },
            onCancel() {
                console.log("Hủy xóa theater với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (theater) => {
        setSelectedTheater(theater);
        form.setFieldsValue({
            name: theater.name || "",
            address: theater.location?.address || "",
            city: theater.location?.city || "",
            state: theater.location?.state || "",
            country: theater.location?.country || "",
            facilities: theater.facilities || [],
            isActive: theater.isActive || false,
        });
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const theaterData = {
                name: values.name,
                location: {
                    address: values.address,
                    city: values.city,
                    state: values.state,
                    country: values.country,
                },
                facilities: values.facilities,
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (update):", theaterData);
            const response = await TheaterAPI.updateTheater(selectedTheater._id, theaterData);
            console.log("Phản hồi từ API updateTheater:", response);

            if (response && response.statusCode === 200) {
                message.success("Cập nhật rạp phim thành công");
                setIsModalVisible(false);
                await fetchTheaters();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            message.error(error.message || "Lỗi khi cập nhật rạp phim");
        }
    };

    const handleCreate = async (values) => {
        try {
            const theaterData = {
                name: values.name,
                location: {
                    address: values.address,
                    city: values.city,
                    state: values.state,
                    country: values.country,
                },
                facilities: values.facilities,
                isActive: values.isActive,
            };

            console.log("Dữ liệu gửi đi (create):", theaterData);
            const response = await TheaterAPI.createTheater(theaterData);
            console.log("Phản hồi từ API createTheater:", response);

            if (response && response.statusCode === 201) {
                message.success("Tạo rạp phim thành công");
                setIsCreateModalVisible(false);
                createForm.resetFields();
                await fetchTheaters();
            } else {
                message.error(`Tạo rạp phim thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo rạp phim:", error);
            message.error(error.message || "Lỗi khi tạo rạp phim");
        }
    };

    const showCreateModal = () => {
        setIsCreateModalVisible(true);
    };

    const columns = [
        {
            title: "Tên rạp",
            dataIndex: "name",
            key: "name",
            render: (text) => text || "N/A",
        },
        {
            title: "Địa chỉ",
            key: "address",
            render: (_, record) => record.location?.address || "N/A",
        },
        {
            title: "Thành phố",
            key: "city",
            render: (_, record) => record.location?.city || "N/A",
        },
        {
            title: "Tiện ích",
            dataIndex: "facilities",
            key: "facilities",
            render: (facilities) => (facilities && facilities.length > 0 ? facilities.join(", ") : "N/A"),
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
            <h2>Quản lý rạp phim</h2>
            <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
                Thêm rạp phim mới
            </Button>
            <Table
                columns={columns}
                dataSource={theaters}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa rạp phim"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="name" label="Tên rạp" rules={[{ required: true, message: "Vui lòng nhập tên rạp!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="city" label="Thành phố" rules={[{ required: true, message: "Vui lòng nhập thành phố!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="state" label="Tỉnh/Bang" rules={[{ required: true, message: "Vui lòng nhập tỉnh/bang!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="country" label="Quốc gia" rules={[{ required: true, message: "Vui lòng nhập quốc gia!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="facilities" label="Tiện ích" rules={[{ required: true, message: "Vui lòng chọn tiện ích!" }]}>
                        <Select mode="multiple" placeholder="Chọn tiện ích">
                            <Option value="3D">3D</Option>
                            <Option value="IMAX">IMAX</Option>
                            <Option value="Food Court">Food Court</Option>
                            <Option value="Parking">Parking</Option>
                            <Option value="VIP Lounge">VIP Lounge</Option>
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
                title="Tạo rạp phim mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="name" label="Tên rạp" rules={[{ required: true, message: "Vui lòng nhập tên rạp!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="city" label="Thành phố" rules={[{ required: true, message: "Vui lòng nhập thành phố!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="state" label="Tỉnh/Bang" rules={[{ required: true, message: "Vui lòng nhập tỉnh/bang!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="country" label="Quốc gia" rules={[{ required: true, message: "Vui lòng nhập quốc gia!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="facilities" label="Tiện ích" rules={[{ required: true, message: "Vui lòng chọn tiện ích!" }]}>
                        <Select mode="multiple" placeholder="Chọn tiện ích">
                            <Option value="3D">3D</Option>
                            <Option value="IMAX">IMAX</Option>
                            <Option value="Food Court">Food Court</Option>
                            <Option value="Parking">Parking</Option>
                            <Option value="VIP Lounge">VIP Lounge</Option>
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

export default TheaterManagement;