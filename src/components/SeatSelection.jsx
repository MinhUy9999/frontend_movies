// src/components/SeatSelection.jsx
import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import showtimeApi from '../apis/showtimeApi';

const SeatSelection = ({ showtimeId, onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const { addEventListener, removeEventListener } = useWebSocket();

  // Fetch initial seats data
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await showtimeApi.getShowtimeSeats(showtimeId);
        if (response.statusCode === 200 && response.content.seats) {
          setSeats(response.content.seats);
        } else {
          console.error('Error fetching seats:', response.message);
        }
      } catch (error) {
        console.error('Error fetching seats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (showtimeId) {
      fetchSeats();
    }
  }, [showtimeId]);

  // Listen for seat updates via WebSocket
  useEffect(() => {
    const handleSeatsUpdated = async (data) => {
      if (data.showtimeId === showtimeId) {
        // Refetch seats when we get a WebSocket update
        try {
          const response = await showtimeApi.getShowtimeSeats(showtimeId);
          if (response.statusCode === 200 && response.content.seats) {
            setSeats(response.content.seats);
            
            // Remove any selected seats that are no longer available
            setSelectedSeats(prev => 
              prev.filter(seatId => {
                const allSeats = response.content.seats.flatMap(row => row.seats);
                const seat = allSeats.find(s => s.id === seatId);
                return seat && seat.status === 'available';
              })
            );
          }
        } catch (error) {
          console.error('Error refreshing seats:', error);
        }
      }
    };

    // Add event listener for 'seats_updated' events
    const unsubscribe = addEventListener('seats_updated', handleSeatsUpdated);

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [showtimeId, addEventListener, removeEventListener]);

  // Handle seat selection
  const handleSeatClick = (seatId, status) => {
    if (status !== 'available' && !selectedSeats.includes(seatId)) {
      return; // Can't select unavailable seats
    }

    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      const newSelection = isSelected
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId];
      
      // Notify parent component
      if (onSeatSelect) {
        onSeatSelect(newSelection);
      }
      
      return newSelection;
    });
  };

  if (loading) {
    return <div className="flex justify-center my-8">Loading seats...</div>;
  }

  // Render a legend for seat types and status
  const SeatLegend = () => (
    <div className="flex flex-wrap gap-4 justify-center mb-4">
      <div className="flex items-center">
        <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded mr-2"></div>
        <span>Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 bg-blue-500 border border-blue-600 rounded mr-2"></div>
        <span>Selected</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 bg-red-500 border border-red-600 rounded mr-2"></div>
        <span>Booked</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 bg-yellow-500 border border-yellow-600 rounded mr-2"></div>
        <span>Reserved</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Select Your Seats</h2>
      
      <SeatLegend />
      
      <div className="text-center mb-8">
        <div className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg mb-6">
          SCREEN
        </div>
        
        {seats.map(row => (
          <div key={row.row} className="flex justify-center mb-2">
            <div className="w-8 text-center font-bold pt-1">{row.row}</div>
            <div className="flex gap-1">
              {row.seats.map(seat => {
                let bgColor = 'bg-gray-200 hover:bg-gray-300';
                
                if (selectedSeats.includes(seat.id)) {
                  bgColor = 'bg-blue-500 hover:bg-blue-600 text-white';
                } else if (seat.status === 'booked') {
                  bgColor = 'bg-red-500 cursor-not-allowed text-white';
                } else if (seat.status === 'reserved') {
                  bgColor = 'bg-yellow-500 cursor-not-allowed text-white';
                }
                
                return (
                  <button
                    key={seat.id}
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${bgColor} transition-colors duration-200`}
                    onClick={() => handleSeatClick(seat.id, seat.status)}
                    disabled={seat.status !== 'available' && !selectedSeats.includes(seat.id)}
                    title={`${row.row}${seat.number} - ${seat.type} - ${seat.price} VND`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <p className="font-semibold">Selected Seats: {selectedSeats.length > 0 ? 
          selectedSeats.map(id => {
            const seatInfo = seats
              .flatMap(row => row.seats)
              .find(seat => seat.id === id);
            
            if (seatInfo) {
              return `${seatInfo.row}${seatInfo.number}`;
            }
            return id;
          }).join(', ') : 'None'}
        </p>
      </div>
    </div>
  );
};

export default SeatSelection;