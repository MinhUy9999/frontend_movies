import React, { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import showtimeApi from '../apis/showtimeApi';

const SeatSelection = ({ showtimeId, onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [priceInfo, setPriceInfo] = useState({});
  const { addEventListener, removeEventListener } = useWebSocket();

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
          const seatResponse = await showtimeApi.getShowtimeSeats(showtimeId);
          if (seatResponse.statusCode === 200 && seatResponse.content?.seats) {
            setSeats(seatResponse.content.seats);
          } else {
            console.error('Error fetching seats:', seatResponse.message);
          }
        } else {
          console.error('Error fetching showtime:', response.message);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
    const unsubscribe = addEventListener('seats_updated', handleSeatsUpdated);

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [showtimeId, addEventListener, removeEventListener]);

  // Handle seat selection
  const handleSeatClick = (seatId, status, seatType) => {
    if (status !== 'available' && !selectedSeats.includes(seatId)) {
      return; // Can't select unavailable seats
    }

    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      let newSelection;
      
      if (isSelected) {
        // Remove seat if already selected
        newSelection = prev.filter(id => id !== seatId);
      } else {
        // Add seat if not already selected
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
      // Find the seat in our seats array
      for (const row of seats) {
        const seat = row.seats.find(s => s.id === seatId);
        if (seat) {
          const price = priceInfo[seat.type] || 0;
          total += price;
          seatsInfo.push({
            id: seat.id,
            row: row.row,
            number: seat.number,
            type: seat.type,
            price
          });
          break;
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

  // Seat legend component
  const SeatLegend = () => (
    <div className="flex flex-wrap gap-4 justify-center mb-6 mt-2">
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

  // Render seat type sections with pricing information
  const SeatPricing = () => (
    <div className="bg-gray-100 p-4 rounded-lg mb-6">
      <h3 className="text-center font-bold mb-2">Seat Pricing</h3>
      <div className="flex flex-wrap justify-center gap-6">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-green-500 rounded mr-2"></div>
          <span>Standard: {formatCurrency(priceInfo.standard || 0)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-blue-500 rounded mr-2"></div>
          <span>Premium: {formatCurrency(priceInfo.premium || 0)}</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-gray-200 border-2 border-purple-500 rounded mr-2"></div>
          <span>VIP: {formatCurrency(priceInfo.vip || 0)}</span>
        </div>
      </div>
    </div>
  );

  // Get border color based on seat type
  const getSeatTypeBorder = (type) => {
    switch (type) {
      case 'vip': return 'border-purple-500';
      case 'premium': return 'border-blue-500';
      case 'standard': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };
  
  // Get background color based on seat status and selection
  const getSeatBackground = (seat, isSelected) => {
    if (isSelected) return 'bg-blue-500 text-white';
    
    switch (seat.status) {
      case 'booked': return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved': return 'bg-yellow-500 text-white cursor-not-allowed';
      default: return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-center">Select Your Seats</h2>
      
      {/* Seat type pricing info */}
      <SeatPricing />
      
      {/* Status legend */}
      <SeatLegend />
      
      {/* Seating layout */}
      <div className="mb-8 overflow-x-auto">
        <div className="w-full py-2 bg-gray-800 text-white font-bold rounded-lg mb-8 text-center">
          SCREEN
        </div>
        
        <div className="flex flex-col items-center">
          {seats.map(row => (
            <div key={row.row} className="flex mb-2 w-full justify-center">
              <div className="w-8 text-center font-bold pt-1">{row.row}</div>
              <div className="flex gap-1 flex-wrap justify-center">
                {row.seats.map(seat => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const bgColor = getSeatBackground(seat, isSelected);
                  const borderColor = getSeatTypeBorder(seat.type);
                  
                  return (
                    <button
                      key={seat.id}
                      className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium ${bgColor} border-2 ${borderColor} transition-colors duration-200`}
                      onClick={() => handleSeatClick(seat.id, seat.status, seat.type)}
                      disabled={seat.status !== 'available' && !selectedSeats.includes(seat.id)}
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
      <div className="mt-6 border-t pt-4">
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
                  onClick={() => handleSeatClick(seat.id)}
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
          <p className="text-gray-500">No seats selected yet.</p>
        )}
      </div>
    </div>
  );
};

export default SeatSelection;