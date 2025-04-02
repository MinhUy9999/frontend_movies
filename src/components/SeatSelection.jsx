import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { apiSeats } from '../apis/seatApi';

const SeatSelection = ({ showtimeId, onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Move fetchSeats outside useEffect
  const fetchSeats = async () => {
    if (!showtimeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const seatResponse = await apiSeats.getSeatsByShowtime(showtimeId);
      if (seatResponse && seatResponse.content) {
        const transformedSeats = seatResponse.content.map(seat => ({
          id: seat._id,
          row: seat.row,
          number: seat.seatNumber,
          type: seat.seatType,
          status: seat.status
        }));
        setSeats(transformedSeats);
      } else {
        setSeats([]);
      }
    } catch (err) {
      setError(err.message);
      setSeats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [showtimeId]);

  const handleSeatClick = async (seat) => {
    if (seat.status !== 'available') return;

    setSelectedSeats(prev => {
      const isAlreadySelected = prev.some(s => s.id === seat.id);
      let newSelection;

      if (isAlreadySelected) {
        newSelection = prev.filter(s => s.id !== seat.id);
      } else {
        newSelection = [...prev, seat];
      }

      onSeatSelect?.(newSelection);
      return newSelection;
    });
  };

  const renderSeats = () => {
    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    return Object.entries(seatsByRow).map(([row, rowSeats]) => (
      <div key={row} className="flex items-center mb-2">
        <div className="mr-4 font-bold">{row}</div>
        <div className="flex space-x-2">
          {rowSeats.sort((a, b) => a.number - b.number).map(seat => (
            <button
              key={seat.id}
              className={`w-10 h-10 rounded flex items-center justify-center ${getSeatColor(seat)} ${getSeatBorder(seat)}`}
              onClick={() => handleSeatClick(seat)}
              disabled={seat.status !== 'available'}
              title={`${seat.row}${seat.number} - ${seat.type.toUpperCase()}`}
            >
              {seat.number}
            </button>
          ))}
        </div>
      </div>
    ));
  };

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) return 'bg-blue-500 text-white';
    switch (seat.status) {
      case 'available': return 'bg-green-200 hover:bg-green-300';
      case 'booked': return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved': return 'bg-yellow-500 text-white cursor-not-allowed';
      default: return 'bg-gray-200';
    }
  };

  const getSeatBorder = (seat) => {
    switch (seat.type) {
      case 'standard': return 'border-2 border-green-500';
      case 'premium': return 'border-2 border-blue-500';
      case 'vip': return 'border-2 border-purple-500';
      default: return 'border-2 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4">Đang tải dữ liệu ghế...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Lỗi: {error}
        <button
          onClick={fetchSeats} // Now fetchSeats is accessible
          className="ml-4 bg-blue-500 text-white px-2 py-1 rounded"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Chọn ghế</h2>
      <div className="w-full bg-gray-800 text-white text-center py-2 mb-4">MÀN HÌNH</div>
      {seats.length > 0 ? renderSeats() : <div>Không có ghế nào để hiển thị</div>}
      <div className="mt-4 flex space-x-4">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-green-200 border-2 border-green-500 mr-2"></div>
          <span>Thường</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-blue-200 border-2 border-blue-500 mr-2"></div>
          <span>Cao cấp</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-purple-200 border-2 border-purple-500 mr-2"></div>
          <span>VIP</span>
        </div>
      </div>
      {selectedSeats.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Ghế đã chọn:</h3>
          <div className="flex space-x-2">
            {selectedSeats.map(seat => (
              <span key={seat.id} className="bg-blue-100 px-2 py-1 rounded">
                {seat.row}{seat.number} ({seat.type})
              </span>
            ))}
          </div>
          <button
            onClick={() => onSeatSelect?.(selectedSeats)}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Xác nhận chọn ghế
          </button>
        </div>
      )}
    </div>
  );
};

SeatSelection.propTypes = {
  showtimeId: PropTypes.string.isRequired,
  onSeatSelect: PropTypes.func
};

SeatSelection.defaultProps = {
  onSeatSelect: () => { }
};

export default SeatSelection;