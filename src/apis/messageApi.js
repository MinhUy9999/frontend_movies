import { api, handleError } from "./index";

const messageApi = {
  getUserConversations: async (type) => {
    try {
      const url = type
        ? `/chat/conversations?type=${type}`
        : "/chat/conversations";

      const response = await api.get(url);
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

  getOrCreateConversation: async (targetId, options = {}) => {
    try {
      let url = `/chat/conversation/${targetId}`;

      if (options && options.type === "admin-admin") {
        url += "?type=admin-admin";
      }

      const response = await api.get(url);
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
      const response = await api.get("/chat/admins");
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

  getConversation: async (otherUserId, isAdminToAdmin = false) => {
    try {
      const convResponse = await messageApi.getOrCreateConversation(
        otherUserId,
        { type: isAdminToAdmin ? "admin-admin" : "user-admin" }
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
