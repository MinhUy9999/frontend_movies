// src/pages/DetailMovie/ShowtimeSection.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Tabs, DatePicker, Button, Modal, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import TheaterLayout from '../../components/TheaterLayout';
import { apiSeats } from '../../apis/seatApi';
import showtimeApi from '../../apis/showtimeApi';
import bookingApi from '../../apis/bookingApi';

const { TabPane } = Tabs;

const ShowtimeSection = ({ showtimes, onShowtimeSelect }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showtimeSeats, setShowtimeSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Nhóm danh sách suất chiếu theo rạp
  const showtimesByTheater = showtimes.reduce((acc, theater) => {
    acc[theater.theaterId] = theater;
    return acc;
  }, {});

  // Lọc suất chiếu theo ngày đã chọn
  const filterShowtimesByDate = (showtimes, date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    return showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      showtimeDate.setHours(0, 0, 0, 0);
      return showtimeDate.getTime() === selectedDate.getTime();
    });
  };

  // Xử lý khi thay đổi ngày
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };

  // Fetch seats for a specific showtime
  const fetchShowtimeSeats = async (showtimeId) => {
    try {
      setSeatsLoading(true);
      const response = await apiSeats.getSeatsByShowtime(showtimeId);

      if (response.content) {
        const transformedSeats = response.content.map(seat => ({
          id: seat._id,
          row: seat.row,
          number: seat.seatNumber,
          type: seat.seatType,
          status: seat.status
        }));
        setShowtimeSeats(transformedSeats);
      } else {
        setShowtimeSeats([]);
        message.warning('Không tìm thấy ghế cho suất chiếu này');
      }
    } catch (error) {
      console.error('Error fetching showtime seats:', error);
      message.error('Không thể tải thông tin ghế');
      setShowtimeSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  };

  // Xử lý khi nhấp vào một suất chiếu
  const handleShowtimeClick = async (showtime) => {
    try {
      // First, get the full showtime details
      const showtimeDetails = await showtimeApi.getShowtimeById(showtime.id);
      const fullShowtimeData = showtimeDetails.content.showtime;

      console.log('Full showtime data:', fullShowtimeData);

      // Construct a comprehensive showtime object
      const transformedShowtime = {
        _id: fullShowtimeData._id,
        // Lưu trữ movieId và screenId để sử dụng khi tạo booking
        movieId: fullShowtimeData.movieId?._id || fullShowtimeData.movieId,
        screenId: fullShowtimeData.screenId?._id || fullShowtimeData.screenId,
        startTime: fullShowtimeData.startTime,
        endTime: fullShowtimeData.endTime,
        screenName: fullShowtimeData.screenId?.name || "Không xác định",
        movieTitle: fullShowtimeData.movieId?.title || "Không xác định",
        duration: fullShowtimeData.movieId?.duration,
        prices: fullShowtimeData.price, // Use price directly from the API
        theater: {
          name: fullShowtimeData.screenId?.theaterId?.name || "Không xác định",
          location: fullShowtimeData.screenId?.theaterId?.location
        },
        additionalDetails: {
          createdAt: fullShowtimeData.createdAt,
          updatedAt: fullShowtimeData.updatedAt,
          isActive: fullShowtimeData.isActive
        }
      };

      console.log('Transformed Showtime:', transformedShowtime);
      console.log('Prices:', transformedShowtime.prices);

      // Set the selected showtime with full details
      setSelectedShowtime(transformedShowtime);

      // Fetch seats for this showtime
      await fetchShowtimeSeats(showtime.id);

      // Reset selected seats and open the layout modal
      setSelectedSeats([]);
      setIsLayoutModalVisible(true);
    } catch (error) {
      console.error('Error fetching showtime details:', error);
      message.error('Không thể tải thông tin suất chiếu');
    }
  };

  // Xử lý khi xác nhận chọn suất chiếu và ghế
  const handleShowtimeSelect = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      message.warning('Vui lòng chọn ít nhất một ghế');
      return;
    }

    // Tính tổng tiền dựa trên ghế đã chọn
    const totalPrice = calculateTotalPrice();

    setIsBooking(true);

    try {
      // Chuẩn bị dữ liệu cho API booking - thêm đầy đủ thông tin theo yêu cầu API
      const bookingData = {
        showtimeId: selectedShowtime._id,
        // Đảm bảo movieId và screenId từ response API được sử dụng
        movieId: selectedShowtime.movieId || '',
        screenId: selectedShowtime.screenId || '',
        seats: selectedSeats.map(seat => seat.id),
        seatDetails: selectedSeats.map(seat => ({
          id: seat.id,
          row: seat.row,
          number: seat.number,
          type: seat.type,
          price: selectedShowtime.prices[seat.type] || 0
        })),
        totalPrice,
        bookingDate: new Date().toISOString(),
        movieTitle: selectedShowtime.movieTitle || '',
        screenName: selectedShowtime.screenName || '',
        startTime: selectedShowtime.startTime,
        endTime: selectedShowtime.endTime,
        theaterName: selectedShowtime.theater?.name || ''
      };

      console.log('Booking data sent to API:', bookingData);

      // Gọi API tạo booking
      const response = await bookingApi.createBooking(bookingData);
      console.log('Booking response:', response);

      // Hiển thị thông báo thành công
      message.success('Đặt vé thành công!');

      // Nếu có callback từ component cha, gọi nó
      if (typeof onShowtimeSelect === 'function') {
        onShowtimeSelect(selectedShowtime._id, selectedSeats);
      }

      // Đóng modal
      setIsLayoutModalVisible(false);

    } catch (error) {
      console.error('Booking error:', error);
      message.error('Đã xảy ra lỗi khi đặt vé: ' + (error.message || error.response?.data?.message || 'Vui lòng thử lại sau'));
    } finally {
      setIsBooking(false);
    }
  };

  // Tính tổng giá tiền dựa trên ghế đã chọn
  const calculateTotalPrice = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return 0;

    // Use the prices directly from the showtime object
    const prices = selectedShowtime.prices || {
      standard: 0,
      premium: 0,
      vip: 0
    };

    return selectedSeats.reduce((total, seat) => {
      const seatPrice = prices[seat.type] || 0;
      return total + seatPrice;
    }, 0);
  };

  // Định dạng thời gian từ chuỗi ngày
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Lấy danh sách ID rạp chiếu để hiển thị tabs
  const theaterIds = Object.keys(showtimesByTheater);

  return (
    <Card
      title="Lịch chiếu"
      extra={
        <DatePicker
          onChange={handleDateChange}
          format="DD/MM/YYYY"
          placeholder="Chọn ngày"
          allowClear={false}
          className="w-40"
        />
      }
    >
      {/* Hiển thị các rạp dưới dạng tabs */}
      {theaterIds.length > 0 ? (
        <Tabs
          defaultActiveKey={theaterIds[0]}
          tabPosition="left"
        >
          {/* Lặp qua từng rạp chiếu */}
          {theaterIds.map(theaterId => {
            const theater = showtimesByTheater[theaterId];
            const filteredShowtimes = filterShowtimesByDate(theater.showtimes, selectedDate);

            return (
              <TabPane
                tab={
                  <div className="py-2 px-1">
                    <div className="font-medium">{theater.theaterName}</div>
                    <div className="text-xs text-gray-500">{theater.location?.city}</div>
                  </div>
                }
                key={theaterId}
              >
                {/* Hiển thị thông tin chi tiết rạp */}
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-3">{theater.theaterName}</h3>
                  <p className="text-gray-600 mb-4">
                    {theater.location?.address}, {theater.location?.city}
                  </p>

                  {/* Hiển thị các suất chiếu hoặc thông báo không có suất chiếu */}
                  {filteredShowtimes.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <CalendarOutlined className="mr-2" />
                        {new Date(selectedDate).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>

                      {/* Lưới các suất chiếu */}
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                        {filteredShowtimes.map(showtime => (
                          <div key={showtime.id} className="flex flex-col">
                            <Button
                              onClick={() => handleShowtimeClick(showtime)}
                              className="mb-1 flex items-center justify-center"
                            >
                              <ClockCircleOutlined className="mr-1" />
                              {formatTime(showtime.startTime)}
                            </Button>
                            <div className="text-xs text-gray-500 text-center">
                              {showtime.screenName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 py-4 text-center">
                      Không có suất chiếu cho ngày đã chọn
                    </div>
                  )}
                </div>
              </TabPane>
            );
          })}
        </Tabs>
      ) : (
        <div className="text-gray-500 py-4 text-center">
          Không có suất chiếu cho phim này
        </div>
      )}

      {/* Modal chọn ghế */}
      <Modal
        title="Chọn ghế"
        visible={isLayoutModalVisible}
        onCancel={() => setIsLayoutModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsLayoutModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="book"
            type="primary"
            onClick={handleShowtimeSelect}
            disabled={selectedSeats.length === 0 || isBooking}
            loading={isBooking}
          >
            {isBooking ? 'Đang xử lý' : `Đặt vé (${selectedSeats.length})`}
          </Button>
        ]}
        width={800}
      >
        {selectedShowtime && (
          <div>
            {/* Thông tin suất chiếu đã chọn */}
            <div className="mb-4 text-center">
              <h3 className="font-semibold">{selectedShowtime.screenName}</h3>
              <p>{formatTime(selectedShowtime.startTime)}</p>
            </div>

            {/* Component bố cục rạp */}
            <TheaterLayout
              showtimeId={selectedShowtime._id}
              seats={showtimeSeats}
              editable={true}
              onSeatSelect={setSelectedSeats}
              showtimeDetails={selectedShowtime}
            />

            {/* Thông tin giá vé */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Giá vé:</h4>
              <div className="grid grid-cols-3 gap-2">
                {['standard', 'premium', 'vip'].map((type) => {
                  const priceLabel = {
                    standard: 'Thường',
                    premium: 'Cao cấp',
                    vip: 'VIP'
                  };

                  // Directly access price from selectedShowtime.prices
                  const price = selectedShowtime?.prices?.[type] || 0;

                  return (
                    <div key={type} className="text-center p-2 bg-gray-100 rounded">
                      <div className="font-medium">{priceLabel[type]}</div>
                      <div>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(price)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hiển thị ghế đã chọn và tổng tiền */}
              {selectedSeats.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="font-medium mb-2">Ghế đã chọn:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(seat => (
                      <span key={seat.id} className="px-2 py-1 bg-blue-100 rounded text-sm">
                        {seat.row}{seat.number} ({seat.type === 'standard' ? 'Thường' :
                          seat.type === 'premium' ? 'Cao cấp' : 'VIP'})
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-right font-bold">
                    Tổng tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotalPrice())}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

ShowtimeSection.propTypes = {
  showtimes: PropTypes.arrayOf(
    PropTypes.shape({
      theaterId: PropTypes.string.isRequired,
      theaterName: PropTypes.string.isRequired,
      location: PropTypes.shape({
        address: PropTypes.string,
        city: PropTypes.string
      }),
      showtimes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          startTime: PropTypes.string.isRequired,
          screenName: PropTypes.string.isRequired,
          prices: PropTypes.shape({
            standard: PropTypes.number.isRequired,
            premium: PropTypes.number.isRequired,
            vip: PropTypes.number.isRequired
          }).isRequired
        })
      ).isRequired
    })
  ).isRequired,
  onShowtimeSelect: PropTypes.func
};

export default ShowtimeSection;