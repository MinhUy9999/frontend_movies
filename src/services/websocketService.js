import { io } from "socket.io-client";
import { messageApi } from "../apis/messageApi";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Get token for socket authentication
      const response = await messageApi.getSocketToken();

      if (
        response.statusCode !== 200 ||
        !response.content ||
        !response.content.token
      ) {
        console.error("Failed to get socket token:", response);
        return false;
      }

      const token = response.content.token;

      // Determine socket URL based on API URL
      const baseUrl =
        import.meta.env.VITE_API_URL ||
        "https://backend-movies-busc.onrender.com";
      const socketUrl = baseUrl.replace(/\/api$/, "");

      // Create socket connection with auth
      this.socket = io(socketUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 3000,
        withCredentials: true,
      });

      // Set up event handlers
      this.socket.on("connect", this.handleConnect.bind(this));
      this.socket.on("disconnect", this.handleDisconnect.bind(this));
      this.socket.on("connect_error", this.handleError.bind(this));

      // Set up listeners for specific events
      this.socket.on("new_message", (data) =>
        this.triggerEvent("new_message", data)
      );
      this.socket.on("message_read", (data) =>
        this.triggerEvent("message_read", data)
      );
      this.socket.on("all_messages_read", (data) =>
        this.triggerEvent("all_messages_read", data)
      );
      this.socket.on("typing", (data) => this.triggerEvent("typing", data));

      // Wait for connection to be established
      return new Promise((resolve) => {
        this.socket.once("connect", () => {
          this.isConnected = true;
          resolve(true);
        });

        // If connection fails, resolve with false after timeout
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn("Socket connection timeout");
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("Error connecting to socket:", error);
      return false;
    }
  }

  handleConnect() {
    console.log("Socket connected");
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.triggerEvent("connected", { connected: true });
  }

  handleDisconnect(reason) {
    console.log("Socket disconnected:", reason);
    this.isConnected = false;
    this.triggerEvent("disconnected", { reason });
  }

  handleError(error) {
    console.error("Socket connection error:", error);
    this.triggerEvent("error", { error });
  }

  // Send a message using Socket.IO
  sendMessage(conversationId, content, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot send message.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit("send_message", { conversationId, content }, callback);
    return true;
  }

  // Mark a message as read
  markMessageAsRead(messageId, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot mark message as read.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit("mark_read", { messageId }, callback);
    return true;
  }

  // Mark all messages in a conversation as read
  markAllAsRead(conversationId, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot mark all as read.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit("mark_all_read", { conversationId }, callback);
    return true;
  }

  // Send typing status
  sendTypingStatus(conversationId, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot send typing status.");
      return false;
    }

    this.socket.emit("typing", { conversationId, isTyping });
    return true;
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);
    return () => this.removeEventListener(event, callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Trigger event for all registered listeners
  triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach((callback) => setTimeout(() => callback(data), 0));
    }

    // Also trigger for wildcard listeners
    if (this.listeners.has("*")) {
      const callbacks = this.listeners.get("*");
      callbacks.forEach((callback) =>
        setTimeout(() => callback({ type: event, ...data }), 0)
      );
    }
  }

  // Notify about new message (used for local state updates)
  notifyNewMessage(message) {
    this.triggerEvent("new_message", { message });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
