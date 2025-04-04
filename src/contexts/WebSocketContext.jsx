import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const user = useSelector(state => state.user);
  const isAuthenticated = user?.isAuthenticated;
  const userId = user?.id;
  
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]); 
  const [chatState, setChatState] = useState({
    activeConversations: {},
    unreadCounts: {} 
  });

  useEffect(() => {
    let cleanupFunctions = [];
    let reconnectTimer = null;

    const setupWebSocket = async () => {
      if (isAuthenticated) {
        try {
          console.log('Đang kết nối WebSocket...');
          const connected = await websocketService.connect();
          setIsConnected(connected);

          if (connected) {
            console.log('WebSocket đã kết nối thành công!');
            
            const onOpenUnsubscribe = websocketService.addEventListener('connected', () => {
              console.log('WebSocket connection established');
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
              console.log('Tin nhắn mới nhận được qua WebSocket:', data);
              
              if (data.message) {
                setMessages(prev => {
                  const isDuplicate = prev.some(msg => msg._id === data.message._id);
                  if (isDuplicate) return prev;
                  return [...prev, data.message];
                });
                
                const otherUserId = data.message.userId === userId 
                  ? data.message.adminId 
                  : data.message.userId;
                
                setChatState(prev => ({
                  ...prev,
                  unreadCounts: {
                    ...prev.unreadCounts,
                    [otherUserId]: (prev.unreadCounts[otherUserId] || 0) + 1
                  }
                }));
                
                setNotifications(prev => [
                  ...prev,
                  {
                    id: Date.now(),
                    type: 'info',
                    message: `Tin nhắn mới: ${data.message.content.substring(0, 20)}${data.message.content.length > 20 ? '...' : ''}`,
                    data: data.message
                  }
                ]);
              }
            });
            
            const onMessageReadUnsubscribe = websocketService.addEventListener('message_read', (data) => {
              console.log('Tin nhắn đã được đọc:', data.messageId);
              
              setMessages(prev => 
                prev.map(msg => 
                  msg._id === data.messageId ? { ...msg, isRead: true } : msg
                )
              );
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
            console.log('Không thể kết nối WebSocket, thử lại sau 5 giây...');
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
  }, [isAuthenticated, userId]);

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };
  
  const addMessage = useCallback((message) => {
    console.log('Đang thêm tin nhắn vào state:', message);
    setMessages(prev => {
      const isDuplicate = prev.some(msg => msg._id === message._id);
      if (isDuplicate) return prev;
      return [...prev, message];
    });
  }, []);
  
  const getConversationMessages = useCallback((userId, adminId) => {
    return messages.filter(msg => 
      (msg.userId === userId && msg.adminId === adminId) ||
      (msg.userId === adminId && msg.adminId === userId)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages]);
  
  const markConversationAsRead = useCallback((userId, adminId, currentUserRole) => {
    setMessages(prev => 
      prev.map(msg => {
        if ((msg.userId === userId && msg.adminId === adminId) &&
            ((currentUserRole === 'admin' && msg.sender === 'user') ||
             (currentUserRole === 'user' && msg.sender === 'admin'))) {
          return { ...msg, isRead: true };
        }
        return msg;
      })
    );
    
    setChatState(prev => ({
      ...prev,
      unreadCounts: {
        ...prev.unreadCounts,
        [currentUserRole === 'admin' ? userId : adminId]: 0
      }
    }));
  }, []);
  
  const notifyNewMessage = useCallback((message) => {
    if (websocketService && typeof websocketService.notifyNewMessage === 'function') {
      websocketService.notifyNewMessage(message);
    }
  }, []);

  const value = {
    isConnected,
    notifications,
    clearNotification,
    messages,
    addMessage,
    getConversationMessages,
    markConversationAsRead,
    notifyNewMessage,
    chatState,
    setChatState,
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

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket phải được sử dụng trong WebSocketProvider');
  }
  return context;
};