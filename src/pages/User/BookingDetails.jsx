import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, Button, Tag, Descriptions, Spin, message, Modal } from 'antd';
import { ExclamationCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import bookingApi from '../../apis/bookingApi';
import { useSocket } from "../../contexts/WebSocketContext";

const { confirm } = Modal;

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.user);
  const { addEventListener } = useSocket();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilShowtime, setTimeUntilShowtime] = useState(null);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      message.error('Please log in to view booking details');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingApi.getBookingDetails(bookingId);
        
        if (response.statusCode === 200 && response.content?.booking) {
          setBooking(response.content.booking);
        } else {
          message.error('Failed to load booking details');
          navigate('/user/bookings');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        message.error('Error loading booking details');
        navigate('/user/bookings');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && bookingId) {
      fetchBookingDetails();
    }
  }, [isAuthenticated, bookingId, navigate]);
  
  // Listen for WebSocket updates
  useEffect(() => {
    const handleBookingUpdated = (data) => {
      if (data.bookingId === bookingId) {
        // Refresh booking details when a relevant event is received
        const fetchUpdatedBooking = async () => {
          try {
            const response = await bookingApi.getBookingDetails(bookingId);
            if (response.statusCode === 200 && response.content?.booking) {
              setBooking(response.content.booking);
            }
          } catch (error) {
            console.error('Error refreshing booking details:', error);
          }
        };
        
        fetchUpdatedBooking();
      }
    };
    
    // Subscribe to various booking-related events
    const unsubscribeConfirmed = addEventListener('booking_confirmed', handleBookingUpdated);
    const unsubscribeExpired = addEventListener('booking_expired', handleBookingUpdated);
    const unsubscribeCancelled = addEventListener('booking_cancelled', handleBookingUpdated);
    
    return () => {
      unsubscribeConfirmed();
      unsubscribeExpired();
      unsubscribeCancelled();
    };
  }, [bookingId, addEventListener]);
  
  // Calculate time until showtime
  useEffect(() => {
    if (!booking || !booking.showtimeId || !booking.showtimeId.startTime) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const showtime = new Date(booking.showtimeId.startTime);
      const diff = showtime - now;
      
      if (diff <= 0) {
        setTimeUntilShowtime('Showtime has started');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeUntilShowtime(`${days} days, ${hours} hours until showtime`);
      } else if (hours > 0) {
        setTimeUntilShowtime(`${hours} hours, ${minutes} minutes until showtime`);
      } else {
        setTimeUntilShowtime(`${minutes} minutes until showtime`);
      }
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [booking]);
  
  // Handle booking cancellation
  const handleCancelBooking = () => {
    if (!booking) return;
    
    // Check if booking can be cancelled (e.g., not too close to showtime)
    const showtime = new Date(booking.showtimeId?.startTime);
    const now = new Date();
    const hoursDiff = (showtime - now) / (1000 * 60 * 60);
    
    if (hoursDiff < 3) {
      message.error('Bookings can only be cancelled at least 3 hours before showtime');
      return;
    }
    
    confirm({
      title: 'Are you sure you want to cancel this booking?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone',
      onOk: async () => {
        try {
          const response = await bookingApi.cancelBooking(bookingId);
          
          if (response.statusCode === 200) {
            message.success('Booking cancelled successfully');
            // Update the booking status
            setBooking(prev => ({ ...prev, bookingStatus: 'cancelled' }));
          } else {
            message.error(response.message || 'Failed to cancel booking');
          }
        } catch (error) {
          console.error('Error cancelling booking:', error);
          message.error('Error cancelling booking');
        }
      },
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }
  
  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <div className="text-center py-8">
            <CloseCircleOutlined className="text-red-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button type="primary" onClick={() => navigate('/user/bookings')}>
              Back to My Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Determine the status icon and color
  let StatusIcon;
  let statusColor;
  
  switch (booking.bookingStatus) {
    case 'confirmed':
      StatusIcon = CheckCircleOutlined;
      statusColor = 'green';
      break;
    case 'cancelled':
      StatusIcon = CloseCircleOutlined;
      statusColor = 'red';
      break;
    case 'reserved':
    default:
      StatusIcon = ClockCircleOutlined;
      statusColor = 'orange';
  }
  
  // Extract movie, theater and screen info
  const movie = booking.showtimeId?.movieId || {};
  const screen = booking.showtimeId?.screenId || {};
  const theater = screen?.theaterId || {};
  
  // Format the showtime
  const formattedShowtime = booking.showtimeId?.startTime 
    ? new Date(booking.showtimeId.startTime).toLocaleString() 
    : 'N/A';
  
  // Format the booking date
  const formattedBookingDate = booking.bookedAt 
    ? new Date(booking.bookedAt).toLocaleString() 
    : 'N/A';
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Button className="mb-4" onClick={() => navigate('/user/bookings')}>
        &lt; Back to My Bookings
      </Button>
      
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <div className="flex items-center mt-2 sm:mt-0">
            <StatusIcon className={`text-${statusColor}-500 mr-2 text-xl`} />
            <Tag color={statusColor} className="text-base">
              {booking.bookingStatus.toUpperCase()}
            </Tag>
          </div>
        </div>
        
        {timeUntilShowtime && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center">
            <ClockCircleOutlined className="mr-2 text-blue-500" />
            <span>{timeUntilShowtime}</span>
          </div>
        )}
        
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Booking ID" span={2}>{booking._id}</Descriptions.Item>
          <Descriptions.Item label="Movie" span={2}>{movie.title || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Theater">{theater.name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Screen">{screen.name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Showtime">{formattedShowtime}</Descriptions.Item>
          <Descriptions.Item label="Booked On">{formattedBookingDate}</Descriptions.Item>
          <Descriptions.Item label="Payment Method">{booking.paymentMethod || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Tag color={booking.paymentStatus === 'completed' ? 'green' : 'orange'}>
              {booking.paymentStatus?.toUpperCase() || 'N/A'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Card title="Seat Information" className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Selected Seats</h3>
            <div className="flex flex-wrap gap-2">
              {booking.seats && booking.seats.length > 0 ? (
                booking.seats.map((seat, index) => (
                  <Tag key={index} className="px-3 py-1 text-base">
                    {seat.row}{seat.seatNumber}
                  </Tag>
                ))
              ) : (
                <span>No seat information available</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Pricing</h3>
            <p>Total Amount: <span className="font-bold">{booking.totalAmount} VND</span></p>
          </div>
        </div>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          type="primary"
          onClick={() => window.print()}
        >
          Print Ticket
        </Button>
        
        {booking.bookingStatus !== 'cancelled' && (
          <Button 
            danger
            onClick={handleCancelBooking}
            disabled={new Date(booking.showtimeId?.startTime) <= new Date(Date.now() + 3 * 60 * 60 * 1000)}
          >
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;