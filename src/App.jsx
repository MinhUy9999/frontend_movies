import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Banner from "./components/Banner";
import WebSocketNotification from "./components/WebSocketNotification";
import { useWebSocket } from "./contexts/WebSocketContext";

function App() {
  const { isConnected } = useWebSocket();
  
  return (
    <div>
      <Header />
      <Banner />
      {/* WebSocket connection indicator (only visible in development) */}
      {import.meta.env.DEV && (
        <div className={`fixed bottom-4 left-4 z-50 p-2 rounded-full w-3 h-3 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}></div>
      )}
      {/* WebSocket Notifications */}
      <WebSocketNotification />
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}

export default App;