import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, InputNumber, Upload } from "antd";
import { apiMovies } from "../../apis/movieApi"; // Import từ apiMovies.js
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const MovieManagement = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [form] = Form.useForm();
    const [createForm] = Form.useForm();
    const [posterFileList, setPosterFileList] = useState([]); // File list cho poster
    const [trailerFileList, setTrailerFileList] = useState([]); // File list cho trailer

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        let isModalOpen = true;
        Modal.confirm({
            title: "Xác nhận xóa",
            content: "Bạn có chắc chắn muốn xóa phim này?",
            okButtonProps: { loading: false },
            async onOk() {
                try {
                    console.log("Bắt đầu xóa movie với ID:", id);
                    const response = await apiMovies.deleteMovie(id);
                    console.log("Phản hồi từ API deleteMovie:", response);
                    if (response.statusCode === 200 || response.statusCode === 204) {
                        message.success("Xóa phim thành công");
                        await fetchMovies();
                        isModalOpen = false;
                    } else {
                        message.error(`Xóa thất bại, mã trạng thái: ${response.statusCode}`);
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa:", error.response || error);
                    message.error(error.response?.data?.message || "Lỗi khi xóa phim");
                }
            },
            onCancel() {
                console.log("Hủy xóa movie với ID:", id);
                isModalOpen = false;
            },
            afterClose() {
                if (!isModalOpen) Modal.destroyAll();
            },
        });
    };

    const handleEdit = (movie) => {
        setSelectedMovie(movie);
        const initialPoster = movie.posterUrl ? [{ uid: "-1", name: "poster", status: "done", url: movie.posterUrl }] : [];
        const initialTrailer = movie.trailerUrl ? [{ uid: "-2", name: "trailer", status: "done", url: movie.trailerUrl }] : [];

        form.setFieldsValue({
            title: movie.title || "",
            description: movie.description || "",
            duration: movie.duration || 0,
            genre: movie.genre || [],
            language: movie.language || "",
            releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) : null,
            endDate: movie.endDate ? dayjs(movie.endDate) : null,
            director: movie.director || "",
            cast: movie.cast || [],
            rating: movie.rating || 0,
            isActive: movie.isActive || false,
            poster: initialPoster,
            trailer: initialTrailer,
        });
        setPosterFileList(initialPoster);
        setTrailerFileList(initialTrailer);
        setIsModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const formData = new FormData();

            // Add basic movie details to formData
            Object.entries({
                ...values,
                releaseDate: values.releaseDate ? values.releaseDate.toISOString() : null,
                endDate: values.endDate ? values.endDate.toISOString() : null,
            }).forEach(([key, value]) => {
                if (Array.isArray(value) && key !== "poster" && key !== "trailer") {
                    value.forEach((item) => formData.append(`${key}[]`, item));
                } else if (key !== "poster" && key !== "trailer") {
                    formData.append(key, value);
                }
            });

            // Handle poster file
            if (posterFileList.length > 0) {
                const posterFile = posterFileList[0];
                if (posterFile.originFileObj) {
                    // New file was uploaded
                    console.log("Appending new poster file:", posterFile.originFileObj);
                    formData.append("poster", posterFile.originFileObj);
                } else if (posterFile.url) {
                    // Using existing file (keep the URL)
                    console.log("Using existing poster URL:", posterFile.url);
                    formData.append("posterUrl", posterFile.url);
                }
            }

            // Handle trailer file
            if (trailerFileList.length > 0) {
                const trailerFile = trailerFileList[0];
                if (trailerFile.originFileObj) {
                    // New file was uploaded
                    console.log("Appending new trailer file:", trailerFile.originFileObj);
                    formData.append("trailer", trailerFile.originFileObj);
                } else if (trailerFile.url) {
                    // Using existing file (keep the URL)
                    console.log("Using existing trailer URL:", trailerFile.url);
                    formData.append("trailerUrl", trailerFile.url);
                }
            }

            for (let pair of formData.entries()) {
                console.log("FormData entry (update):", pair[0], pair[1]);
            }

            const response = await apiMovies.updateMovie(selectedMovie._id, formData);
            console.log("Phản hồi đầy đủ từ API updateMovie:", response);

            if (response && response.statusCode === 200) {
                message.success("Cập nhật phim thành công");
                setIsModalVisible(false);
                await fetchMovies();
            } else {
                message.error(`Cập nhật thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error.response || error);
            message.error(error.response?.data?.message || "Lỗi khi cập nhật phim");
        }
    };
    const handleCreate = async (values) => {
        try {
            const formData = new FormData();
            Object.entries({
                ...values,
                releaseDate: values.releaseDate ? values.releaseDate.toISOString() : null,
                endDate: values.endDate ? values.endDate.toISOString() : null,
            }).forEach(([key, value]) => {
                if (Array.isArray(value) && key !== "poster" && key !== "trailer") {
                    value.forEach((item) => formData.append(`${key}[]`, item));
                } else if (key !== "poster" && key !== "trailer") {
                    formData.append(key, value);
                }
            });

            formData.append("poster", posterFileList[0].originFileObj || posterFileList[0]);
            formData.append("trailer", trailerFileList[0].originFileObj || trailerFileList[0]);

            for (let pair of formData.entries()) {
                console.log("FormData entry (create):", pair[0], pair[1]);
            }

            const response = await apiMovies.createMovie(formData);
            console.log("Phản hồi đầy đủ từ API createMovie:", response);

            if (response && response.statusCode === 201) {
                message.success("Tạo phim thành công");
                setIsCreateModalVisible(false);
                createForm.resetFields();
                setPosterFileList([]);
                setTrailerFileList([]);
                await fetchMovies();
            } else {
                message.error(`Tạo phim thất bại, mã trạng thái: ${response?.statusCode || "không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo phim:", error.response || error);
            message.error(error.response?.data?.message || "Lỗi khi tạo phim");
        }
    };

    const showCreateModal = () => {
        setPosterFileList([]);
        setTrailerFileList([]);
        createForm.resetFields();
        setIsCreateModalVisible(true);
    };
    const posterUploadProps = {
        onRemove: () => {
            setPosterFileList([]);
            if (isModalVisible) {
                form.setFieldsValue({ poster: [] });
            } else {
                createForm.setFieldsValue({ poster: [] });
            }
        },
        beforeUpload: (file) => {
            console.log("Poster file selected in Upload:", file);
            const newFileList = [{ ...file, originFileObj: file }]; // Đảm bảo originFileObj tồn tại
            setPosterFileList(newFileList);
            if (isModalVisible) {
                form.setFieldsValue({ poster: newFileList });
            } else {
                createForm.setFieldsValue({ poster: newFileList });
            }
            return false; // Ngăn upload tự động
        },
        fileList: posterFileList,
        accept: "image/*",
    };

    const trailerUploadProps = {
        onRemove: () => {
            setTrailerFileList([]);
            if (isModalVisible) {
                form.setFieldsValue({ trailer: [] });
            } else {
                createForm.setFieldsValue({ trailer: [] });
            }
        },
        beforeUpload: (file) => {
            console.log("Trailer file selected in Upload:", file);
            const newFileList = [{ ...file, originFileObj: file }]; // Đảm bảo originFileObj tồn tại
            setTrailerFileList(newFileList);
            if (isModalVisible) {
                form.setFieldsValue({ trailer: newFileList });
            } else {
                createForm.setFieldsValue({ trailer: newFileList });
            }
            return false; // Ngăn upload tự động
        },
        fileList: trailerFileList,
        accept: "video/*",
    };

    const columns = [
        {
            title: "Tên phim",
            dataIndex: "title",
            key: "title",
            render: (text) => text || "N/A",
        },
        {
            title: "Thể loại",
            dataIndex: "genre",
            key: "genre",
            render: (genres) => (genres && genres.length > 0 ? genres.join(", ") : "N/A"),
        },
        {
            title: "Thời lượng (phút)",
            dataIndex: "duration",
            key: "duration",
        },
        {
            title: "Ngày phát hành",
            dataIndex: "releaseDate",
            key: "releaseDate",
            render: (date) => (date ? new Date(date).toLocaleDateString() : ""),
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            key: "isActive",
            render: (isActive) => (isActive ? "Hoạt động" : "Không hoạt động"),
        },
        {
            title: "Poster",
            dataIndex: "posterUrl",
            key: "posterUrl",
            render: (posterUrl) => (
                posterUrl ? (
                    <img
                        src={posterUrl}
                        alt="Movie Poster"
                        style={{ width: "50px", height: "auto", objectFit: "cover" }}
                    />
                ) : (
                    "N/A"
                )
            ),
        },
        {
            title: "Trailer",
            dataIndex: "trailerUrl",
            key: "trailerUrl",
            render: (trailerUrl) => (
                trailerUrl ? (
                    <video width="50" controls>
                        <source src={trailerUrl} type="video/mp4" />
                    </video>
                ) : (
                    "N/A"
                )
            ),
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
            <h2>Quản lý phim</h2>
            <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
                Thêm phim mới
            </Button>
            <Table
                columns={columns}
                dataSource={movies}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa phim"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item name="title" label="Tên phim" rules={[{ required: true, message: "Vui lòng nhập tên phim!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="duration" label="Thời lượng (phút)" rules={[{ required: true, message: "Vui lòng nhập thời lượng!" }]}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="genre" label="Thể loại" rules={[{ required: true, message: "Vui lòng chọn thể loại!" }]}>
                        <Select mode="multiple" placeholder="Chọn thể loại">
                            <Option value="action">Hành động</Option>
                            <Option value="comedy">Hài</Option>
                            <Option value="drama">Kịch</Option>
                            <Option value="horror">Kinh dị</Option>
                            <Option value="romance">Lãng mạn</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true, message: "Vui lòng nhập ngôn ngữ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="releaseDate" label="Ngày phát hành" rules={[{ required: true, message: "Vui lòng chọn ngày phát hành!" }]}>
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endDate" label="Ngày kết thúc">
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="director" label="Đạo diễn" rules={[{ required: true, message: "Vui lòng nhập đạo diễn!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="cast" label="Diễn viên" rules={[{ required: true, message: "Vui lòng nhập diễn viên!" }]}>
                        <Select mode="tags" placeholder="Nhập tên diễn viên">
                            {selectedMovie?.cast?.map((actor) => (
                                <Option key={actor} value={actor}>
                                    {actor}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="rating" label="Đánh giá (0-10)" rules={[{ required: true, message: "Vui lòng nhập đánh giá!" }]}>
                        <InputNumber min={0} max={10} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="poster"
                        label="Poster"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            const fileList = Array.isArray(e) ? e : (e && e.fileList) || [];
                            return fileList;
                        }}
                    >
                        <Upload {...posterUploadProps} accept="image/*">
                            <Button icon={<UploadOutlined />}>Upload Poster</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        name="trailer"
                        label="Trailer"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            const fileList = Array.isArray(e) ? e : (e && e.fileList) || [];
                            return fileList;
                        }}
                    >
                        <Upload {...trailerUploadProps} accept="video/*">
                            <Button icon={<UploadOutlined />}>Upload Trailer</Button>
                        </Upload>
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
                title="Tạo phim mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                >
                    <Form.Item name="title" label="Tên phim" rules={[{ required: true, message: "Vui lòng nhập tên phim!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="duration" label="Thời lượng (phút)" rules={[{ required: true, message: "Vui lòng nhập thời lượng!" }]}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="genre" label="Thể loại" rules={[{ required: true, message: "Vui lòng chọn thể loại!" }]}>
                        <Select mode="multiple" placeholder="Chọn thể loại">
                            <Option value="action">Hành động</Option>
                            <Option value="comedy">Hài</Option>
                            <Option value="drama">Kịch</Option>
                            <Option value="horror">Kinh dị</Option>
                            <Option value="romance">Lãng mạn</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true, message: "Vui lòng nhập ngôn ngữ!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="releaseDate" label="Ngày phát hành" rules={[{ required: true, message: "Vui lòng chọn ngày phát hành!" }]}>
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="endDate" label="Ngày kết thúc">
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="director" label="Đạo diễn" rules={[{ required: true, message: "Vui lòng nhập đạo diễn!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="cast" label="Diễn viên" rules={[{ required: true, message: "Vui lòng nhập diễn viên!" }]}>
                        <Select mode="tags" placeholder="Nhập tên diễn viên" />
                    </Form.Item>
                    <Form.Item name="rating" label="Đánh giá (0-10)" rules={[{ required: true, message: "Vui lòng nhập đánh giá!" }]}>
                        <InputNumber min={0} max={10} step={0.1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="poster"
                        label="Poster"
                        rules={[{ required: true, message: "Vui lòng upload poster!" }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            const fileList = Array.isArray(e) ? e : (e && e.fileList) || [];
                            return fileList;
                        }}
                    >
                        <Upload {...posterUploadProps} accept="image/*">
                            <Button icon={<UploadOutlined />}>Upload Poster</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        name="trailer"
                        label="Trailer"
                        rules={[{ required: true, message: "Vui lòng upload trailer!" }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            const fileList = Array.isArray(e) ? e : (e && e.fileList) || [];
                            return fileList;
                        }}
                    >
                        <Upload {...trailerUploadProps} accept="video/*">
                            <Button icon={<UploadOutlined />}>Upload Trailer</Button>
                        </Upload>
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

export default MovieManagement;