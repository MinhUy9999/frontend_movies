// src/contexts/WebSocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';

// Create the WebSocket context
const WebSocketContext = createContext(null);

// Hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// WebSocket provider component
export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.user);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    let cleanupFunctions = [];
    let reconnectTimer = null;
    
    const setupWebSocket = async () => {
      if (isAuthenticated) {
        try {
          const connected = await websocketService.connect();
          setIsConnected(connected);
          
          if (connected) {
            // Listen for connection status changes
            const onOpenUnsubscribe = websocketService.addEventListener('connected', () => {
              setIsConnected(true);
            });
            
            // Listen for seat updates
            const onSeatsUpdatedUnsubscribe = websocketService.addEventListener('seats_updated', (data) => {
              // You can dispatch a Redux action here or use a callback
              console.log('Seats updated for showtime:', data.showtimeId);
            });
            
            // Listen for booking expiring notifications
            const onBookingExpiringUnsubscribe = websocketService.addEventListener('booking_expiring', (data) => {
              setNotifications(prev => [
                ...prev, 
                { 
                  id: Date.now(), 
                  type: 'warning', 
                  message: `Your booking will expire in ${data.minutesLeft} minutes!`,
                  bookingId: data.bookingId
                }
              ]);
            });
            
            // Listen for booking expired notifications
            const onBookingExpiredUnsubscribe = websocketService.addEventListener('booking_expired', (data) => {
              setNotifications(prev => [
                ...prev, 
                { 
                  id: Date.now(), 
                  type: 'error', 
                  message: 'Your booking has expired',
                  bookingId: data.bookingId
                }
              ]);
            });
            
            // Add all cleanup functions
            cleanupFunctions = [
              onOpenUnsubscribe,
              onSeatsUpdatedUnsubscribe,
              onBookingExpiringUnsubscribe,
              onBookingExpiredUnsubscribe
            ];
          } else {
            // If not connected but authenticated, try again after a delay
            reconnectTimer = setTimeout(setupWebSocket, 5000);
          }
        } catch (error) {
          console.error('Error connecting to WebSocket:', error);
          // If connection fails, try again after a delay
          reconnectTimer = setTimeout(setupWebSocket, 5000);
        }
      } else {
        // Disconnect if not authenticated
        websocketService.disconnect();
        setIsConnected(false);
      }
    };
    
    setupWebSocket();
    
    // Cleanup function
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
  
  // Function to clear a notification
  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Context value
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