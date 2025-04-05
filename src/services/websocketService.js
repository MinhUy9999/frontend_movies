import { io } from "socket.io-client";

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
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token available");
        return false;
      }

      const socketUrl = import.meta.env.VITE_WS_URL || "http://localhost:5000";

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
      this.socket.on("conversation_read", (data) =>
        this.triggerEvent("conversation_read", data)
      );
      this.socket.on("typing", (data) => this.triggerEvent("typing", data));
      this.socket.on("pong", (data) => this.triggerEvent("pong", data));
      this.socket.on("error", (data) =>
        this.triggerEvent("socket_error", data)
      );

      // Wait for connection to be established
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            console.warn("Socket connection timeout");
            resolve(false);
          }
        }, 5000);

        this.socket.once("connect", () => {
          clearTimeout(timeout);
          this.isConnected = true;
          resolve(true);
        });
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

    // Send ping to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit("ping");
      }
    }, 30000);
  }

  handleDisconnect(reason) {
    console.log("Socket disconnected:", reason);
    this.isConnected = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.triggerEvent("disconnected", { reason });
  }

  handleError(error) {
    console.error("Socket connection error:", error);
    this.triggerEvent("error", { error });
  }

  // Send a message
  sendMessage(conversationId, content, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot send message.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit(
      "chat_message",
      { receiverId: conversationId, content },
      (response) => {
        if (callback) callback(response);
      }
    );
    return true;
  }

  // Mark a message as read
  markMessageAsRead(messageId, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot mark message as read.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit("message_read", { messageId }, (response) => {
      if (callback) callback(response);
    });
    return true;
  }

  joinConversation(conversationId, callback) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot join conversation.");
      if (callback) callback({ success: false, error: "Socket not connected" });
      return false;
    }

    this.socket.emit("join_conversation", { conversationId }, (response) => {
      if (callback) callback(response);
    });
    return true;
  }

  sendTypingStatus(conversationId, isTyping) {
    if (!this.socket || !this.isConnected) {
      console.error("Socket not connected. Cannot send typing status.");
      return false;
    }

    this.socket.emit("typing", { conversationId, typing: isTyping });
    return true;
  }

  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);
    return () => this.removeEventListener(event, callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  triggerEvent(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach((callback) => setTimeout(() => callback(data), 0));
    }
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

const socketService = new SocketService();
export default socketService;
