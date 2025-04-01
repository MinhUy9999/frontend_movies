// src/components/WebSocketNotification.jsx
import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

const WebSocketNotification = () => {
  const { notifications, clearNotification } = useWebSocket();

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timers = notifications.map(notification => {
      return setTimeout(() => {
        clearNotification(notification.id);
      }, 5000);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, clearNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 w-80">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg transition-all duration-300 animate-slideIn flex justify-between items-start ${
            notification.type === 'error' 
              ? 'bg-red-500 text-white' 
              : notification.type === 'warning'
                ? 'bg-yellow-500 text-black'
                : 'bg-green-500 text-white'
          }`}
        >
          <p className="flex-1">{notification.message}</p>
          <button
            onClick={() => clearNotification(notification.id)}
            className="ml-2 text-lg font-bold opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default WebSocketNotification;