import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useWebSocket } from '../../contexts/WebSocketContext';
import messageApi from '../../apis/messageApi';

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  
  const user = useSelector((state) => state.user) || {};
  const userId = user.id || localStorage.getItem('userId');
  
  const { 
    addEventListener,
    isConnected, 
    addMessage, 
    getConversationMessages, 
    markConversationAsRead,
    notifyNewMessage 
  } = useWebSocket();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await messageApi.getUserConversations();
        if (response.statusCode === 200 && response.content && response.content.conversations) {
          setConversations(response.content.conversations);
          
          if (response.content.conversations.length > 0) {
            const firstConversation = response.content.conversations[0];
            if (firstConversation.type === 'user' && firstConversation.user) {
              setActiveUser(firstConversation.user);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeUser && userId) {
      const fetchMessages = async () => {
        try {
          const response = await messageApi.getConversation(activeUser._id);
          
          if (response.statusCode === 200 && response.content && response.content.messages) {
            response.content.messages.forEach(msg => addMessage(msg));
            
            const conversationMessages = getConversationMessages(activeUser._id, userId);
            setMessages(conversationMessages);
            
            markConversationAsRead(activeUser._id, userId, 'admin');
          } else {
            console.error('No messages in response:', response);
            setMessages([]);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        }
      };
      
      fetchMessages();
    }
  }, [activeUser, userId, addMessage, getConversationMessages, markConversationAsRead]);

  useEffect(() => {
    if (!activeUser || !userId) return;
    
    const handleNewMessage = (data) => {
      console.log('WebSocket new_message received in AdminChat:', data);
      
      if (data.message) {
        console.log('Current conversation:', activeUser._id, userId);
        console.log('Message participants:', data.message.userId, data.message.adminId);
        
        const isRelevantMessage = 
          (data.message.userId === activeUser._id && data.message.adminId === userId) ||
          (data.message.adminId === userId && data.message.userId === activeUser._id);
        
        console.log('Is relevant to active conversation?', isRelevantMessage);
        
        if (isRelevantMessage) {
          setMessages(prev => {
            console.log('Adding new message to admin UI');
            const msgExists = prev.some(msg => msg._id === data.message._id);
            if (msgExists) return prev;
            return [...prev, data.message];
          });
        }
      }
    };
    
    console.log('Setting up new_message listener in AdminChat');
    const unsubscribe = addEventListener('new_message', handleNewMessage);
    
    return () => {
      console.log('Removing new_message listener in AdminChat');
      unsubscribe();
    };
  }, [addEventListener, activeUser, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeUser) return;
    
    try {
      console.log('Sending message to user:', activeUser._id);
      
      // Create temporary message for optimistic UI update
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: newMessage,
        sender: 'admin',
        createdAt: new Date().toISOString(),
        userId: activeUser._id,
        adminId: userId,
        isRead: false,
        isTemporary: true
      };
      
      // Update UI immediately
      setMessages(prev => [...prev, tempMsg]);
      
      // Clear input before API call
      const messageToSend = newMessage;
      setNewMessage('');
      
      // Send to server
      const response = await messageApi.sendMessage(activeUser._id, messageToSend);
      console.log('Send message response:', response);
      
      if (response.statusCode === 201 && response.content && response.content.message) {
        const newMsg = response.content.message;
        
        // Replace temp message with real message from server
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? newMsg : msg
        ));
        
        // Add to global message store
        addMessage(newMsg);
        
        // Notify other clients via WebSocket
        notifyNewMessage(newMsg);
      } else {
        console.error('Error response from sendMessage:', response);
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        message.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Error sending message. Please try again.');
    }
  };

  const handleUserSelect = async (user) => {
    setActiveUser(user);
    
    try {
      const response = await messageApi.getConversation(user._id);
      
      if (response.statusCode === 200 && response.content && Array.isArray(response.content.messages)) {
        setMessages(response.content.messages);
      } else {
        console.error('No messages found or invalid response:', response);
        setMessages([]);
      }
      
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.type === 'user' && conv.user && conv.user._id === user._id) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        });
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (activeUser && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.sender?._id === activeUser._id && !msg.isRead
      );
      
      unreadMessages.forEach(async (msg) => {
        try {
          await messageApi.markAsRead(msg._id);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
    }
  }, [activeUser, messages]);

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
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Không có cuộc trò chuyện nào
          </div>
        ) : (
          <div>
            {conversations.map((conv) => {
              const convType = conv.type || 'unknown';
              const convUser = convType === 'user' ? conv.user : null;
              const convAdmin = convType === 'admin' ? conv.admin : null;
              const displayId = convType === 'user' ? convUser?._id : convAdmin?._id;
              
              return (
                <div 
                  key={displayId || `conv-${Math.random()}`} 
                  className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                    activeUser && activeUser._id === displayId
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => convType === 'user' && convUser ? handleUserSelect(convUser) : null}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {convType === 'user' && convUser?.avatar ? (
                          <img src={convUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{convType === 'user' && convUser ? convUser.username[0] : (convAdmin ? convAdmin.username[0] : 'U')}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold">{convType === 'user' && convUser ? convUser.username : (convAdmin ? convAdmin.username : 'Unknown')}</p>
                        <p className="text-sm text-gray-500 truncate w-40">
                          {conv.lastMessage ? conv.lastMessage.content : 'Bắt đầu cuộc trò chuyện'}
                        </p>
                      </div>
                    </div>
                    {(conv.unreadCount || 0) > 0 && (
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {conv.unreadCount}
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
          <div className="flex items-center">
            {activeUser ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {/* Avatar content */}
                </div>
                <div className="ml-3">
                  <p className="font-semibold">{activeUser.username}</p>
                  <p className="text-sm text-gray-500">{activeUser.email}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Chọn một cuộc trò chuyện</p>
            )}
          </div>
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
              title={isConnected ? 'Kết nối WebSocket: Hoạt động' : 'Kết nối WebSocket: Không hoạt động'}>
          </div>
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
              <div className="text-xs text-blue-500 mb-2">
                Hiển thị {messages.length} tin nhắn
              </div>
              {messages.map((msg) => {
                
                if (!msg || typeof msg !== 'object') {
                  console.error('Invalid message format:', msg);
                  return null;
                }
                
                const isSentByMe = msg.sender === 'admin';
                
                return (
                  <div 
                    key={msg._id || msg.id} 
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