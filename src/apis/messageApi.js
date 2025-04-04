import { api, handleError } from "./index";

const messageApi = {
  getUserConversations: async () => {
    try {
      const response = await api.get("/messages/conversations");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getAvailableAdmins: async () => {
    try {
      const response = await api.get("/messages/available-admins");
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getConversation: async (otherUserId, limit = 50) => {
    try {

      const response = await api.get(
        `/messages/conversation/${otherUserId}?limit=${limit}`
      );

      if (response.data.statusCode === 200 && response.data.content) {
        if (
          !response.data.content.messages ||
          response.data.content.messages.length === 0
        ) {
          console.log("No messages found in API response");
        }
      }

      return response.data;
    } catch (error) {
      console.error("API error:", error);
      return handleError(error);
    }
  },

  sendMessage: async (receiverId, content) => {
    try {
      const response = await api.post("/messages", { receiverId, content });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  markAsRead: async (messageId) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

export default messageApi;
