// src/pages/User/MyBookings.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import bookingApi from '../../apis/bookingApi';
import { useWebSocket } from '../../contexts/WebSocketContext';

const { confirm } = Modal;

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.user);
  const { addEventListener } = useWebSocket();

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      message.error('Please log in to view your bookings');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await bookingApi.getUserBookings();
        
        if (response.statusCode === 200 && response.content?.bookings) {
          setBookings(response.content.bookings);
        } else {
          message.error('Failed to load bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        message.error('Error loading bookings');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Listen for WebSocket updates
  useEffect(() => {
    const handleBookingUpdated = () => {
      // Refresh bookings when a booking-related event is received
      const fetchUpdatedBookings = async () => {
        try {
          const response = await bookingApi.getUserBookings();
          if (response.statusCode === 200 && response.content?.bookings) {
            setBookings(response.content.bookings);
          }
        } catch (error) {
          console.error('Error refreshing bookings:', error);
        }
      };
      
      fetchUpdatedBookings();
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
  }, [addEventListener]);

  // Handle booking cancellation
  const handleCancelBooking = (bookingId) => {
    confirm({
      title: 'Are you sure you want to cancel this booking?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone',
      onOk: async () => {
        try {
          const response = await bookingApi.cancelBooking(bookingId);
          
          if (response.statusCode === 200) {
            message.success('Booking cancelled successfully');
            // Update the bookings list
            setBookings(prevBookings => 
              prevBookings.map(booking => 
                booking._id === bookingId 
                  ? { ...booking, bookingStatus: 'cancelled' }
                  : booking
              )
            );
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

  // Handle view booking details
  const handleViewBooking = (bookingId) => {
    navigate(`/user/bookings/${bookingId}`);
  };

  // Define table columns
  const columns = [
    {
      title: 'Movie',
      dataIndex: ['showtimeId', 'movieId', 'title'],
      key: 'movie',
      render: (text, record) => {
        // Handle potential nested objects from populated fields
        if (record.showtimeId && typeof record.showtimeId === 'object') {
          if (record.showtimeId.movieId && typeof record.showtimeId.movieId === 'object') {
            return record.showtimeId.movieId.title;
          }
        }
        return 'N/A';
      },
    },
    {
      title: 'Theater',
      key: 'theater',
      render: (_, record) => {
        // Try to access nested theater info if available
        if (record.showtimeId && typeof record.showtimeId === 'object') {
          if (record.showtimeId.screenId && typeof record.showtimeId.screenId === 'object') {
            if (record.showtimeId.screenId.theaterId && typeof record.showtimeId.screenId.theaterId === 'object') {
              return record.showtimeId.screenId.theaterId.name;
            }
          }
        }
        return 'N/A';
      },
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => {
        if (record.showtimeId && typeof record.showtimeId === 'object' && record.showtimeId.startTime) {
          return new Date(record.showtimeId.startTime).toLocaleString();
        }
        return 'N/A';
      },
    },
    {
      title: 'Seats',
      key: 'seats',
      render: (_, record) => {
        return record.seats ? record.seats.length : 0;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount} VND`,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        let color = 'blue';
        let text = record.bookingStatus || 'Unknown';
        
        switch (record.bookingStatus) {
          case 'confirmed':
            color = 'green';
            break;
          case 'reserved':
            color = 'orange';
            break;
          case 'cancelled':
            color = 'red';
            break;
          default:
            color = 'blue';
        }
        
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => {
        let color = 'blue';
        let text = record.paymentStatus || 'Unknown';
        
        switch (record.paymentStatus) {
          case 'completed':
            color = 'green';
            break;
          case 'pending':
            color = 'orange';
            break;
          case 'failed':
          case 'refunded':
            color = 'red';
            break;
          default:
            color = 'blue';
        }
        
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const canCancel = record.bookingStatus !== 'cancelled' && 
                        new Date(record.showtimeId?.startTime) > new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours before showtime
        
        return (
          <div className="space-x-2">
            <Button
              type="primary"
              size="small"
              onClick={() => handleViewBooking(record._id)}
            >
              View
            </Button>
            {canCancel && (
              <Button
                type="danger"
                size="small"
                onClick={() => handleCancelBooking(record._id)}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      
      <Table
        dataSource={bookings}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="bg-white rounded shadow"
      />
    </div>
  );
};

export default MyBookings;