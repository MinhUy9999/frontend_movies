import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/WebSocketContext';
import messageApi from '../../apis/messageApi';

const AdminChat = () => {
  const [activeUser, setActiveUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user'); // 'user' hoặc 'admin'
  const [userConversations, setUserConversations] = useState([]);
  const [adminConversations, setAdminConversations] = useState([]);
  const [availableAdmins, setAvailableAdmins] = useState([]);
  
  const messagesEndRef = useRef(null);
  
  const user = useSelector((state) => state.user) || {};
  const adminId = user.id || localStorage.getItem('userId');
  
  const { 
    isConnected, 
    addMessage, 
    getConversationMessages, 
    sendMessage,
    markConversationAsRead,
    unreadCounts,
  } = useSocket();

  const messages = activeUser ? 
    getConversationMessages(activeUser._id, adminId) : [];

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        const userResponse = await messageApi.getUserConversations('user-admin');
        
        if (userResponse.statusCode === 200 && userResponse.content) {
          let conversationsList = [];
          
          if (userResponse.content.conversations && Array.isArray(userResponse.content.conversations)) {
            conversationsList = userResponse.content.conversations.map(conv => {
              return {
                _id: conv._id,
                type: 'user-admin',
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
          
          setUserConversations(conversationsList);
        }
        
        const adminResponse = await messageApi.getUserConversations('admin-admin');
        
        if (adminResponse.statusCode === 200 && adminResponse.content) {
          let conversationsList = [];
          
          if (adminResponse.content.conversations && Array.isArray(adminResponse.content.conversations)) {
            conversationsList = adminResponse.content.conversations.map(conv => {
              const isInitiator = conv.userId?._id === adminId || conv.userId === adminId;
              const otherAdminId = isInitiator ? (conv.adminId?._id || conv.adminId) : (conv.userId?._id || conv.userId);
              const otherAdmin = isInitiator ? conv.adminId : conv.userId;
              
              return {
                _id: conv._id,
                type: 'admin-admin',
                user: {
                  _id: otherAdminId,
                  username: otherAdmin?.username || 'Admin',
                  avatar: otherAdmin?.avatar,
                  email: otherAdmin?.email
                },
                isInitiator: isInitiator,
                lastMessage: conv.lastMessage,
                unreadCount: isInitiator ? (conv.unreadInitiator || 0) : (conv.unreadReceiver || 0)
              };
            });
          }
          
          setAdminConversations(conversationsList);
        }
        
        if (activeTab === 'admin') {
          const adminsResponse = await messageApi.getAvailableAdmins();
          if (adminsResponse.statusCode === 200 && adminsResponse.content) {
            setAvailableAdmins(adminsResponse.content.admins || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, [activeTab, adminId]);

  const handleUserSelect = async (user, conversationType) => {
    setActiveUser({...user, conversationType});
    
    if (!user._id) return;
    
    try {
      const isAdminToAdmin = conversationType === 'admin-admin';
      const response = await messageApi.getOrCreateConversation(
        user._id, 
        { type: isAdminToAdmin ? 'admin-admin' : 'user-admin' }
      );
      
      if (response.statusCode === 200 && response.content) {
        const messagesResponse = await messageApi.getMessages(response.content.conversation._id);
        if (messagesResponse.statusCode === 200 && messagesResponse.content) {
          messagesResponse.content.messages.forEach(msg => addMessage(msg));
        }
        
        markConversationAsRead(
          response.content.conversation._id, 
          'admin', 
          adminId
        );
      }
    } catch (error) {
      console.error('Error getting conversation:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeUser) return;
    
    try {
      const tempId = `temp-${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: newMessage,
        sender: 'admin',
        senderId: adminId,
        createdAt: new Date().toISOString(),
        userId: activeUser.conversationType === 'admin-admin' ? 
          (activeUser.isInitiator ? adminId : activeUser._id) : 
          activeUser._id,
        adminId: activeUser.conversationType === 'admin-admin' ? 
          (activeUser.isInitiator ? activeUser._id : adminId) : 
          adminId,
        isRead: false,
        isTemporary: true
      };
      
      addMessage(tempMsg);
      
      const messageToSend = newMessage;
      setNewMessage('');
      
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
  
  const renderConversationsList = () => {
    const conversations = activeTab === 'user' ? userConversations : adminConversations;
    
    if (conversations.length === 0) {
      if (activeTab === 'admin' && availableAdmins.length > 0) {
        return (
          <div>
            <div className="p-4 text-center text-gray-500">
              Không có cuộc trò chuyện với admin nào
            </div>
            <div className="p-4 border-t">
              <h3 className="font-medium mb-2">Admin có sẵn</h3>
              {availableAdmins.map(admin => (
                <div 
                  key={admin._id} 
                  className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleUserSelect({
                    _id: admin._id,
                    username: admin.username,
                    avatar: admin.avatar,
                    email: admin.email
                  }, 'admin-admin')}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {admin.avatar ? (
                        <img src={admin.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{admin.username[0]}</span>
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="font-medium">{admin.username}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      return (
        <div className="p-4 text-center text-gray-500">
          Không có cuộc trò chuyện nào
        </div>
      );
    }
    
    return (
      <div>
        {conversations.map((conv) => {
          const convUser = conv.user;
          if (!convUser) return null;
          
          return (
            <div 
              key={conv._id} 
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                activeUser && activeUser._id === convUser._id
                  ? 'bg-blue-50' 
                  : ''
              }`}
              onClick={() => handleUserSelect({
                ...convUser,
                isInitiator: conv.isInitiator
              }, conv.type)}
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
    );
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Tab buttons */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 px-4 font-medium ${activeTab === 'user' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('user')}
          >
            Người dùng
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-medium ${activeTab === 'admin' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin
          </button>
        </div>
        
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Trò chuyện</h2>
          <div className={`inline-block ml-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Kết nối: Hoạt động' : 'Kết nối: Không hoạt động'}>
          </div>
        </div>
        
        {/* Conversations list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderConversationsList()
          )}
        </div>
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
                <p className="text-xs text-blue-500">
                  {activeUser.conversationType === 'admin-admin' ? 'Admin' : 'Người dùng'}
                </p>
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
                const isSentByMe = (activeUser.conversationType === 'user-admin' && msg.sender === 'admin') ||
                                   (activeUser.conversationType === 'admin-admin' && msg.senderId === adminId);
                
                // Xác định avatar và tên người gửi
                let avatar = null;
                let senderName = '';
                
                if (!isSentByMe) {
                  if (activeUser.conversationType === 'user-admin') {
                    avatar = activeUser.avatar;
                    senderName = activeUser.username;
                  } else {
                    avatar = activeUser.avatar;
                    senderName = activeUser.username;
                  }
                }
                
                return (
                  <div 
                    key={msg._id} 
                    className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isSentByMe && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{senderName?.[0] || '?'}</span>
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