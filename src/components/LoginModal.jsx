import { Link } from 'react-router-dom';

const LoginModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Cần đăng nhập</h3>
        <p className="mb-6">Vui lòng đăng nhập để chat với nhân viên tư vấn.</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Đóng
          </button>
          <Link 
            to="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;