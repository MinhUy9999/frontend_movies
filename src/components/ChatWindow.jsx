
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { X, Send } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import messageApi from '../apis/messageApi';

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const messagesEndRef = useRef(null);
<<<<<<< HEAD
  
  const { 
    addEventListener,
    isConnected, 
    addMessage, 
    getConversationMessages, 
=======

  const {
    isConnected,
    addMessage,
    getConversationMessages,
>>>>>>> 51f81153965008cd95561022aa9ee07b26e2cd10
    markConversationAsRead,
    notifyNewMessage
  } = useWebSocket();

  const user = useSelector((state) => state.user) || {};
  const userId = user.id || localStorage.getItem('userId');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await messageApi.getAvailableAdmins();
        if (response.statusCode === 200 && response.content && response.content.admins) {
          setAdmins(response.content.admins);

          if (response.content.admins.length > 0) {
            setSelectedAdmin(response.content.admins[0]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admins:', error);
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      const fetchConversation = async () => {
        try {
          const response = await messageApi.getConversation(selectedAdmin._id);
          if (response.statusCode === 200 && response.content && response.content.messages) {
            setMessages(response.content.messages);
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      };

      fetchConversation();
    }
  }, [selectedAdmin]);

  useEffect(() => {
    if (selectedAdmin && userId) {
      const fetchConversation = async () => {
        try {
          const response = await messageApi.getConversation(selectedAdmin._id);
          if (response.statusCode === 200 && response.content && response.content.messages) {
            response.content.messages.forEach(msg => addMessage(msg));

            const conversationMessages = getConversationMessages(userId, selectedAdmin._id);
            setMessages(conversationMessages);

            markConversationAsRead(userId, selectedAdmin._id, 'user');
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      };

      fetchConversation();
    }
  }, [selectedAdmin, userId, addMessage, getConversationMessages, markConversationAsRead]);

  useEffect(() => {
    if (!selectedAdmin || !userId) return;

    const handleNewMessage = (data) => {
      console.log('WebSocket new_message received in ChatWindow:', data);
      
      if (data.message) {
<<<<<<< HEAD
        const msg = data.message;
        const isForCurrentChat = 
          (msg.userId === userId && msg.adminId === selectedAdmin._id) || 
          (msg.adminId === userId && msg.userId === selectedAdmin._id);
        
        console.log('Message is for current chat:', isForCurrentChat);
        
        if (isForCurrentChat) {
=======
        const isRelevantToCurrentChat =
          (data.message.userId === userId && data.message.adminId === selectedAdmin._id) ||
          (data.message.adminId === selectedAdmin._id && data.message.userId === userId);

        if (isRelevantToCurrentChat) {
>>>>>>> 51f81153965008cd95561022aa9ee07b26e2cd10
          setMessages(prev => {
            const exists = prev.some(m => m._id === msg._id);
            if (exists) return prev;
            return [...prev, msg];
          });
        }
      }
    };
<<<<<<< HEAD
  
    console.log('Adding new_message listener in ChatWindow');
=======

>>>>>>> 51f81153965008cd95561022aa9ee07b26e2cd10
    const unsubscribe = addEventListener('new_message', handleNewMessage);

    return () => unsubscribe();
  }, [addEventListener, selectedAdmin, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAdmin) return;

    try {
      console.log('Sending message to admin:', selectedAdmin._id);
      
      // Create a temporary message for optimistic UI update
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
      
      // Update UI immediately
      setMessages(prev => [...prev, tempMsg]);
      
      // Clear input before the API call
      const messageToSend = newMessage;
      setNewMessage('');
      
      // Send to server
      const response = await messageApi.sendMessage(selectedAdmin._id, messageToSend);
      console.log('Send message response:', response);

      if (response.statusCode === 201 && response.content && response.content.message) {
        const newMsg = response.content.message;
<<<<<<< HEAD
        
        // Replace temp message with real one from server
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? newMsg : msg
        ));
        
        // Add to global message store in WebSocketContext
        addMessage(newMsg);
        
        // Notify other clients via WebSocket
=======
        console.log('Adding new message to state and context:', newMsg);

        addMessage(newMsg);

        setMessages(prev => [...prev, newMsg]);

>>>>>>> 51f81153965008cd95561022aa9ee07b26e2cd10
        notifyNewMessage(newMsg);
      } else {
        console.error('Error response from sendMessage:', response);
        // Show error and remove temp message
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        message.error('Failed to send message');
      }
<<<<<<< HEAD
=======

      setNewMessage('');
>>>>>>> 51f81153965008cd95561022aa9ee07b26e2cd10
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Error sending message. Please try again.');
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

            if (!msg || typeof msg !== 'object') {
              console.error('Invalid message format:', msg);
              return null;
            }

            const isSentByMe = msg.sender === 'user';

            return (
              <div
                key={msg._id || msg.id}
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