import { useState } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle } from 'lucide-react';
import LoginModal from './LoginModal';
import ChatWindow from './ChatWindow';

const ChatIcon = () => {
  const [showChat, setShowChat] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useSelector(state => state.user);

  const handleChatIconClick = () => {
    if (isAuthenticated) {
      setShowChat(!showChat);
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      {/* Fixed Chat Icon */}
      <div 
        className="fixed bottom-6 right-6 bg-blue-600 rounded-full p-3 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors z-50"
        onClick={handleChatIconClick}
      >
        <MessageCircle size={28} color="white" />
      </div>

      {/* Chat Window */}
      {showChat && <ChatWindow onClose={() => setShowChat(false)} />}

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default ChatIcon;