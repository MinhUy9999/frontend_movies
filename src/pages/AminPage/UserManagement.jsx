import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, message } from "antd";
import { userApi } from "../../apis/userApi";
import dayjs from "dayjs";

const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userApi.getAllUsers();
            console.log("Phản hồi từ API getAllUsers:", response);
            if (response.content && response.content.users) {
                setUsers(response.content.users);
            } else {
                console.error("Không tìm thấy dữ liệu users:", response);
                setUsers([]);
            }
        } catch (error) {
            message.error(error.message || "Lỗi khi lấy danh sách người dùng");
            console.error("Lỗi fetchUsers:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa người dùng này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa user với ID:", id);
                    const response = await userApi.deleteUser(id);
                    console.log("Phản hồi từ API deleteUser:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa người dùng thành công");
                        await fetchUsers();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error.response || error);
                    message.error(error.response?.data?.message || "Lỗi khi xóa người dùng");
                }
            },
            onCancel() {
                console.log("Hủy xóa user với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        form.setFieldsValue({
            username: user.username || "",
            email: user.email,
            gender: user.gender,
            phone: user.phone,
            dateofbirth: user.dateofbirth ? dayjs(user.dateofbirth) : null,
        });
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const updateData = {
                ...values,
                dateofbirth: values.dateofbirth ? values.dateofbirth.toISOString() : null,
            };
            console.log("Dữ liệu gửi đi:", updateData);
            const response = await userApi.updateUser(selectedUser._id, updateData);
            console.log("Phản hồi đầy đủ từ API updateUser:", response);

            // Kiểm tra statusCode trong dữ liệu trả về
            if (response && response.statusCode === 200) {
                message.success("Cập nhật người dùng thành công");
                setIsModalVisible(false);
                await fetchUsers();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error.response || error);
            message.error(error.response?.data?.message || "Lỗi khi cập nhật người dùng");
        }
    };

    const columns = [
        {
            title: "Tên người dùng",
            dataIndex: "username",
            key: "username",
            render: (text) => text || "N/A",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Giới tính",
            dataIndex: "gender",
            key: "gender",
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Ngày sinh",
            dataIndex: "dateofbirth",
            key: "dateofbirth",
            render: (date) => (date ? new Date(date).toLocaleDateString() : ""),
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
            <h2>Quản lý người dùng</h2>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            <Modal
                title="Chỉnh sửa người dùng"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="username" label="Tên người dùng">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: "Vui lòng nhập email!" }, { type: "email", message: "Email không hợp lệ!" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="gender"
                        label="Giới tính"
                        rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
                    >
                        <Select>
                            <Option value="male">Nam</Option>
                            <Option value="female">Nữ</Option>
                            <Option value="other">Khác</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="dateofbirth" label="Ngày sinh">
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
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
        </div>
    );
};

export default UserManagement;