import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { X, Send } from 'lucide-react';
import { useSocket } from '../contexts/WebSocketContext';
import messageApi from '../apis/messageApi';

const ChatWindow = ({ onClose }) => {
  const userRole = useSelector(state => state.user.role);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { 
    isConnected, 
    addMessage, 
    getConversationMessages, 
    sendMessage,
    markConversationAsRead,
    addEventListener
  } = useSocket();

  const user = useSelector((state) => state.user) || {};
  const userId = user.id || localStorage.getItem('userId') || 
              (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null);


  const messages = selectedAdmin ? 
    getConversationMessages(userId, selectedAdmin._id) : [];

    

    useEffect(() => {
      const fetchAdmins = async () => {
        try {
          const effectiveRole = userRole || localStorage.getItem('userRole');
          
          if (effectiveRole !== 'user') {
            setLoading(false);
            return;
          }
    
          const response = await messageApi.getAvailableAdmins();
          
          if (response.statusCode === 200 && response.content) {
            let adminsList = [];
            
            if (response.content.admins && response.content.admins.length > 0) {
              adminsList = response.content.admins;
            } else if (Array.isArray(response.content)) {
              adminsList = response.content;
            }
            
            setAdmins(adminsList);
            
            // Tự động chọn admin đầu tiên nếu có
            if (adminsList.length > 0 && !selectedAdmin) {
              setSelectedAdmin(adminsList[0]);
            }
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching admins:', error);
          setLoading(false);
        }
      };
    
      fetchAdmins();
    }, [userRole, selectedAdmin]);

  useEffect(() => {
    if (selectedAdmin && userId) {
      const fetchConversation = async () => {
        try {
          setLoading(true);
          const response = await messageApi.getConversation(selectedAdmin._id);
          
          if (response.statusCode === 200 && response.content) {
            if (response.content.messages) {
              response.content.messages.forEach(msg => addMessage(msg));
              
              markConversationAsRead(userId, selectedAdmin._id, 'user');
            }
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching conversation:', error);
          setLoading(false);
        }
      };

      fetchConversation();
    }
  }, [selectedAdmin, userId, addMessage, markConversationAsRead]);

  useEffect(() => {
    const unsubscribe = addEventListener('new_message', (data) => {
      console.log('Socket.IO new_message received in ChatWindow:', data);
      
      if (data.message && selectedAdmin) {
        const isForCurrentChat = 
          (data.message.userId === userId && data.message.adminId === selectedAdmin._id) || 
          (data.message.adminId === userId && data.message.userId === selectedAdmin._id);
        
        if (isForCurrentChat) {
          if (data.message.sender === 'admin') {
            markAsRead(data.message._id);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [addEventListener, selectedAdmin, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAdmin) return;
  
    try {
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: newMessage,
        sender: 'user',
        createdAt: new Date().toISOString(),
        userId: userId, 
        adminId: selectedAdmin._id,
        isRead: false,
        isTemporary: true
      };
      
      addMessage(tempMsg);
      
      const messageToSend = newMessage;
      setNewMessage('');
      
      // Đảm bảo sendMessage có đúng tham số
      sendMessage(selectedAdmin._id, messageToSend, (response) => {
        if (!response || response.success === false) {
          console.error('Failed to send message:', response);
          alert('Failed to send message. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
        <div className="flex items-center">
          <h3 className="font-bold">Tư vấn đặt vé</h3>
          <div className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      {/* Admin Selection */}
      {admins.length > 0 && (
        <div className="p-2 border-b">
          <select
            className="w-full p-2 border rounded"
            value={selectedAdmin?._id || ''}
            onChange={(e) => {
              const admin = admins.find(a => a._id === e.target.value);
              setSelectedAdmin(admin);
            }}
          >
            {admins.map(admin => (
              <option key={admin._id} value={admin._id}>
                {admin.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">
            Bắt đầu trò chuyện với nhân viên tư vấn
          </div>
        ) : (
          messages.map((msg) => {
            const isSentByMe = msg.sender === 'user';

            return (
              <div
                key={msg._id}
                className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${isSentByMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-black rounded-bl-none'
                    }`}
                >
                  {msg.content}
                  <div className={`text-xs mt-1 ${isSentByMe ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                    {msg.isRead && isSentByMe && <span className="ml-1">✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={!selectedAdmin}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !selectedAdmin}
          className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;