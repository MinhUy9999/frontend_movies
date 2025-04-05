import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import socketService from '../services/websocketService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
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

    const setupSocket = async () => {
      if (isAuthenticated) {
        try {
          const connected = await socketService.connect();
          setIsConnected(connected);

          if (connected) {
            const onConnectedUnsubscribe = socketService.addEventListener('connected', () => {
              setIsConnected(true);
            });

            const onDisconnectedUnsubscribe = socketService.addEventListener('disconnected', () => {
              setIsConnected(false);
            });

            const onNewMessageUnsubscribe = socketService.addEventListener('new_message', (data) => {
              console.log('New message received via Socket.IO:', data);
              
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
            
            const onMessageReadUnsubscribe = socketService.addEventListener('message_read', (data) => {
              setMessages(prev => 
                prev.map(msg => 
                  msg._id === data.messageId ? { ...msg, isRead: true } : msg
                )
              );
            });

            cleanupFunctions = [
              onConnectedUnsubscribe,
              onDisconnectedUnsubscribe,
              onNewMessageUnsubscribe,
              onMessageReadUnsubscribe,
            ];
          } else {
            console.error('Could not connect to Socket.IO. Check the URL and token.');
          }
        } catch (error) {
          console.error('Error connecting to Socket.IO:', error);
        }
      } else {
        socketService.disconnect();
        setIsConnected(false);
      }
    };

    setupSocket();

    return () => {
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      socketService.disconnect();
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
  
  const sendMessage = useCallback((conversationId, content, callback) => {
    return socketService.sendMessage(conversationId, content, callback);
  }, []);
  
  const markAsRead = useCallback((messageId, callback) => {
    return socketService.markMessageAsRead(messageId, callback);
  }, []);
  
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
    socketService.notifyNewMessage(message);
  }, []);

  const value = {
    isConnected,
    notifications,
    clearNotification,
    messages,
    addMessage,
    getConversationMessages,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    notifyNewMessage,
    chatState,
    setChatState,
    addEventListener: socketService.addEventListener.bind(socketService),
    removeEventListener: socketService.removeEventListener.bind(socketService)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};