// src/components/TheaterLayout.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

const TheaterLayout = ({ showtimeId, seats, editable, onSeatSelect }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Log dữ liệu props khi component render
  console.log('TheaterLayout props:', { showtimeId, seats, editable });

  const handleSeatClick = (seat) => {
    if (!editable || seat.status !== 'available') return;

    setSelectedSeats(prev => {
      const isAlreadySelected = prev.some(s => s.id === seat.id);
      let newSelection;

      if (isAlreadySelected) {
        newSelection = prev.filter(s => s.id !== seat.id);
      } else {
        newSelection = [...prev, seat];
      }

      console.log('Selected seats updated:', newSelection);
      onSeatSelect?.(newSelection);
      return newSelection;
    });
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

  const renderSeats = () => {
    console.log('Rendering seats with data:', seats);

    if (!seats || seats.length === 0) {
      console.log('No seats to render');
      return <div>Không có ghế nào để hiển thị</div>;
    }

    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    console.log('Seats grouped by row:', seatsByRow);

    return Object.entries(seatsByRow).map(([row, rowSeats]) => (
      <div key={row} className="flex items-center mb-2">
        <div className="mr-4 font-bold">{row}</div>
        <div className="flex space-x-2">
          {rowSeats.sort((a, b) => a.number - b.number).map(seat => (
            <button
              key={seat.id}
              className={`w-10 h-10 rounded flex items-center justify-center ${getSeatColor(seat)} ${getSeatBorder(seat)}`}
              onClick={() => handleSeatClick(seat)}
              disabled={!editable || seat.status !== 'available'}
              title={`${seat.row}${seat.number} - ${seat.type.toUpperCase()}`}
            >
              {seat.number}
            </button>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Bố trí ghế (Showtime ID: {showtimeId})</h2>
      <div className="w-full bg-gray-800 text-white text-center py-2 mb-4">MÀN HÌNH</div>
      {renderSeats()}
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
        </div>
      )}
    </div>
  );
};

TheaterLayout.propTypes = {
  showtimeId: PropTypes.string,
  seats: PropTypes.array,
  editable: PropTypes.bool,
  onSeatSelect: PropTypes.func
};

TheaterLayout.defaultProps = {
  seats: [],
  editable: false,
  onSeatSelect: () => { }
};

export default TheaterLayout;