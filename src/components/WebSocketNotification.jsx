import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/WebSocketContext';

const WebSocketNotification = () => {
  const { isConnected } = useSocket();
  const [showDisconnectedAlert, setShowDisconnectedAlert] = useState(false);
  
  useEffect(() => {
    let timeout;
    
    if (!isConnected) {
      timeout = setTimeout(() => {
        setShowDisconnectedAlert(true);
      }, 5000);
    } else {
      setShowDisconnectedAlert(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isConnected]);
  
  if (!showDisconnectedAlert) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="font-bold">Mất kết nối</p>
        <p className="text-sm">Đang cố gắng kết nối lại...</p>
      </div>
      <button 
        onClick={() => setShowDisconnectedAlert(false)}
        className="ml-auto text-red-700 hover:text-red-900"
      >
        &times;
      </button>
    </div>
  );
};

export default WebSocketNotification;