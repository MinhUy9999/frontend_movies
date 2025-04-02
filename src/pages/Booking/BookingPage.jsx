// src/pages/Booking/BookingPage.jsx
import { useState, useEffect } from 'react'; // Import React hooks
import { useParams, useNavigate } from 'react-router-dom'; // Import hook để lấy tham số từ URL và điều hướng
import { useSelector } from 'react-redux'; // Import hook để lấy dữ liệu từ Redux store
import { Form, Button, Steps, message, Radio, Input, Card, Divider } from 'antd'; // Import các component từ Ant Design
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'; // Import các biểu tượng
import showtimeApi from '../../apis/showtimeApi'; // Import API cho suất chiếu
import bookingApi from '../../apis/bookingApi'; // Import API cho đặt vé
import SeatSelection from '../../components/SeatSelection'; // Import component chọn ghế
import { useWebSocket } from '../../contexts/WebSocketContext'; // Import context WebSocket

const { Step } = Steps; // Lấy component Step từ Steps
const { Group: RadioGroup } = Radio; // Lấy component Group từ Radio và đổi tên thành RadioGroup

// Component trang đặt vé
const BookingPage = () => {
  // Lấy tham số showtimeId từ URL
  const { showtimeId } = useParams();
  const navigate = useNavigate(); // Hook để điều hướng
  const { isAuthenticated } = useSelector((state) => state.user); // Lấy trạng thái đăng nhập từ Redux
  const { addEventListener, removeEventListener } = useWebSocket(); // Lấy các hàm từ WebSocket context

  // Khai báo các state cần thiết
  const [currentStep, setCurrentStep] = useState(0); // Bước hiện tại trong quy trình đặt vé
  const [showtime, setShowtime] = useState(null); // Thông tin suất chiếu
  const [selectedSeats, setSelectedSeats] = useState([]); // Danh sách ghế đã chọn
  const [movie, setMovie] = useState(null); // Thông tin phim
  const [theater, setTheater] = useState(null); // Thông tin rạp chiếu
  const [screen, setScreen] = useState(null); // Thông tin phòng chiếu
  const [loading, setLoading] = useState(true); // Trạng thái đang tải
  const [bookingId, setBookingId] = useState(null); // ID đặt vé
  const [totalAmount, setTotalAmount] = useState(0); // Tổng số tiền
  const [paymentMethod, setPaymentMethod] = useState('credit_card'); // Phương thức thanh toán
  const [form] = Form.useForm(); // Hook form của Ant Design
  const [countdown, setCountdown] = useState(null); // Đếm ngược thời gian

  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (!isAuthenticated) {
      message.error('Vui lòng đăng nhập để đặt vé');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thông tin chi tiết suất chiếu
  useEffect(() => {
    const fetchShowtimeDetails = async () => {
      try {
        setLoading(true);
        const response = await showtimeApi.getShowtimeById(showtimeId);

        if (response.statusCode === 200 && response.content?.showtime) {
          const showtimeData = response.content.showtime;
          setShowtime(showtimeData);

          // Thiết lập thông tin phim và phòng/rạp chiếu nếu có trong response
          if (showtimeData.movieId) {
            setMovie(typeof showtimeData.movieId === 'object' ? showtimeData.movieId : { _id: showtimeData.movieId });
          }

          if (showtimeData.screenId) {
            const screenData = typeof showtimeData.screenId === 'object' ? showtimeData.screenId : null;
            setScreen(screenData);

            if (screenData && screenData.theaterId) {
              setTheater(typeof screenData.theaterId === 'object' ? screenData.theaterId : { _id: screenData.theaterId });
            }
          }
        } else {
          message.error('Không thể tải thông tin suất chiếu');
          navigate('/');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin suất chiếu:', error);
        message.error('Lỗi khi tải thông tin suất chiếu');
      } finally {
        setLoading(false);
      }
    };

    if (showtimeId) {
      fetchShowtimeDetails();
    }
  }, [showtimeId, navigate]);

  // Lắng nghe các sự kiện WebSocket liên quan đến đặt vé
  useEffect(() => {
    // Xử lý khi đặt vé được giữ chỗ
    const handleBookingReserved = (data) => {
      if (data.bookingId === bookingId) {
        // Lấy thời gian hết hạn từ dữ liệu
        if (data.expiresAt) {
          const expiryTime = new Date(data.expiresAt).getTime();
          const now = new Date().getTime();
          const timeLeft = Math.floor((expiryTime - now) / 1000); // tính bằng giây

          if (timeLeft > 0) {
            setCountdown(timeLeft);
          }
        }
      }
    };

    // Xử lý khi đặt vé sắp hết hạn
    const handleBookingExpiring = (data) => {
      if (data.bookingId === bookingId) {
        message.warning(`Đặt vé của bạn sẽ hết hạn trong ${data.minutesLeft} phút!`, 5);
      }
    };

    // Xử lý khi đặt vé đã hết hạn
    const handleBookingExpired = (data) => {
      if (data.bookingId === bookingId) {
        message.error('Đặt vé của bạn đã hết hạn', 5);
        // Đặt lại quá trình đặt vé
        setCurrentStep(0);
        setSelectedSeats([]);
        setBookingId(null);
      }
    };

    // Đăng ký các sự kiện lắng nghe
    const unsubscribeReserved = addEventListener('booking_reserved', handleBookingReserved);
    const unsubscribeExpiring = addEventListener('booking_expiring', handleBookingExpiring);
    const unsubscribeExpired = addEventListener('booking_expired', handleBookingExpired);

    // Hàm dọn dẹp khi component unmount
    return () => {
      unsubscribeReserved();
      unsubscribeExpiring();
      unsubscribeExpired();
    };
  }, [bookingId, addEventListener, removeEventListener]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!countdown) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Định dạng đếm ngược dưới dạng mm:ss
  const formatCountdown = () => {
    if (!countdown) return '';

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Xử lý khi chọn ghế
  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);

    // Tính tổng số tiền dựa trên loại ghế
    if (showtime && showtime.price) {
      let total = 0;
      seats.forEach(seatId => {
        // Trích xuất chữ cái hàng (ký tự đầu tiên) để xác định loại ghế
        const rowLetter = seatId.charAt(0);
        let seatType = 'standard';

        // Cập nhật loại ghế theo quy định mới
        if (['D', 'E', 'F'].includes(rowLetter)) {
          seatType = 'premium';
        } else if (['G', 'H', 'I'].includes(rowLetter)) {
          seatType = 'vip';
        }

        total += showtime.price[seatType] || 0;
      });

      setTotalAmount(total);
    }
  };

  // Tạo đơn đặt vé
  const handleCreateBooking = async () => {
    if (selectedSeats.length === 0) {
      message.error('Vui lòng chọn ít nhất một ghế');
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        showtimeId,
        seatIds: selectedSeats,
        paymentMethod
      };

      const response = await bookingApi.createBooking(bookingData);

      if (response.statusCode === 201 && response.content?.booking) {
        message.success('Đặt vé thành công');
        setBookingId(response.content.booking._id);
        setCurrentStep(1);
      } else {
        message.error(response.message || 'Không thể tạo đơn đặt vé');
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn đặt vé:', error);
      message.error('Lỗi khi xử lý đơn đặt vé của bạn');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thanh toán
  const handlePayment = async (values) => {
    if (!bookingId) {
      message.error('Không tìm thấy đơn đặt vé');
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        bookingId,
        paymentMethod,
        paymentDetails: values
      };

      const response = await bookingApi.processPayment(bookingId, paymentData);

      if (response.statusCode === 200 && response.content?.booking) {
        message.success('Thanh toán thành công');
        setCurrentStep(2);
      } else {
        message.error(response.message || 'Thanh toán thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thanh toán:', error);
      message.error('Lỗi khi xử lý thanh toán của bạn');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị form thanh toán dựa trên phương thức thanh toán
  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return (
          <div>
            <Form.Item
              name="cardNumber"
              label="Số thẻ"
              rules={[
                { required: true, message: 'Vui lòng nhập số thẻ của bạn' },
                { pattern: /^\d{16}$/, message: 'Vui lòng nhập số thẻ hợp lệ 16 chữ số' }
              ]}
            >
              <Input placeholder="1234 5678 9012 3456" maxLength={16} />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item
                name="expiryDate"
                label="Ngày hết hạn"
                rules={[{ required: true, message: 'Vui lòng nhập ngày hết hạn' }]}
                className="w-1/2"
              >
                <Input placeholder="MM/YY" maxLength={5} />
              </Form.Item>

              <Form.Item
                name="cvv"
                label="CVV"
                rules={[
                  { required: true, message: 'Vui lòng nhập CVV' },
                  { pattern: /^\d{3,4}$/, message: 'Vui lòng nhập CVV hợp lệ' }
                ]}
                className="w-1/2"
              >
                <Input placeholder="123" maxLength={4} />
              </Form.Item>
            </div>

            <Form.Item
              name="cardholderName"
              label="Tên chủ thẻ"
              rules={[{ required: true, message: 'Vui lòng nhập tên chủ thẻ' }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </div>
        );

      case 'paypal':
        return (
          <div>
            <Form.Item
              name="email"
              label="Email PayPal"
              rules={[
                { required: true, message: 'Vui lòng nhập email PayPal của bạn' },
                { type: 'email', message: 'Vui lòng nhập email hợp lệ' }
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </div>
        );

      default:
        return <div>Vui lòng chọn phương thức thanh toán</div>;
    }
  };

  // Định dạng tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Hiển thị loading khi đang tải dữ liệu
  if (loading && !showtime) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Giao diện trang đặt vé
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Đặt vé xem phim</h1>

      {/* Hiển thị các bước của quy trình đặt vé */}
      <Steps current={currentStep} className="mb-8">
        <Step title="Chọn ghế" description="Chọn ghế của bạn" />
        <Step title="Thanh toán" description="Hoàn tất thanh toán" />
        <Step title="Xác nhận" description="Đặt vé thành công" />
      </Steps>

      {/* Đồng hồ đếm ngược khi đặt vé đang hoạt động */}
      {bookingId && countdown > 0 && currentStep === 1 && (
        <div className="mb-4 bg-yellow-50 p-3 rounded-lg flex items-center text-yellow-700">
          <ClockCircleOutlined className="mr-2" />
          <span>Thời gian còn lại để hoàn tất thanh toán: {formatCountdown()}</span>
        </div>
      )}

      {/* Bước 1: Chọn ghế */}
      {currentStep === 0 && (
        <div>
          <div className="mb-6">
            {/* Thông tin phim và suất chiếu */}
            <Card className="mb-4">
              <h2 className="text-xl font-bold mb-2">{movie?.title || 'Phim'}</h2>
              <p className="text-gray-600">
                {theater?.name || 'Rạp'} - {screen?.name || 'Phòng chiếu'}
              </p>
              <p className="text-gray-600">
                {showtime ? new Date(showtime.startTime).toLocaleString() : 'Suất chiếu'}
              </p>
            </Card>

            {/* Component chọn ghế */}
            <SeatSelection
              showtimeId={showtimeId}
              onSeatSelect={handleSeatSelection}
            />

            {/* Tóm tắt đặt vé */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Tóm tắt đặt vé</h3>
              <div className="flex justify-between mb-2">
                <span>Ghế đã chọn:</span>
                <span>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Tổng tiền:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Nút tiếp tục sang bước thanh toán */}
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={handleCreateBooking}
              disabled={selectedSeats.length === 0}
              loading={loading}
              size="large"
            >
              Tiếp tục thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* Bước 2: Thanh toán */}
      {currentStep === 1 && (
        <div>
          <Card title="Chi tiết thanh toán" className="mb-6">
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePayment}
              initialValues={{ paymentMethod }}
            >
              {/* Chọn phương thức thanh toán */}
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
              >
                <RadioGroup onChange={e => setPaymentMethod(e.target.value)}>
                  <Radio value="credit_card">Thẻ tín dụng</Radio>
                  <Radio value="paypal">PayPal</Radio>
                </RadioGroup>
              </Form.Item>

              {/* Hiển thị form thanh toán tương ứng */}
              {renderPaymentForm()}

              {/* Tóm tắt đơn hàng */}
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Tóm tắt đơn hàng</h3>
                <div className="flex justify-between mb-2">
                  <span>Phim:</span>
                  <span>{movie?.title || 'Phim'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Suất chiếu:</span>
                  <span>{showtime ? new Date(showtime.startTime).toLocaleString() : 'Suất chiếu'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Ghế đã chọn:</span>
                  <span>{selectedSeats.join(', ')}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Tổng tiền:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Các nút điều hướng */}
              <div className="flex justify-end mt-6">
                <Button className="mr-4" onClick={() => setCurrentStep(0)}>
                  Quay lại
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  Hoàn tất thanh toán
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      )}

      {/* Bước 3: Xác nhận đặt vé thành công */}
      {currentStep === 2 && (
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-green-500 text-6xl mb-4">
              <CheckCircleOutlined />
            </div>
            <h2 className="text-2xl font-bold mb-4">Đặt vé thành công!</h2>
            <p className="text-gray-600 mb-6">
              Đơn đặt vé của bạn đã được xác nhận thành công. Bạn sẽ nhận được email chứa thông tin chi tiết về đơn đặt vé.
            </p>

            {/* Chi tiết đặt vé */}
            <Card className="mb-6 text-left">
              <h3 className="text-lg font-semibold mb-2">Chi tiết đặt vé</h3>
              <p><strong>Phim:</strong> {movie?.title || 'Phim'}</p>
              <p><strong>Rạp:</strong> {theater?.name || 'Rạp'}</p>
              <p><strong>Phòng chiếu:</strong> {screen?.name || 'Phòng chiếu'}</p>
              <p><strong>Thời gian:</strong> {showtime ? new Date(showtime.startTime).toLocaleString() : 'Suất chiếu'}</p>
              <p><strong>Ghế:</strong> {selectedSeats.join(', ')}</p>
              <p><strong>Tổng tiền:</strong> {formatCurrency(totalAmount)}</p>
            </Card>

            {/* Nút điều hướng */}
            <div className="flex justify-center">
              <Button type="primary" onClick={() => navigate('/user/bookings')} size="large">
                Xem đơn đặt vé của tôi
              </Button>
              <Button className="ml-4" onClick={() => navigate('/')} size="large">
                Trở về trang chủ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingPage