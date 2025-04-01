// src/components/PaymentAndTicketSummary.jsx
import React from 'react';
import { Card, Divider, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';

const PaymentAndTicketSummary = ({ 
  movie, 
  theater, 
  screen, 
  showtime, 
  selectedSeats, 
  seatDetails = [],
  totalAmount 
}) => {
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
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
  
  // Format time
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
        <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
        
        {/* Movie Info */}
        <div className="mb-4">
          <h4 className="font-medium text-lg">{movie?.title || 'Movie'}</h4>
          
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
            <span>{theater?.name || 'Theater'} - {screen?.name || 'Screen'}</span>
          </div>
        </div>
        
        <Divider className="my-3" />
        
        {/* Seats */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Selected Seats</h4>
          
          {selectedSeats && selectedSeats.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSeats.map((seatId) => {
                  // Find seat details if available
                  const seatDetail = seatDetails.find(s => s.id === seatId);
                  const seatType = seatDetail ? seatDetail.type : 'standard';
                  
                  // Determine color based on seat type
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
              
              {/* Seat type details */}
              {seatDetails && seatDetails.length > 0 && (
                <div className="space-y-2 text-sm">
                  {['standard', 'premium', 'vip'].map(type => {
                    const typeSeats = seatDetails.filter(seat => seat.type === type);
                    if (typeSeats.length === 0) return null;
                    
                    return (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type} seats ({typeSeats.length})</span>
                        <span>
                          {formatCurrency(typeSeats[0].price)} × {typeSeats.length} = 
                          {formatCurrency(typeSeats[0].price * typeSeats.length)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No seats selected</div>
          )}
        </div>
        
        <Divider className="my-3" />
        
        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
};

export default PaymentAndTicketSummary;