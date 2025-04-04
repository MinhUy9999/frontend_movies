import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.user);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let cleanupFunctions = [];
    let reconnectTimer = null;



    const setupWebSocket = async () => {
      if (isAuthenticated) {
        try {
          const connected = await websocketService.connect();
          setIsConnected(connected);

          if (connected) {
            const onOpenUnsubscribe = websocketService.addEventListener('connected', () => {
              setIsConnected(true);
            });

            const onSeatsUpdatedUnsubscribe = websocketService.addEventListener('seats_updated', (data) => {
              console.log('Ghế đã được cập nhật cho suất chiếu:', data.showtimeId);
            });

            const onBookingExpiringUnsubscribe = websocketService.addEventListener('booking_expiring', (data) => {
              setNotifications(prev => [
                ...prev,
                {
                  id: Date.now(),
                  type: 'warning',
                  message: `Đặt vé của bạn sẽ hết hạn trong ${data.minutesLeft} phút!`,
                  bookingId: data.bookingId
                }
              ]);
            });

            const onBookingExpiredUnsubscribe = websocketService.addEventListener('booking_expired', (data) => {
              setNotifications(prev => [
                ...prev,
                {
                  id: Date.now(),
                  type: 'error',
                  message: 'Đặt vé của bạn đã hết hạn',
                  bookingId: data.bookingId
                }
              ]);
            });

            const onNewMessageUnsubscribe = websocketService.addEventListener('new_message', (data) => {
              if (data.message) {
                setNotifications(prev => [
                  ...prev,
                  {
                    id: Date.now(),
                    type: 'info',
                    message: `Tin nhắn mới từ ${data.message.sender.username || 'Người dùng'}`,
                    data: data.message
                  }
                ]);
              }
            });
            
            const onMessageReadUnsubscribe = websocketService.addEventListener('message_read', (data) => {
              console.log('Tin nhắn đã được đọc:', data.messageId);
            });

            cleanupFunctions = [
              onOpenUnsubscribe,
              onSeatsUpdatedUnsubscribe,
              onBookingExpiringUnsubscribe,
              onBookingExpiredUnsubscribe,
              onNewMessageUnsubscribe,
              onMessageReadUnsubscribe,
            ];
          } else {
            reconnectTimer = setTimeout(setupWebSocket, 5000);
          }
        } catch (error) {
          console.error('Lỗi kết nối WebSocket:', error);
          reconnectTimer = setTimeout(setupWebSocket, 5000);
        }
      } else {
        websocketService.disconnect();
        setIsConnected(false);
      }
    };

    setupWebSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const value = {
    isConnected,
    notifications,
    clearNotification,
    sendMessage: websocketService.sendMessage.bind(websocketService),
    addEventListener: websocketService.addEventListener.bind(websocketService),
    removeEventListener: websocketService.removeEventListener.bind(websocketService)
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket phải được sử dụng trong WebSocketProvider');
  }
  return context;
};

export { useWebSocket };