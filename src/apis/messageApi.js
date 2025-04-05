import { api, handleError } from "./index";

const messageApi = {
  getUserConversations: async () => {
    try {
      const response = await api.get("/chat/conversations");
      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  getMessages: async (conversationId) => {
    try {
      const response = await api.get(`/chat/messages/${conversationId}`);
      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  getOrCreateConversation: async (adminId) => {
    try {
      const response = await api.get(`/chat/conversation/${adminId}`);
      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  getAvailableAdmins: async () => {
    try {
      console.log("Calling getAvailableAdmins API");
      const response = await api.get("/chat/admins");
      console.log("API Response:", response);
      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Complete error in getAvailableAdmins:", error);
      return handleError(error);
    }
  },

  markConversationAsRead: async (conversationId) => {
    try {
      const response = await api.put(
        `/chat/conversation/${conversationId}/read`
      );
      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },

  getConversation: async (otherUserId) => {
    try {
      const convResponse = await messageApi.getOrCreateConversation(
        otherUserId
      );

      if (convResponse.statusCode !== 200 && convResponse.statusCode !== 201) {
        return convResponse;
      }

      const conversationId = convResponse.content.conversation._id;

      const msgResponse = await messageApi.getMessages(conversationId);

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

  sendMessage: async (conversationId, content) => {
    try {
      const response = await api.post("/chat/message", {
        conversationId,
        content,
      });

      return {
        statusCode: response.status,
        content: response.data.content,
        message: response.data.message,
        date: new Date().toISOString(),
      };
    } catch (error) {
      return handleError(error);
    }
  },
};

export default messageApi;
