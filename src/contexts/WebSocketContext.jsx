import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import socketService from '../services/websocketService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const user = useSelector(state => state.user);
  const isAuthenticated = user?.isAuthenticated;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

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
                // Add to messages state
                setMessages(prev => {
                  const exists = prev.some(m => m._id === data.message._id);
                  if (exists) return prev;
                  return [...prev, data.message];
                });
                
                // Update unread counts
                if (data.message.sender !== (user.role === 'admin' ? 'admin' : 'user')) {
                  const otherId = user.role === 'admin' ? data.message.userId : data.message.adminId;
                  setUnreadCounts(prev => ({
                    ...prev,
                    [otherId]: (prev[otherId] || 0) + 1
                  }));
                }
              }
            });
            
            const onMessageReadUnsubscribe = socketService.addEventListener('message_read', (data) => {
              if (data.messageId) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg._id === data.messageId ? { ...msg, isRead: true } : msg
                  )
                );
              }
            });
            
            const onConversationReadUnsubscribe = socketService.addEventListener('conversation_read', (data) => {
              if (data.conversationId && data.reader) {
                // Mark all messages from the reader as read
                setMessages(prev => 
                  prev.map(msg => {
                    if (msg.sender === data.reader) {
                      return { ...msg, isRead: true };
                    }
                    return msg;
                  })
                );
                
                // Reset unread count
                if (data.reader !== (user.role === 'admin' ? 'admin' : 'user')) {
                  setUnreadCounts(prev => ({
                    ...prev,
                    [data.conversationId]: 0
                  }));
                }
              }
            });

            cleanupFunctions = [
              onConnectedUnsubscribe,
              onDisconnectedUnsubscribe,
              onNewMessageUnsubscribe,
              onMessageReadUnsubscribe,
              onConversationReadUnsubscribe
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

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const exists = prev.some(m => m._id === message._id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);
  
  const getConversationMessages = useCallback((userId, adminId) => {
    return messages.filter(msg => 
      (msg.userId === userId && msg.adminId === adminId) ||
      (msg.userId === adminId && msg.adminId === userId)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages]);
  
  const sendMessage = useCallback((receiverId, content, callback) => {
    return socketService.sendMessage(receiverId, content, callback);
  }, []);
  
  const markAsRead = useCallback((messageId, callback) => {
    return socketService.markMessageAsRead(messageId, callback);
  }, []);
  
  const markConversationAsRead = useCallback((userId, adminId, role) => {
    // Update local state
    setMessages(prev => 
      prev.map(msg => {
        if ((msg.userId === userId && msg.adminId === adminId) &&
            ((role === 'admin' && msg.sender === 'user') ||
             (role === 'user' && msg.sender === 'admin'))) {
          return { ...msg, isRead: true };
        }
        return msg;
      })
    );
    
    // Reset unread count
    const otherId = role === 'admin' ? userId : adminId;
    setUnreadCounts(prev => ({
      ...prev,
      [otherId]: 0
    }));
  }, []);

  const value = {
    isConnected,
    messages,
    addMessage,
    getConversationMessages,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    conversations,
    setConversations,
    unreadCounts,
    setUnreadCounts,
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