// src/contexts/WebSocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';

// Tạo context WebSocket
const WebSocketContext = createContext(null);

// Component Provider cho WebSocket
export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.user);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Kết nối WebSocket khi đã xác thực
  useEffect(() => {
    let cleanupFunctions = [];
    let reconnectTimer = null;

    const setupWebSocket = async () => {
      if (isAuthenticated) {
        try {
          const connected = await websocketService.connect();
          setIsConnected(connected);

          if (connected) {
            // Lắng nghe thay đổi trạng thái kết nối
            const onOpenUnsubscribe = websocketService.addEventListener('connected', () => {
              setIsConnected(true);
            });

            // Lắng nghe cập nhật ghế
            const onSeatsUpdatedUnsubscribe = websocketService.addEventListener('seats_updated', (data) => {
              // Có thể gửi action Redux ở đây hoặc sử dụng callback
              console.log('Ghế đã được cập nhật cho suất chiếu:', data.showtimeId);
            });

            // Lắng nghe thông báo đặt vé sắp hết hạn
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

            // Lắng nghe thông báo đặt vé đã hết hạn
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

            // Thêm tất cả các hàm dọn dẹp
            cleanupFunctions = [
              onOpenUnsubscribe,
              onSeatsUpdatedUnsubscribe,
              onBookingExpiringUnsubscribe,
              onBookingExpiredUnsubscribe
            ];
          } else {
            // Nếu không kết nối được nhưng đã xác thực, thử lại sau một khoảng thời gian
            reconnectTimer = setTimeout(setupWebSocket, 5000);
          }
        } catch (error) {
          console.error('Lỗi kết nối WebSocket:', error);
          // Nếu kết nối thất bại, thử lại sau một khoảng thời gian
          reconnectTimer = setTimeout(setupWebSocket, 5000);
        }
      } else {
        // Ngắt kết nối nếu chưa xác thực
        websocketService.disconnect();
        setIsConnected(false);
      }
    };

    setupWebSocket();

    // Hàm dọn dẹp
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

  // Hàm để xóa thông báo
  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Giá trị context
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

// Định nghĩa PropTypes
WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook để sử dụng WebSocket context (tách ra thành một file riêng)
// src/hooks/useWebSocket.js để khắc phục lỗi "only-export-components"
// Nếu bạn có thể tách file, thì sử dụng file riêng, còn không thì giữ nguyên ở đây
const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket phải được sử dụng trong WebSocketProvider');
  }
  return context;
};

export { useWebSocket };