// src/components/PaymentAndTicketSummary.jsx
import { Card, Divider, Tag } from 'antd';
import PropTypes from 'prop-types';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';

// Component hiển thị tóm tắt vé và thanh toán
const PaymentAndTicketSummary = ({
  movie,
  theater,
  screen,
  showtime,
  selectedSeats,
  seatDetails = [],
  totalAmount
}) => {

  // Định dạng tiền tệ VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Định dạng giờ
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4">Tóm tắt đặt vé</h3>

        {/* Thông tin phim */}
        <div className="mb-4">
          <h4 className="font-medium text-lg">{movie?.title || 'Phim'}</h4>

          <div className="flex items-center text-gray-600 mt-1">
            <CalendarOutlined className="mr-2" />
            <span>{formatDate(showtime?.startTime)}</span>
          </div>

          <div className="flex items-center text-gray-600 mt-1">
            <ClockCircleOutlined className="mr-2" />
            <span>{formatTime(showtime?.startTime)}</span>
          </div>

          <div className="flex items-center text-gray-600 mt-1">
            <EnvironmentOutlined className="mr-2" />
            <span>{theater?.name || 'Rạp'} - {screen?.name || 'Phòng chiếu'}</span>
          </div>
        </div>

        <Divider className="my-3" />

        {/* Ghế đã chọn */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Ghế đã chọn</h4>

          {selectedSeats && selectedSeats.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSeats.map((seatId) => {
                  // Tìm thông tin chi tiết ghế nếu có
                  const seatDetail = seatDetails.find(s => s.id === seatId);
                  const seatType = seatDetail ? seatDetail.type : 'standard';

                  // Xác định màu dựa trên loại ghế
                  let color = 'default';
                  if (seatType === 'premium') color = 'blue';
                  if (seatType === 'vip') color = 'purple';

                  return (
                    <Tag key={seatId} color={color}>
                      {seatId}
                    </Tag>
                  );
                })}
              </div>

              {/* Chi tiết loại ghế */}
              {seatDetails && seatDetails.length > 0 && (
                <div className="space-y-2 text-sm">
                  {['standard', 'premium', 'vip'].map(type => {
                    const typeSeats = seatDetails.filter(seat => seat.type === type);
                    if (typeSeats.length === 0) return null;

                    // Chuyển đổi tên loại ghế sang tiếng Việt
                    const typeInVietnamese = type === 'standard' ? 'Thường' :
                      type === 'premium' ? 'Cao cấp' : 'VIP';

                    return (
                      <div key={type} className="flex justify-between">
                        <span>Ghế {typeInVietnamese} ({typeSeats.length})</span>
                        <span>
                          {formatCurrency(typeSeats[0].price)} × {typeSeats.length} = {' '}
                          {formatCurrency(typeSeats[0].price * typeSeats.length)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Chưa chọn ghế nào</div>
          )}
        </div>

        <Divider className="my-3" />

        {/* Tổng tiền */}
        <div className="flex justify-between font-bold text-lg">
          <span>Tổng tiền</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
};

// Định nghĩa PropTypes để xác thực props
PaymentAndTicketSummary.propTypes = {
  movie: PropTypes.shape({
    title: PropTypes.string,
    // Thêm các thuộc tính khác của phim nếu cần
  }),
  theater: PropTypes.shape({
    name: PropTypes.string,
    // Thêm các thuộc tính khác của rạp nếu cần
  }),
  screen: PropTypes.shape({
    name: PropTypes.string,
    // Thêm các thuộc tính khác của phòng chiếu nếu cần
  }),
  showtime: PropTypes.shape({
    startTime: PropTypes.string,
    // Thêm các thuộc tính khác của suất chiếu nếu cần
  }),
  selectedSeats: PropTypes.arrayOf(PropTypes.string),
  seatDetails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      // Thêm các thuộc tính khác của chi tiết ghế nếu cần
    })
  ),
  totalAmount: PropTypes.number
};

export default PaymentAndTicketSummary;