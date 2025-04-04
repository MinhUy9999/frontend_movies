import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Divider,
  Steps,
  Button,
  message,
  Result,
  Form,
  Input,
  Radio,
  DatePicker
} from 'antd';
import {
  CalendarOutlined,
  TagOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  BankOutlined,
  MobileOutlined,
  LockOutlined
} from '@ant-design/icons';
import ShowtimeSection from '../DetailMovie/ShowtimeSection';
import bookingApi from '../../apis/bookingApi';
import showtimeApi from '../../apis/showtimeApi';
import { apiSeats } from '../../apis/seatApi';

const { Step } = Steps;

const BookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchShowtimeAndSeats = async () => {
      if (!showtimeId) {
        setCurrentStep(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const showtimeResponse = await showtimeApi.getShowtimeById(showtimeId);
        if (showtimeResponse?.statusCode !== 200 || !showtimeResponse.content?.showtime) {
          throw new Error(showtimeResponse?.message || 'Không thể tải thông tin suất chiếu');
        }
        const showtime = showtimeResponse.content.showtime;

        const seatsResponse = await apiSeats.getSeatsByShowtime(showtimeId);
        if (seatsResponse?.statusCode !== 200 || !seatsResponse.content) {
          throw new Error(seatsResponse?.message || 'Không thể tải danh sách ghế');
        }

        const formattedShowtimes = formatShowtimes([showtime]);
        setShowtimes(formattedShowtimes);

        setSelectedBooking({
          showtimeId: showtime._id,
          screenId: showtime.screenId?._id || showtime.screenId,
          seats: [],
          totalPrice: 0,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          movieTitle: showtime.movieId?.title || 'Không xác định',
          screenName: showtime.screenId?.name || 'Không xác định',
          theaterName: showtime.screenId?.theaterId?.name || 'Không xác định'
        });
        setCurrentStep(0);
      } catch (error) {
        console.error('Error fetching showtime and seats:', error);
        setError(error.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimeAndSeats();
  }, [showtimeId]);

  const formatShowtimes = (data) => {
    const theaterMap = {};
    data.forEach(showtime => {
      const theater = showtime.screenId?.theaterId || {};
      const theaterId = theater._id || 'unknown';

      if (!theaterMap[theaterId]) {
        theaterMap[theaterId] = {
          theaterId,
          theaterName: theater.name || 'Không xác định',
          location: {
            address: theater.location?.address || '',
            city: theater.location?.city || ''
          },
          showtimes: []
        };
      }

      theaterMap[theaterId].showtimes.push({
        id: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        screenName: showtime.screenId?.name || 'Không xác định',
        prices: showtime.price || { standard: 0, premium: 0, vip: 0 }
      });
    });
    return Object.values(theaterMap);
  };

  const handleShowtimeSelect = (selectedShowtimeId, selectedSeats) => {
    try {
      if (!selectedSeats?.length) {
        message.error('Vui lòng chọn ít nhất một ghế');
        return;
      }

      const showtime = showtimes.flatMap(t => t.showtimes).find(s => s.id === selectedShowtimeId);
      if (!showtime) {
        throw new Error('Suất chiếu không hợp lệ');
      }

      const totalPrice = calculateTotalPrice(selectedSeats, showtime.prices);

      setSelectedBooking({
        showtimeId: selectedShowtimeId,
        screenId: showtimes.find(t => t.showtimes.some(s => s.id === selectedShowtimeId))?.theaterId,
        seats: selectedSeats,
        totalPrice,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        movieTitle: selectedBooking?.movieTitle || 'Không xác định',
        screenName: showtime.screenName,
        theaterName: showtimes.find(t => t.showtimes.some(s => s.id === selectedShowtimeId))?.theaterName || 'Không xác định'
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Error processing showtime selection:', error);
      message.error(error.message || 'Đã xảy ra lỗi khi xử lý đặt vé');
    }
  };

  const calculateTotalPrice = (selectedSeats, prices) => {
    if (!selectedSeats || !prices) return 0;
    return selectedSeats.reduce((total, seat) => total + (prices[seat.type] || 0), 0);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      setPaymentProcessing(true);

      if (!selectedBooking) {
        throw new Error('Thông tin đặt vé không hợp lệ');
      }

      // Payload cho API createBooking
      const bookingData = {
        showtimeId: selectedBooking.showtimeId,
        seatIds: selectedBooking.seats.map(seat => seat.id),
        totalPrice: selectedBooking.totalPrice,
        bookingDate: new Date().toISOString(),
        paymentMethod: values.paymentMethod // Thêm paymentMethod vào payload
        // Nếu cần userId, thêm vào đây (lấy từ hệ thống xác thực)
        // userId: "your-user-id-here"
      };

      console.log('Booking data sent to API:', bookingData);

      const createResponse = await bookingApi.createBooking(bookingData);
      if (createResponse?.statusCode !== 201 || !createResponse.content?._id) {
        throw new Error(createResponse?.message || 'Không thể tạo booking');
      }
      const bookingId = createResponse.content._id;

      // Payload cho API processPayment
      const paymentData = {
        bookingId,
        paymentMethod: values.paymentMethod,
        paymentDetails: buildPaymentDetails(values)
      };

      console.log('Payment data sent to API:', paymentData);

      const paymentResponse = await bookingApi.processPayment(bookingId, paymentData);
      if (paymentResponse?.statusCode !== 200) {
        throw new Error(paymentResponse?.message || 'Thanh toán thất bại');
      }

      setSelectedBooking(prev => ({ ...prev, _id: bookingId }));
      message.success('Thanh toán thành công!');
      setBookingComplete(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.message || 'Lỗi thanh toán. Vui lòng thử lại.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const buildPaymentDetails = (values) => {
    switch (values.paymentMethod) {
      case 'credit_card':
        return {
          cardNumber: values.cardNumber,
          cardHolder: values.cardHolder,
          expiryDate: values.expiryDate?.format('MM/YY') || '',
          cvv: values.cvv
        };
      case 'bank_transfer':
        return {
          bankAccount: values.bankAccount,
          bankName: values.bankName
        };
      case 'mobile_payment':
        return {
          mobileNumber: values.mobileNumber
        };
      default:
        return {};
    }
  };

  const handleCancelBooking = async () => {
    try {
      if (selectedBooking?._id) {
        const response = await bookingApi.cancelBooking(selectedBooking._id);
        if (response?.statusCode !== 200) {
          throw new Error('Không thể hủy booking');
        }
        message.info('Đã hủy đặt vé');
      }
      setSelectedBooking(null);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error canceling booking:', error);
      message.error(error.message || 'Không thể hủy đặt vé');
    }
  };

  const handleBackToHome = () => navigate('/');
  const handleViewBookings = () => navigate('/user/bookings');

  const renderPaymentForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handlePaymentSubmit}
      initialValues={{ paymentMethod: 'credit_card' }}
    >
      <h3 className="text-lg font-medium mb-4">Chọn phương thức thanh toán</h3>
      <Form.Item name="paymentMethod">
        <Radio.Group className="w-full">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}><Radio.Button value="credit_card"><CreditCardOutlined /> Thẻ tín dụng</Radio.Button></Col>
            <Col xs={24} md={8}><Radio.Button value="bank_transfer"><BankOutlined /> Chuyển khoản</Radio.Button></Col>
            <Col xs={24} md={8}><Radio.Button value="mobile_payment"><MobileOutlined /> Ví điện tử</Radio.Button></Col>
          </Row>
        </Radio.Group>
      </Form.Item>

      <Divider />

      {form.getFieldValue('paymentMethod') === 'credit_card' && (
        <>
          <Form.Item name="cardNumber" label="Số thẻ" rules={[{ required: true, pattern: /^[0-9]{13,19}$/, message: 'Số thẻ không hợp lệ' }]}>
            <Input prefix={<CreditCardOutlined />} placeholder="XXXX XXXX XXXX XXXX" />
          </Form.Item>
          <Form.Item name="cardHolder" label="Chủ thẻ" rules={[{ required: true, message: 'Vui lòng nhập tên chủ thẻ' }]}>
            <Input placeholder="Tên in trên thẻ" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="expiryDate" label="Ngày hết hạn" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
                <DatePicker picker="month" format="MM/YY" className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="cvv" label="CVV" rules={[{ required: true, pattern: /^[0-9]{3,4}$/, message: 'CVV không hợp lệ' }]}>
                <Input prefix={<LockOutlined />} placeholder="123" maxLength={4} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {form.getFieldValue('paymentMethod') === 'bank_transfer' && (
        <>
          <Form.Item name="bankName" label="Tên ngân hàng" rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}>
            <Radio.Group>
              <Radio.Button value="vietcombank">Vietcombank</Radio.Button>
              <Radio.Button value="techcombank">Techcombank</Radio.Button>
              <Radio.Button value="vietinbank">Vietinbank</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="bankAccount" label="Số tài khoản" rules={[{ required: true, pattern: /^[0-9]{10,14}$/, message: 'Số tài khoản không hợp lệ' }]}>
            <Input prefix={<BankOutlined />} placeholder="Số tài khoản" />
          </Form.Item>
        </>
      )}

      {form.getFieldValue('paymentMethod') === 'mobile_payment' && (
        <Form.Item name="mobileNumber" label="Số điện thoại" rules={[{ required: true, pattern: /^(0|84|\+84)[3|5|7|8|9][0-9]{8}$/, message: 'Số điện thoại không hợpException lệ' }]}>
          <Input prefix={<MobileOutlined />} placeholder="Số điện thoại" />
        </Form.Item>
      )}

      <Form.Item className="mt-6">
        <Button type="primary" htmlType="submit" size="large" block loading={paymentProcessing}>
          {paymentProcessing ? 'Đang xử lý' : 'Xác nhận thanh toán'}
        </Button>
      </Form.Item>
    </Form>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <ShowtimeSection showtimes={showtimes} onShowtimeSelect={handleShowtimeSelect} />;
      case 1:
        return (
          <Card title="Thanh toán">
            {selectedBooking && (
              <>
                <h3 className="text-lg font-semibold">{selectedBooking.movieTitle}</h3>
                <p className="text-gray-600">{selectedBooking.theaterName} - {selectedBooking.screenName}</p>
                <p><CalendarOutlined className="mr-2" />{new Date(selectedBooking.startTime).toLocaleString()}</p>
                <Divider />
                <h4 className="font-medium">Ghế đã chọn:</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedBooking.seats.map(seat => (
                    <span key={seat.id} className="px-2 py-1 bg-blue-100 rounded">{seat.row}{seat.number}</span>
                  ))}
                </div>
                <div className="text-right font-bold text-lg mb-4">
                  <TagOutlined className="mr-2" />Tổng tiền: {selectedBooking.totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                </div>
                <Divider />
                {renderPaymentForm()}
                <Button danger onClick={handleCancelBooking} disabled={paymentProcessing} className="mt-4">Hủy đặt vé</Button>
              </>
            )}
          </Card>
        );
      case 2:
        return (
          <Result
            status="success"
            title="Đặt vé thành công!"
            subTitle={
              selectedBooking && (
                <>
                  <p>Phim: {selectedBooking.movieTitle}</p>
                  <p>Rạp: {selectedBooking.theaterName}</p>
                  <p>Suất chiếu: {new Date(selectedBooking.startTime).toLocaleString()}</p>
                  <p>Mã đặt vé: {selectedBooking._id}</p>
                </>
              )
            }
            extra={[
              <Button type="primary" key="bookings" onClick={handleViewBookings}>Xem lịch sử đặt vé</Button>,
              <Button key="back" onClick={handleBackToHome}>Quay lại trang chủ</Button>
            ]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spin size="large" tip="Đang tải..." /></div>;
  if (error) return <Alert message="Lỗi" description={error} type="error" showIcon action={<Button size="small" danger onClick={handleBackToHome}>Quay lại</Button>} />;

  return (
    <div className="container mx-auto py-6 px-4">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Steps current={currentStep}>
              <Step title="Chọn suất chiếu & ghế" icon={<CalendarOutlined />} />
              <Step title="Thanh toán" icon={<CreditCardOutlined />} />
              <Step title="Hoàn tất" icon={<CheckCircleOutlined />} />
            </Steps>
          </Card>
        </Col>
        <Col span={24}>{renderCurrentStep()}</Col>
      </Row>
    </div>
  );
};

export default BookingPage;