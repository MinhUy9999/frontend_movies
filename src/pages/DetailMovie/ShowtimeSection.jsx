// Import các hook và component cần thiết
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
  // State quản lý ngày được chọn để lọc suất chiếu
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State điều khiển modal hiển thị bố cục rạp
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false);

  // Lưu suất chiếu được chọn
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  // Danh sách ghế được chọn
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Danh sách tất cả ghế của suất chiếu
  const [showtimeSeats, setShowtimeSeats] = useState([]);

  // Trạng thái loading khi tải ghế
  const [seatsLoading, setSeatsLoading] = useState(false);

  // Trạng thái đang xử lý đặt vé
  const [isBooking, setIsBooking] = useState(false);

  // Nhóm suất chiếu theo ID rạp để hiển thị tab
  const showtimesByTheater = showtimes.reduce((acc, theater) => {
    acc[theater.theaterId] = theater;
    return acc;
  }, {});

  // Hàm lọc suất chiếu theo ngày đã chọn
  const filterShowtimesByDate = (showtimes, date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    return showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      showtimeDate.setHours(0, 0, 0, 0);
      return showtimeDate.getTime() === selectedDate.getTime();
    });
  };

  // Xử lý khi người dùng thay đổi ngày
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };

  // Lấy danh sách ghế cho một suất chiếu cụ thể
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
      console.error('Lỗi khi tải ghế:', error);
      message.error('Không thể tải thông tin ghế');
      setShowtimeSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  };

  // Khi click vào một suất chiếu
  const handleShowtimeClick = async (showtime) => {
    try {
      // Gọi API lấy chi tiết suất chiếu
      const showtimeDetails = await showtimeApi.getShowtimeById(showtime.id);
      const fullShowtimeData = showtimeDetails.content.showtime;

      // Chuyển đổi dữ liệu suất chiếu
      const transformedShowtime = {
        _id: fullShowtimeData._id,
        movieId: fullShowtimeData.movieId?._id || fullShowtimeData.movieId,
        screenId: fullShowtimeData.screenId?._id || fullShowtimeData.screenId,
        startTime: fullShowtimeData.startTime,
        endTime: fullShowtimeData.endTime,
        screenName: fullShowtimeData.screenId?.name || "Không xác định",
        movieTitle: fullShowtimeData.movieId?.title || "Không xác định",
        duration: fullShowtimeData.movieId?.duration,
        prices: fullShowtimeData.price,
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

      setSelectedShowtime(transformedShowtime);
      await fetchShowtimeSeats(showtime.id); // Lấy ghế
      setSelectedSeats([]); // Reset ghế đã chọn
      setIsLayoutModalVisible(true); // Mở modal
    } catch (error) {
      console.error('Lỗi lấy suất chiếu:', error);
      message.error('Không thể tải thông tin suất chiếu');
    }
  };

  // Xử lý đặt vé
  const handleShowtimeSelect = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      message.warning('Vui lòng chọn ít nhất một ghế');
      return;
    }

    const totalPrice = calculateTotalPrice(); // Tính tổng tiền

    setIsBooking(true);

    try {
      // Chuẩn bị dữ liệu đặt vé
      const bookingData = {
        showtimeId: selectedShowtime._id,
        movieId: selectedShowtime.movieId,
        screenId: selectedShowtime.screenId,
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

      const response = await bookingApi.createBooking(bookingData);
      message.success('Đặt vé thành công!');

      if (typeof onShowtimeSelect === 'function') {
        onShowtimeSelect(selectedShowtime._id, selectedSeats);
      }

      setIsLayoutModalVisible(false); // Đóng modal
    } catch (error) {
      console.error('Lỗi đặt vé:', error);
      message.error('Đặt vé thất bại: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setIsBooking(false);
    }
  };

  // Tính tổng giá vé dựa trên ghế đã chọn
  const calculateTotalPrice = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return 0;

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

  // Format giờ từ chuỗi ISO
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Danh sách ID rạp dùng làm key trong Tabs
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
      {/* Tabs hiển thị danh sách rạp */}
      {theaterIds.length > 0 ? (
        <Tabs defaultActiveKey={theaterIds[0]} tabPosition="left">
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
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-3">{theater.theaterName}</h3>
                  <p className="text-gray-600 mb-4">
                    {theater.location?.address}, {theater.location?.city}
                  </p>

                  {/* Danh sách các suất chiếu theo ngày */}
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

      {/* Modal bố cục ghế */}
      <Modal
        title="Chọn ghế"
        visible={isLayoutModalVisible}
        onCancel={() => setIsLayoutModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsLayoutModalVisible(false)}>Đóng</Button>,
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
            <div className="mb-4 text-center">
              <h3 className="font-semibold">{selectedShowtime.screenName}</h3>
              <p>{formatTime(selectedShowtime.startTime)}</p>
            </div>

            {/* Component layout rạp */}
            <TheaterLayout
              showtimeId={selectedShowtime._id}
              seats={showtimeSeats}
              editable={true}
              onSeatSelect={setSelectedSeats}
              showtimeDetails={selectedShowtime}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

ShowtimeSection.propTypes = {
  showtimes: PropTypes.array.isRequired,
  onShowtimeSelect: PropTypes.func
};

export default ShowtimeSection;
