// src/components/SeatSelection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import showtimeApi from '../apis/showtimeApi';

const SeatSelection = ({ showtimeId, onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [priceInfo, setPriceInfo] = useState({});
  const { addEventListener, removeEventListener } = useWebSocket();

  // Create a predefined layout with rows A-I and columns 1-9
  const generateInitialLayout = () => {
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const layout = [];
    
    // Define seat types based on rows
    rowLabels.forEach(row => {
      const seats = [];
      for (let seatNumber = 1; seatNumber <= 9; seatNumber++) {
        let seatType = 'standard';
        // Thiết lập loại ghế theo yêu cầu mới:
        // A, B, C là standard
        // D, E, F là premium
        // G, H, I là vip
        if (row === 'D' || row === 'E' || row === 'F') {
          seatType = 'premium';
        } else if (row === 'G' || row === 'H' || row === 'I') {
          seatType = 'vip';
        }
        
        seats.push({
          id: `${row}${seatNumber}`,
          number: seatNumber,
          type: seatType,
          status: 'available'
        });
      }
      
      layout.push({
        row,
        seats
      });
    });
    
    return layout;
  };

  // Fetch initial seats data and price information
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await showtimeApi.getShowtimeById(showtimeId);
        
        if (response.statusCode === 200 && response.content?.showtime) {
          // Get pricing information from showtime
          const showtime = response.content.showtime;
          setPriceInfo(showtime.price || {
            standard: 70000,
            premium: 90000,
            vip: 120000
          });
          
          // Now fetch seats
          try {
            const seatResponse = await showtimeApi.getShowtimeSeats(showtimeId);
            if (seatResponse.statusCode === 200 && seatResponse.content?.seats) {
              setSeats(seatResponse.content.seats);
            } else {
              // If API fails, use the predefined layout
              setSeats(generateInitialLayout());
              console.warn('Using predefined seat layout');
            }
          } catch (error) {
            // If API fails, use the predefined layout
            setSeats(generateInitialLayout());
            console.warn('Using predefined seat layout due to API error');
          }
        } else {
          setSeats(generateInitialLayout());
          setPriceInfo({
            standard: 70000,
            premium: 90000,
            vip: 120000
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fall back to predefined layout
        setSeats(generateInitialLayout());
        setPriceInfo({
          standard: 70000,
          premium: 90000,
          vip: 120000
        });
      } finally {
        setLoading(false);
      }
    };

    if (showtimeId) {
      fetchSeats();
    } else {
      // If no showtimeId is provided, use predefined layout
      setSeats(generateInitialLayout());
      setPriceInfo({
        standard: 70000,
        premium: 90000,
        vip: 120000
      });
      setLoading(false);
    }
  }, [showtimeId]);

  // Listen for seat updates via WebSocket
  useEffect(() => {
    const handleSeatsUpdated = async (data) => {
      if (data.showtimeId === showtimeId) {
        // Refetch seats when we get a WebSocket update
        try {
          const seatResponse = await showtimeApi.getShowtimeSeats(showtimeId);
          if (seatResponse.statusCode === 200 && seatResponse.content?.seats) {
            setSeats(seatResponse.content.seats);
            
            // Remove any selected seats that are no longer available
            setSelectedSeats(prev => 
              prev.filter(seatId => {
                const allSeats = seatResponse.content.seats.flatMap(row => row.seats);
                const seatExists = allSeats.some(s => 
                  s.id === seatId && s.status === 'available'
                );
                return seatExists;
              })
            );
          }
        } catch (error) {
          console.error('Error refreshing seats:', error);
        }
      }
    };

    // Add event listener for 'seats_updated' events
    const unsubscribe = addEventListener ? addEventListener('seats_updated', handleSeatsUpdated) : () => {};

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [showtimeId, addEventListener, removeEventListener]);

  // Handle seat selection - Sửa lỗi không chọn được ghế
  const handleSeatClick = (seatId, status) => {
    // Kiểm tra nếu ghế đã được đặt hoặc không có sẵn
    if (status !== 'available' && !selectedSeats.includes(seatId)) {
      console.log(`Cannot select unavailable seat: ${seatId}, status: ${status}`);
      return; // Can't select unavailable seats
    }

    console.log(`Seat clicked: ${seatId}, current status: ${status}`);
    
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      let newSelection;
      
      if (isSelected) {
        // Remove seat if already selected
        console.log(`Removing seat: ${seatId} from selection`);
        newSelection = prev.filter(id => id !== seatId);
      } else {
        // Add seat if not already selected
        console.log(`Adding seat: ${seatId} to selection`);
        newSelection = [...prev, seatId];
      }
      
      // Notify parent component
      if (onSeatSelect) {
        onSeatSelect(newSelection);
      }
      
      return newSelection;
    });
  };

  // Calculate total price based on selected seats
  const { totalPrice, selectedSeatsInfo } = useMemo(() => {
    let total = 0;
    const seatsInfo = [];
    
    selectedSeats.forEach(seatId => {
      // Extract row letter from seatId (first character)
      const rowLetter = seatId.charAt(0);
      // Extract seat number from seatId (remaining characters)
      const seatNumber = parseInt(seatId.substring(1));
      
      // Xác định loại ghế dựa trên hàng
      let seatType = 'standard';
      if (['D', 'E', 'F'].includes(rowLetter)) {
        seatType = 'premium';
      } else if (['G', 'H', 'I'].includes(rowLetter)) {
        seatType = 'vip';
      }
      
      // Find the row and seat in our seats array
      const row = seats.find(r => r.row === rowLetter);
      if (row) {
        const seat = row.seats.find(s => s.number === seatNumber);
        if (seat) {
          const price = priceInfo[seat.type] || 0;
          total += price;
          seatsInfo.push({
            id: seatId,
            row: rowLetter,
            number: seatNumber,
            type: seat.type,
            price
          });
        }
      }
    });
    
    return { totalPrice: total, selectedSeatsInfo: seatsInfo };
  }, [selectedSeats, seats, priceInfo]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Select Your Seats</h2>
      
      {/* Screen */}
      <div className="mb-8">
        <div className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg mb-6 text-center">
          SCREEN
        </div>
        
        {/* Seat legend */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
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
        
        {/* Seat pricing info */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h3 className="text-center font-bold mb-2">Seat Pricing</h3>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 border-2 border-green-500 rounded mr-2"></div>
              <span>Standard (A-C): {formatCurrency(priceInfo.standard || 0)}</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 border-2 border-blue-500 rounded mr-2"></div>
              <span>Premium (D-F): {formatCurrency(priceInfo.premium || 0)}</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 border-2 border-purple-500 rounded mr-2"></div>
              <span>VIP (G-I): {formatCurrency(priceInfo.vip || 0)}</span>
            </div>
          </div>
        </div>
        
        {/* Seating layout */}
        <div className="flex flex-col items-center space-y-2">
          {seats.map(row => (
            <div key={row.row} className="flex items-center">
              <div className="w-8 text-center font-bold">{row.row}</div>
              <div className="flex gap-2">
                {row.seats.map(seat => {
                  const seatId = `${row.row}${seat.number}`;
                  const isSelected = selectedSeats.includes(seatId);
                  
                  // Determine seat status color
                  let bgColor = "bg-gray-200 hover:bg-gray-300";
                  if (isSelected) {
                    bgColor = "bg-blue-500 text-white";
                  } else if (seat.status === 'booked') {
                    bgColor = "bg-red-500 text-white cursor-not-allowed";
                  } else if (seat.status === 'reserved') {
                    bgColor = "bg-yellow-500 text-white cursor-not-allowed";
                  }
                  
                  // Determine seat type border
                  let borderColor = "border-green-500"; // standard
                  if (['D', 'E', 'F'].includes(row.row)) {
                    borderColor = "border-blue-500"; // premium
                  } else if (['G', 'H', 'I'].includes(row.row)) {
                    borderColor = "border-purple-500"; // vip
                  }
                  
                  // Thêm console.log để debug
                  console.log(`Rendering seat: ${seatId}, status: ${seat.status}, isSelected: ${isSelected}`);
                  
                  return (
                    <button
                      key={seatId}
                      className={`w-9 h-9 rounded flex items-center justify-center text-sm font-medium ${bgColor} border-2 ${borderColor} transition-colors duration-200`}
                      onClick={() => handleSeatClick(seatId, seat.status)}
                      disabled={seat.status !== 'available' && !isSelected}
                      title={`${row.row}${seat.number} - ${seat.type.toUpperCase()} - ${formatCurrency(priceInfo[seat.type] || 0)}`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
              <div className="w-8"></div> {/* Spacer for symmetry */}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selection summary */}
      <div className="mt-8 border-t pt-4">
        <h3 className="font-bold text-lg mb-2">Your Selection</h3>
        
        {selectedSeats.length > 0 ? (
          <div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="font-semibold">Seat</div>
              <div className="font-semibold">Type</div>
              <div className="font-semibold">Price</div>
              <div></div>
            </div>
            
            {selectedSeatsInfo.map(seat => (
              <div key={seat.id} className="grid grid-cols-4 gap-2 mb-1 items-center">
                <div>{seat.row}{seat.number}</div>
                <div className="capitalize">{seat.type}</div>
                <div>{formatCurrency(seat.price)}</div>
                <button 
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => handleSeatClick(seat.id, 'available')}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No seats selected yet. Please select your seats from the seating chart above.</p>
        )}
      </div>
    </div>
  );
};

export default SeatSelection;