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
  const { user } = useSelector((state) => state.user);
  const { addEventListener } = useWebSocket();

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
    if (activeUser) {
      const fetchMessages = async () => {
        try {
          const response = await messageApi.getConversation(activeUser._id);
          if (response.statusCode === 200 && response.content && response.content.messages) {
            setMessages(response.content.messages);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      
      fetchMessages();
    }
  }, [activeUser]);

  useEffect(() => {
    const unsubscribe = addEventListener('new_message', (data) => {
      if (data.message && activeUser && 
        (data.message.sender._id === activeUser._id || 
         data.message.sender._id === user.id)) {
        setMessages(prev => [...prev, data.message]);
      }
      
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.type === 'user' && 
              conv.user._id === data.message.sender._id) {
            return {
              ...conv,
              lastMessage: data.message,
              unreadCount: activeUser && activeUser._id === data.message.sender._id 
                ? 0 
                : conv.unreadCount + 1
            };
          }
          return conv;
        });
      });
    });
    
    return () => unsubscribe();
  }, [addEventListener, activeUser, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeUser) return;
    
    try {
      await messageApi.sendMessage(activeUser._id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleUserSelect = (user) => {
    setActiveUser(user);
    
    // Update unread count in conversations list
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.type === 'user' && conv.user._id === user._id) {
          return {
            ...conv,
            unreadCount: 0
          };
        }
        return conv;
      });
    });
  };

  useEffect(() => {
    if (activeUser && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.sender._id === activeUser._id && !msg.isRead
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
            {conversations.map((conv) => (
              <div 
                key={conv.type === 'user' ? conv.user._id : conv.admin._id} 
                className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                  activeUser && activeUser._id === (conv.type === 'user' ? conv.user._id : conv.admin._id) 
                    ? 'bg-blue-50' 
                    : ''
                }`}
                onClick={() => handleUserSelect(conv.type === 'user' ? conv.user : conv.admin)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {conv.type === 'user' && conv.user.avatar ? (
                        <img src={conv.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{conv.type === 'user' ? conv.user.username[0] : conv.admin.username[0]}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{conv.type === 'user' ? conv.user.username : conv.admin.username}</p>
                      <p className="text-sm text-gray-500 truncate w-40">
                        {conv.lastMessage ? conv.lastMessage.content : 'Bắt đầu cuộc trò chuyện'}
                      </p>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center">
          {activeUser ? (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{activeUser.username[0]}</span>
                )}
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
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {!activeUser ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Không có tin nhắn nào. Bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg._id} 
                  className={`flex ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender._id !== user.id && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 overflow-hidden">
                      {activeUser.avatar ? (
                        <img src={activeUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{activeUser.username[0]}</span>
                      )}
                    </div>
                  )}
                  <div 
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender._id === user.id
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-black rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                    <div className={`text-xs mt-1 ${msg.sender._id === user.id ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                      {msg.isRead && msg.sender._id === user.id && (
                        <span className="ml-1">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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