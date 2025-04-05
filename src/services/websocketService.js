// src/services/websocketService.js
import { userApi } from "../apis/userApi";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  notifyNewMessage(message) {
    if (this.listeners.has("new_message")) {
      const callbacks = this.listeners.get("new_message");
      callbacks.forEach((callback) =>
        callback({
          type: "new_message",
          message,
        })
      );
    }
  }

  async connect() {
    try {
      let wsToken;

      try {
        const response = await userApi.getWebSocketToken();
        if (
          response.statusCode === 200 &&
          response.content &&
          response.content.wsToken
        ) {
          wsToken = response.content.wsToken;
        } else {
          console.warn("WebSocket token response invalid:", response);
          if (import.meta.env.DEV) {
            console.log(
              "Using mock WebSocket functionality in development mode"
            );
            return this.setupMockWebSocket();
          }
          return false;
        }
      } catch (error) {
        console.warn("Error getting WebSocket token:", error);
        if (import.meta.env.DEV) {
          console.log("Using mock WebSocket functionality in development mode");
          return this.setupMockWebSocket();
        }
        return false;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host =
        import.meta.env.VITE_WS_URL || `${window.location.hostname}:5000`;
      const wsUrl = `${protocol}//${host}/ws?token=${wsToken}`;

      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);

        return new Promise((resolve, reject) => {
          this.socket.addEventListener("open", () => resolve(true), {
            once: true,
          });
          this.socket.addEventListener(
            "error",
            () => {
              if (import.meta.env.DEV) {
                console.log(
                  "Real WebSocket connection failed. Using mock in development mode"
                );
                resolve(this.setupMockWebSocket());
              } else {
                reject(new Error("WebSocket connection failed"));
              }
            },
            { once: true }
          );

          setTimeout(() => {
            if (this.socket.readyState !== WebSocket.OPEN) {
              if (import.meta.env.DEV) {
                console.log(
                  "WebSocket connection timeout. Using mock in development mode"
                );
                resolve(this.setupMockWebSocket());
              } else {
                reject(new Error("WebSocket connection timeout"));
              }
            }
          }, 5000);
        });
      } catch (error) {
        console.error("Error creating WebSocket:", error);

        if (import.meta.env.DEV) {
          return this.setupMockWebSocket();
        }
        return false;
      }
    } catch (error) {
      console.error("WebSocket connection error:", error);
      return false;
    }
  }

  setupMockWebSocket() {
    console.log("Setting up mock WebSocket for development");

    this.socket = {
      readyState: WebSocket.OPEN,
      send: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "ping") {
            setTimeout(() => {
              this.handleMessage({
                data: JSON.stringify({
                  type: "pong",
                  timestamp: Date.now(),
                }),
              });
            }, 100);
          }
        } catch (e) {
          console.error("Error parsing mock message:", e);
        }
      },
      close: () => {
        console.log("Mock WebSocket closed");
        this.socket = null;
      },
    };

    setTimeout(() => {
      this.handleOpen();

      this.handleMessage({
        data: JSON.stringify({
          type: "connected",
          message: "Successfully connected to booking service (mock)",
        }),
      });

      setTimeout(() => {
        this.handleMessage({
          data: JSON.stringify({
            type: "booking_expiring",
            bookingId: "mock-booking-123",
            minutesLeft: 5,
          }),
        });

        setTimeout(() => {
          this.handleMessage({
            data: JSON.stringify({
              type: "seats_updated",
              showtimeId: "mock-showtime-456",
            }),
          });
        }, 5000);
      }, 10000);
    }, 500);

    return true;
  }

  handleOpen() {
    this.reconnectAttempts = 0;

    this.pingInterval = setInterval(() => {
      this.sendMessage({
        type: "ping",
        timestamp: Date.now(),
      });
    }, 30000);
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type && this.listeners.has(data.type)) {
        const callbacks = this.listeners.get(data.type);
        callbacks.forEach((callback) => callback(data));
      }

      if (this.listeners.has("*")) {
        const callbacks = this.listeners.get("*");
        callbacks.forEach((callback) => callback(data));
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  handleClose(event) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    clearInterval(this.pingInterval);

    if (
      event.code !== 1000 &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  handleError(error) {
    console.error("WebSocket error:", error);
  }

  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    } else {
      console.error("WebSocket not connected. Cannot send message.");
      return false;
    }
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type).add(callback);
    return () => this.removeEventListener(type, callback);
  }

  removeEventListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      clearInterval(this.pingInterval);
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
