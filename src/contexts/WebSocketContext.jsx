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
          const connected = await websocketService.connect();
          setIsConnected(connected);

          if (connected) {
            
            const onOpenUnsubscribe = websocketService.addEventListener('connected', () => {
              setIsConnected(true);
            });

            const onSeatsUpdatedUnsubscribe = websocketService.addEventListener('seats_updated', () => {
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
              console.log('New message received via WebSocket context:', data);
              
              if (data.message) {
                // Normalize the message format
                const normalizedMessage = {
                  _id: data.message._id,
                  sender: data.message.sender,
                  content: data.message.content,
                  createdAt: data.message.createdAt,
                  userId: data.message.userId,
                  adminId: data.message.adminId,
                  isRead: data.message.isRead || false
                };
                
                // Add to global message store
                setMessages(prev => {
                  const isDuplicate = prev.some(msg => msg._id === normalizedMessage._id);
                  if (isDuplicate) {
                    console.log('Message already exists in context store');
                    return prev;
                  }
                  console.log('Adding new message to context store');
                  return [...prev, normalizedMessage];
                });
                
                // Also update chat state (unread counts, etc.)
                setChatState(prev => {
                  const otherUserId = normalizedMessage.sender === 'admin' 
                    ? normalizedMessage.userId
                    : normalizedMessage.adminId;
                  
                  return {
                    ...prev,
                    unreadCounts: {
                      ...prev.unreadCounts,
                      [otherUserId]: (prev.unreadCounts[otherUserId] || 0) + 1
                    }
                  };
                });
              }
            });
            
            const onMessageReadUnsubscribe = websocketService.addEventListener('message_read', (data) => {
              
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
            console.error('Không thể kết nối WebSocket. Kiểm tra URL và token.');
          }
        } catch (error) {
          console.error('Lỗi kết nối WebSocket:', error);
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