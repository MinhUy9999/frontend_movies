// src/pages/DetailMovie/ShowtimeSection.jsx
import { useState } from 'react'; // Import hook useState để quản lý trạng thái
import PropTypes from 'prop-types'; // Import PropTypes để kiểm tra kiểu dữ liệu props
import { Card, Tabs, DatePicker, Button, Modal } from 'antd'; // Import các component từ thư viện Ant Design
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'; // Import các biểu tượng
import TheaterLayout from '../../components/TheaterLayout'; // Import component bố cục rạp chiếu

const { TabPane } = Tabs; // Lấy component TabPane từ Tabs

// Component chính để hiển thị và chọn suất chiếu
const ShowtimeSection = ({ showtimes, onShowtimeSelect }) => {
  // Khai báo các state cần thiết
  const [selectedDate, setSelectedDate] = useState(new Date()); // Ngày đã chọn
  const [isLayoutModalVisible, setIsLayoutModalVisible] = useState(false); // Trạng thái hiển thị modal
  const [selectedShowtime, setSelectedShowtime] = useState(null); // Suất chiếu đã chọn
  const [selectedSeats, setSelectedSeats] = useState([]); // Danh sách ghế đã chọn

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

  // Xử lý khi nhấp vào một suất chiếu
  const handleShowtimeClick = (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]); // Đặt lại danh sách ghế đã chọn khi thay đổi suất chiếu
    setIsLayoutModalVisible(true);
  };

  // Xử lý khi xác nhận chọn suất chiếu và ghế
  const handleShowtimeSelect = () => {
    if (onShowtimeSelect && selectedShowtime) {
      // Truyền cả ID suất chiếu và danh sách ghế đã chọn
      onShowtimeSelect(selectedShowtime.id, selectedSeats);
    }
    setIsLayoutModalVisible(false);
  };

  // Xử lý khi nhấp vào một ghế
  const handleSeatClick = (seatId, status, type) => {
    if (status === 'available') {
      // Chuyển đổi trạng thái chọn ghế
      setSelectedSeats(prevSeats => {
        const seatIndex = prevSeats.findIndex(seat => seat.id === seatId);

        if (seatIndex >= 0) {
          // Bỏ chọn ghế nếu đã chọn trước đó
          return prevSeats.filter(seat => seat.id !== seatId);
        } else {
          // Thêm ghế nếu chưa được chọn
          return [...prevSeats, { id: seatId, type }];
        }
      });
    }
  };

  // Định dạng thời gian từ chuỗi ngày
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Lấy danh sách ID rạp chiếu để hiển thị tabs
  const theaterIds = Object.keys(showtimesByTheater);

  // Tạo cấu trúc dữ liệu rạp mẫu cho modal
  const getTheaterData = () => {
    // Thông thường dữ liệu này sẽ được lấy từ API dựa trên suất chiếu đã chọn
    return {
      name: selectedShowtime?.screenName || 'Screen 1',
      rows: 9,
      seatsPerRow: 9,
      rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      seats: []
    };
  };

  // Tính tổng giá tiền dựa trên ghế đã chọn
  const calculateTotalPrice = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return 0;

    return selectedSeats.reduce((total, seat) => {
      return total + (selectedShowtime.prices[seat.type] || 0);
    }, 0);
  };

  // Hiển thị giao diện người dùng
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
          onChange={() => {/* Xử lý thay đổi rạp nếu cần */ }}
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
            disabled={selectedSeats.length === 0}
          >
            Đặt vé ({selectedSeats.length})
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
              theaterData={getTheaterData()}
              onSeatClick={handleSeatClick}
              readOnly={false}
              selectedSeats={selectedSeats}
            />

            {/* Thông tin giá vé */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Giá vé:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">Thường</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.standard)}</div>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">Cao cấp</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.premium)}</div>
                </div>
                <div className="text-center p-2 bg-gray-100 rounded">
                  <div className="font-medium">VIP</div>
                  <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedShowtime.prices.vip)}</div>
                </div>
              </div>

              {/* Hiển thị ghế đã chọn và tổng tiền */}
              {selectedSeats.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="font-medium mb-2">Ghế đã chọn:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(seat => (
                      <span key={seat.id} className="px-2 py-1 bg-blue-100 rounded text-sm">
                        {seat.id} ({seat.type === 'standard' ? 'Thường' :
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

// Định nghĩa PropTypes để xác thực kiểu dữ liệu của props
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