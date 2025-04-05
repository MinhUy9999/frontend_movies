// src/apis/messageApi.js
import { api, handleError } from "./index";

const messageApi = {
  // Get all conversations for the current user
  getUserConversations: async () => {
    try {
      const response = await api.get("/chat/conversations");
      return {
        statusCode: response.status,
        content: response.data.data,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get messages for a specific conversation
  getConversationMessages: async (conversationId, page = 1, limit = 20) => {
    try {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages`,
        {
          params: { page, limit },
        }
      );
      return {
        statusCode: response.status,
        content: response.data.data,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Create or get a conversation with an admin/user
  getOrCreateConversation: async (otherUserId) => {
    try {
      const response = await api.post("/chat/conversations", { otherUserId });
      return {
        statusCode: response.status,
        content: response.data.data,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get all available admins
  getAvailableAdmins: async () => {
    try {
      const response = await api.get("/chat/available-admins");
      return {
        statusCode: response.status,
        content: response.data.data,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get a Socket.IO token
  getSocketToken: async () => {
    try {
      const response = await api.get("/chat/socket-token");
      return {
        statusCode: response.status,
        content: response.data.data,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Simplified method to get conversation with messages (convenience function)
  getConversation: async (otherUserId) => {
    try {
      // First get or create the conversation
      const convResponse = await messageApi.getOrCreateConversation(
        otherUserId
      );

      if (convResponse.statusCode !== 200 && convResponse.statusCode !== 201) {
        return convResponse;
      }

      const conversationId = convResponse.content.conversation._id;

      // Then get the messages for this conversation
      const msgResponse = await messageApi.getConversationMessages(
        conversationId
      );

      return {
        statusCode: msgResponse.statusCode,
        content: {
          conversation: convResponse.content.conversation,
          messages: msgResponse.content?.messages || [],
        },
        message: msgResponse.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Helper method to send a message (this will be replaced with Socket.IO)
  sendMessage: async (otherUserId, content) => {
    try {
      // First get or create the conversation
      const convResponse = await messageApi.getOrCreateConversation(
        otherUserId
      );

      if (convResponse.statusCode !== 200 && convResponse.statusCode !== 201) {
        return convResponse;
      }

      const conversationId = convResponse.content.conversation._id;

      // We'll simulate the response here since actual sending will happen via Socket.IO
      return {
        statusCode: 201,
        content: {
          message: {
            _id: `temp-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
          },
        },
        message: "Message sent successfully",
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Mark a message as read
  markAsRead: async (messageId) => {
    try {
      // In a real implementation, this would make an API call
      // For now, we'll simulate the response as this will be handled by Socket.IO
      return {
        statusCode: 200,
        content: { success: true },
        message: "Message marked as read",
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },
};

export default messageApi;
