// src/pages/Booking/BookingPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Form, Button, Steps, message, Radio, Input, Card, Divider } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import showtimeApi from '../../apis/showtimeApi';
import bookingApi from '../../apis/bookingApi';
import SeatSelection from '../../components/SeatSelection';
import { useWebSocket } from '../../contexts/WebSocketContext';

const { Step } = Steps;
const { Group: RadioGroup } = Radio;

const BookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.user);
  const { addEventListener, removeEventListener } = useWebSocket();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  const [theater, setTheater] = useState(null);
  const [screen, setScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(null);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      message.error('Please log in to book tickets');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch showtime details
  useEffect(() => {
    const fetchShowtimeDetails = async () => {
      try {
        setLoading(true);
        const response = await showtimeApi.getShowtimeById(showtimeId);
        
        if (response.statusCode === 200 && response.content?.showtime) {
          const showtimeData = response.content.showtime;
          setShowtime(showtimeData);
          
          // Set movie and screen/theater if available in the response
          if (showtimeData.movieId) {
            setMovie(typeof showtimeData.movieId === 'object' ? showtimeData.movieId : { _id: showtimeData.movieId });
          }
          
          if (showtimeData.screenId) {
            const screenData = typeof showtimeData.screenId === 'object' ? showtimeData.screenId : null;
            setScreen(screenData);
            
            if (screenData && screenData.theaterId) {
              setTheater(typeof screenData.theaterId === 'object' ? screenData.theaterId : { _id: screenData.theaterId });
            }
          }
        } else {
          message.error('Failed to load showtime details');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching showtime:', error);
        message.error('Error loading showtime details');
      } finally {
        setLoading(false);
      }
    };
    
    if (showtimeId) {
      fetchShowtimeDetails();
    }
  }, [showtimeId, navigate]);
  
  // Calculate total amount when seats change
  useEffect(() => {
    if (showtime && selectedSeats.length > 0) {
      let total = 0;
      
      // You may need to fetch seat details to get seat types and prices
      // For now, we'll use a standard price from the showtime
      if (showtime.price && showtime.price.standard) {
        total = selectedSeats.length * showtime.price.standard;
      }
      
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [selectedSeats, showtime]);
  
  // Listen for booking-related WebSocket events
  useEffect(() => {
    const handleBookingReserved = (data) => {
      if (data.bookingId === bookingId) {
        // Get expiration time from data
        if (data.expiresAt) {
          const expiryTime = new Date(data.expiresAt).getTime();
          const now = new Date().getTime();
          const timeLeft = Math.floor((expiryTime - now) / 1000); // in seconds
          
          if (timeLeft > 0) {
            setCountdown(timeLeft);
          }
        }
      }
    };
    
    const handleBookingExpiring = (data) => {
      if (data.bookingId === bookingId) {
        message.warning(`Your booking will expire in ${data.minutesLeft} minutes!`, 5);
      }
    };
    
    const handleBookingExpired = (data) => {
      if (data.bookingId === bookingId) {
        message.error('Your booking has expired', 5);
        // Reset booking process
        setCurrentStep(0);
        setSelectedSeats([]);
        setBookingId(null);
      }
    };
    
    // Add event listeners
    const unsubscribeReserved = addEventListener('booking_reserved', handleBookingReserved);
    const unsubscribeExpiring = addEventListener('booking_expiring', handleBookingExpiring);
    const unsubscribeExpired = addEventListener('booking_expired', handleBookingExpired);
    
    return () => {
      unsubscribeReserved();
      unsubscribeExpiring();
      unsubscribeExpired();
    };
  }, [bookingId, addEventListener, removeEventListener]);
  
  // Countdown timer
  useEffect(() => {
    if (!countdown) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);
  
  // Format countdown as mm:ss
  const formatCountdown = () => {
    if (!countdown) return '';
    
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle seat selection
  const handleSeatSelection = (seats) => {
    setSelectedSeats(seats);
  };
  
  // Create booking
  const handleCreateBooking = async () => {
    if (selectedSeats.length === 0) {
      message.error('Please select at least one seat');
      return;
    }
    
    setLoading(true);
    
    try {
      const bookingData = {
        showtimeId,
        seatIds: selectedSeats,
        paymentMethod
      };
      
      const response = await bookingApi.createBooking(bookingData);
      
      if (response.statusCode === 201 && response.content?.booking) {
        message.success('Booking created successfully');
        setBookingId(response.content.booking._id);
        setCurrentStep(1);
      } else {
        message.error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      message.error('Error processing your booking');
    } finally {
      setLoading(false);
    }
  };
  
  // Process payment
  const handlePayment = async (values) => {
    if (!bookingId) {
      message.error('No active booking found');
      return;
    }
    
    setLoading(true);
    
    try {
      const paymentData = {
        bookingId,
        paymentMethod,
        paymentDetails: values
      };
      
      const response = await bookingApi.processPayment(bookingId, paymentData);
      
      if (response.statusCode === 200 && response.content?.booking) {
        message.success('Payment successful');
        setCurrentStep(2);
      } else {
        message.error(response.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Error processing your payment');
    } finally {
      setLoading(false);
    }
  };
  
  // Render payment form based on payment method
  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return (
          <div>
            <Form.Item
              name="cardNumber"
              label="Card Number"
              rules={[
                { required: true, message: 'Please enter your card number' },
                { pattern: /^\d{16}$/, message: 'Please enter a valid 16-digit card number' }
              ]}
            >
              <Input placeholder="1234 5678 9012 3456" maxLength={16} />
            </Form.Item>
            
            <div className="flex gap-4">
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                rules={[{ required: true, message: 'Please enter expiry date' }]}
                className="w-1/2"
              >
                <Input placeholder="MM/YY" maxLength={5} />
              </Form.Item>
              
              <Form.Item
                name="cvv"
                label="CVV"
                rules={[
                  { required: true, message: 'Please enter CVV' },
                  { pattern: /^\d{3,4}$/, message: 'Please enter a valid CVV' }
                ]}
                className="w-1/2"
              >
                <Input placeholder="123" maxLength={4} />
              </Form.Item>
            </div>
            
            <Form.Item
              name="cardholderName"
              label="Cardholder Name"
              rules={[{ required: true, message: 'Please enter cardholder name' }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
          </div>
        );
        
      case 'paypal':
        return (
          <div>
            <Form.Item
              name="email"
              label="PayPal Email"
              rules={[
                { required: true, message: 'Please enter your PayPal email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </div>
        );
        
      default:
        return <div>Please select a payment method</div>;
    }
  };
  
  if (loading && !showtime) {
    return <div className="flex justify-center my-8">Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Book Tickets</h1>
      
      <Steps current={currentStep} className="mb-8">
        <Step title="Select Seats" description="Choose your seats" />
        <Step title="Payment" description="Complete payment" />
        <Step title="Confirmation" description="Booking confirmed" />
      </Steps>
      
      {/* Countdown timer when booking is active */}
      {bookingId && countdown > 0 && currentStep === 1 && (
        <div className="mb-4 flex items-center text-yellow-600">
          <ClockCircleOutlined className="mr-2" />
          <span>Time remaining to complete payment: {formatCountdown()}</span>
        </div>
      )}
      
      {currentStep === 0 && (
        <div>
          <div className="mb-6">
            <Card className="mb-4">
              <h2 className="text-xl font-bold mb-2">{movie?.title || 'Movie'}</h2>
              <p className="text-gray-600">
                {theater?.name || 'Theater'} - {screen?.name || 'Screen'}
              </p>
              <p className="text-gray-600">
                {showtime ? new Date(showtime.startTime).toLocaleString() : 'Showtime'}
              </p>
            </Card>
            
            <SeatSelection 
              showtimeId={showtimeId} 
              onSeatSelect={handleSeatSelection} 
            />
            
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Booking Summary</h3>
              <div className="flex justify-between mb-2">
                <span>Selected Seats:</span>
                <span>{selectedSeats.length > 0 ? selectedSeats.length : 'None'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Price per Seat:</span>
                <span>{showtime?.price?.standard || 0} VND</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{totalAmount} VND</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="primary" 
              onClick={handleCreateBooking} 
              disabled={selectedSeats.length === 0}
              loading={loading}
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      )}
      
      {currentStep === 1 && (
        <div>
          <Card title="Payment Details" className="mb-6">
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePayment}
            >
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                initialValue={paymentMethod}
                rules={[{ required: true, message: 'Please select a payment method' }]}
              >
                <RadioGroup onChange={e => setPaymentMethod(e.target.value)}>
                  <Radio value="credit_card">Credit Card</Radio>
                  <Radio value="paypal">PayPal</Radio>
                </RadioGroup>
              </Form.Item>
              
              {renderPaymentForm()}
              
              <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                <div className="flex justify-between mb-2">
                  <span>Selected Seats:</span>
                  <span>{selectedSeats.length}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{totalAmount} VND</span>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button className="mr-4" onClick={() => setCurrentStep(0)}>
                  Back
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Complete Payment
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-green-500 text-6xl mb-4">
              <CheckCircleOutlined />
            </div>
            <h2 className="text-2xl font-bold mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your booking has been successfully confirmed. You will receive an email with your booking details.
            </p>
            
            <Card className="mb-6 text-left">
              <h3 className="text-lg font-semibold mb-2">Booking Details</h3>
              <p><strong>Movie:</strong> {movie?.title || 'Movie'}</p>
              <p><strong>Theater:</strong> {theater?.name || 'Theater'}</p>
              <p><strong>Screen:</strong> {screen?.name || 'Screen'}</p>
              <p><strong>Time:</strong> {showtime ? new Date(showtime.startTime).toLocaleString() : 'Showtime'}</p>
              <p><strong>Seats:</strong> {selectedSeats.length}</p>
              <p><strong>Total Amount:</strong> {totalAmount} VND</p>
            </Card>
            
            <div className="flex justify-center">
              <Button type="primary" onClick={() => navigate('/user/bookings')}>
                View My Bookings
              </Button>
              <Button className="ml-4" onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;