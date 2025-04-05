import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/WebSocketContext';
import messageApi from '../../apis/messageApi';

const AdminChat = () => {
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  
  const user = useSelector((state) => state.user) || {};
  const adminId = user.id || localStorage.getItem('userId');
  
  const { 
    isConnected, 
    addMessage, 
    getConversationMessages, 
    sendMessage,
    markConversationAsRead,
    addEventListener,
    conversations,
    setConversations,
    unreadCounts
  } = useSocket();

  // Get messages for current conversation
  const messages = activeUser ? 
    getConversationMessages(activeUser._id, adminId) : [];

    useEffect(() => {
      const fetchConversations = async () => {
        try {
          setLoading(true);
          const response = await messageApi.getUserConversations();
          console.log('API Response:', response);
          
          if (response.statusCode === 200 && response.content) {
            let conversationsList = [];
            
            // Xử lý dữ liệu theo đúng cấu trúc API trả về trong hình 1
            if (response.content.conversations && Array.isArray(response.content.conversations)) {
              conversationsList = response.content.conversations.map(conv => {
                return {
                  _id: conv._id,
                  type: 'user',
                  user: {
                    _id: conv.userId?._id || conv.userId,
                    username: conv.userId?.username || 'User',
                    avatar: conv.userId?.avatar,
                    email: conv.userId?.email
                  },
                  adminId: conv.adminId?._id || conv.adminId,
                  lastMessage: conv.lastMessage,
                  unreadCount: conv.unreadAdmin || 0
                };
              });
            }
            
            console.log('Processed conversations:', conversationsList);
            setConversations(conversationsList);
            
            if (conversationsList.length > 0 && !activeUser) {
              // Chọn user từ conversation đầu tiên
              setActiveUser(conversationsList[0].user);
            }
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching conversations:', error);
          setLoading(false);
        }
      };
      
      fetchConversations();
    }, [setConversations]);

  useEffect(() => {
    if (activeUser && adminId) {
      const fetchMessages = async () => {
        try {
          const response = await messageApi.getConversation(activeUser._id);
          
          if (response.statusCode === 200 && response.content && response.content.messages) {
            response.content.messages.forEach(msg => addMessage(msg));
            markConversationAsRead(activeUser._id, adminId, 'admin');
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      
      fetchMessages();
    }
  }, [activeUser, adminId, addMessage, markConversationAsRead]);

  useEffect(() => {
    // Listen for new messages
    const unsubscribe = addEventListener('new_message', (data) => {
      console.log('WebSocket new_message received in AdminChat:', data);
      
      if (data.message) {
        // If the message is from a user, check if we need to add a new conversation
        if (data.message.sender === 'user') {
          const userId = data.message.userId;
          const exists = conversations.some(conv => 
            conv.type === 'user' && conv.user && conv.user._id === userId
          );
          
          if (!exists) {
            // Need to fetch updated conversations
            messageApi.getUserConversations()
              .then(response => {
                if (response.statusCode === 200 && response.content && response.content.conversations) {
                  setConversations(response.content.conversations);
                }
              })
              .catch(err => console.error('Error updating conversations:', err));
          }
        }
        
        // If active user is set and message is for the active conversation
        if (activeUser && data.message.userId === activeUser._id) {
          // Mark message as read if it's from user
          if (data.message.sender === 'user') {
            markAsRead(data.message._id);
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [addEventListener, activeUser, conversations, setConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeUser) return;
    
    try {
      // Create temporary message for optimistic UI update
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: newMessage,
        sender: 'admin',
        createdAt: new Date().toISOString(),
        userId: activeUser._id,
        adminId: adminId,
        isRead: false,
        isTemporary: true
      };
      
      // Add to context
      addMessage(tempMsg);
      
      // Clear input
      const messageToSend = newMessage;
      setNewMessage('');
      
      // Send via socket
      sendMessage(activeUser._id, messageToSend, (response) => {
        if (!response || !response.success) {
          console.error('Failed to send message:', response);
          alert('Failed to send message. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  const handleUserSelect = (user) => {
    setActiveUser(user);
    markConversationAsRead(user._id, adminId, 'admin');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Trò chuyện</h2>
          <div className={`inline-block ml-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Kết nối: Hoạt động' : 'Kết nối: Không hoạt động'}>
          </div>
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Không có cuộc trò chuyện nào
          </div>
        ) : (
          <div>
            {conversations.map((conv) => {
              let convUser = null;
              
              if (conv.type === 'user' && conv.user) {
                convUser = conv.user;
              } else if (conv.userId) {
                convUser = {
                  _id: typeof conv.userId === 'object' ? conv.userId._id : conv.userId,
                  username: (typeof conv.userId === 'object' && conv.userId.username) || 'User',
                  avatar: (typeof conv.userId === 'object' && conv.userId.avatar) || null,
                };
              }
              
              if (!convUser) return null;
              
              return (
                <div 
                  key={convUser._id} 
                  className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                    activeUser && activeUser._id === convUser._id
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => handleUserSelect(convUser)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {convUser.avatar ? (
                          <img src={convUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{convUser.username[0]}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold">{convUser.username}</p>
                        <p className="text-sm text-gray-500 truncate w-40">
                          {conv.lastMessage ? conv.lastMessage : 'Bắt đầu cuộc trò chuyện'}
                        </p>
                      </div>
                    </div>
                    {unreadCounts[convUser._id] > 0 && (
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {unreadCounts[convUser._id]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {activeUser ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {activeUser.avatar ? (
                <img src={activeUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{activeUser.username[0]}</span>
              )}
            </div>
            <div className="ml-3">
              <p className="font-semibold">{activeUser.username}</p>
              <p className="text-sm text-gray-500">{activeUser.email || 'User'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Chọn một cuộc trò chuyện</p>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!activeUser ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div>
              Không có tin nhắn nào. Bắt đầu cuộc trò chuyện!
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {              
              const isSentByMe = msg.sender === 'admin';
              
              return (
                <div 
                  key={msg._id} 
                  className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSentByMe && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 overflow-hidden">
                      {activeUser.avatar ? (
                        <img src={activeUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{activeUser.username?.[0] || '?'}</span>
                      )}
                    </div>
                  )}
                  <div 
                    className={`max-w-xs p-3 rounded-lg ${
                      isSentByMe
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
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Nhập tin nhắn..."
            disabled={!activeUser}
            className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !activeUser}
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 disabled:bg-blue-300"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AdminChat;