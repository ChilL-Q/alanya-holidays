import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  chatService,
  formatChatTime,
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markAsRead,
  reportChat,
} from "./chat.service";
import { apiClient } from "@/lib/api-client";

describe("chat.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatChatTime", () => {
    it("should format timestamps gracefully", () => {
      expect(formatChatTime(undefined)).toBe("Recently");
      expect(formatChatTime(null)).toBe("Recently");
      expect(formatChatTime("invalid-date")).toBe("invalid-date");

      const now = new Date();
      expect(formatChatTime(now.toISOString())).toBe("Just now");

      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatChatTime(fiveMinsAgo.toISOString())).toBe("5m ago");

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatChatTime(twoHoursAgo.toISOString())).toBe("2h ago");

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatChatTime(threeDaysAgo.toISOString())).toBe("3d ago");
    });
  });

  describe("getConversations", () => {
    it("should return mapped conversations when API returns data", async () => {
      const mockApiConversations = [
        {
          id: "conv-101",
          property_id: "prop-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participant: {
            id: "user-elena",
            full_name: "Elena Karaca",
            avatar_url: "https://example.com/elena.jpg",
            role: "Host",
          },
          last_message: {
            id: "msg-1",
            content: "Hello from Alanya!",
            created_at: new Date().toISOString(),
            sender_id: "user-elena",
            is_read: false,
          },
          unread_count: 2,
          property: {
            id: "prop-1",
            title: "Seaside Villa",
          },
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockApiConversations);

      const result = await chatService.getConversations();
      expect(apiClient.get).toHaveBeenCalledWith("/messages/conversations");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("conv-101");
      expect(result[0].participant.name).toBe("Elena Karaca");
      expect(result[0].participant.avatar).toBe("https://example.com/elena.jpg");
      expect(result[0].unreadCount).toBe(2);
      expect(result[0].lastMessage?.content).toBe("Hello from Alanya!");
      expect(result[0].propertyName).toBe("Seaside Villa");
    });

    it("should fall back to mock conversations when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConversations();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].participant.name).toBeDefined();
      expect(result[0].lastMessage).toBeDefined();
    });
  });

  describe("getMessages", () => {
    it("should fetch messages with pagination from API", async () => {
      const mockMessagesResponse = {
        messages: [
          {
            id: "msg-101",
            conversation_id: "conv-101",
            sender_id: "user-elena",
            content: "Welcome to Alanya!",
            is_read: true,
            created_at: new Date().toISOString(),
            sender: {
              id: "user-elena",
              full_name: "Elena Karaca",
              avatar_url: "https://example.com/elena.jpg",
            },
          },
        ],
        total: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockMessagesResponse);

      const result = await chatService.getMessages("conv-101", { limit: 10, offset: 0 });
      expect(apiClient.get).toHaveBeenCalledWith("/messages/conversations/conv-101/messages", {
        params: { limit: 10, offset: 0 },
      });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe("Welcome to Alanya!");
      expect(result.messages[0].senderName).toBe("Elena Karaca");
      expect(result.total).toBe(1);
    });

    it("should fall back to mock messages for conversation when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API offline"));

      const result = await getMessages("conv-elena");
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.total).toBe(result.messages.length);
      expect(result.messages[0].conversationId).toBe("conv-elena");
    });

    it("should generate default mock messages if conversation ID is unknown and API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getMessages("unknown-conv-id");
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0].conversationId).toBe("unknown-conv-id");
    });
  });

  describe("sendMessage", () => {
    it("should send message via POST to API", async () => {
      const mockMessage = {
        id: "msg-created-1",
        conversation_id: "conv-101",
        sender_id: "my-user-id",
        content: "I will arrive at 3 PM.",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockMessage);

      const result = await sendMessage("conv-101", "I will arrive at 3 PM.");
      expect(apiClient.post).toHaveBeenCalledWith("/messages/conversations/conv-101/messages", {
        content: "I will arrive at 3 PM.",
      });
      expect(result.id).toBe("msg-created-1");
      expect(result.content).toBe("I will arrive at 3 PM.");
      expect(result.isOutgoing).toBe(true);
    });

    it("should return fallback message object when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await chatService.sendMessage("conv-101", "Fallback test message");
      expect(result.content).toBe("Fallback test message");
      expect(result.conversationId).toBe("conv-101");
      expect(result.isOutgoing).toBe(true);
      expect(result.id).toMatch(/^msg-client-/);
    });
  });

  describe("createConversation", () => {
    it("should create conversation via API", async () => {
      const mockCreated = {
        id: "conv-new-123",
        property_id: "prop-42",
        participant: {
          id: "host-42",
          full_name: "Villa Host",
          avatar_url: "https://example.com/host.jpg",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockCreated);

      const result = await createConversation({
        recipientId: "host-42",
        propertyId: "prop-42",
        initialMessage: "Hi, is this available next month?",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/messages/conversations", {
        recipientId: "host-42",
        propertyId: "prop-42",
        initialMessage: "Hi, is this available next month?",
      });
      expect(result.id).toBe("conv-new-123");
      expect(result.participant.name).toBe("Villa Host");
    });

    it("should return fallback conversation when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network down"));

      const result = await chatService.createConversation({
        recipientId: "user-host-1",
        initialMessage: "Hello!",
      });

      expect(result.id).toMatch(/^conv-/);
      expect(result.lastMessage?.content).toBe("Hello!");
    });
  });

  describe("markAsRead", () => {
    it("should call PATCH /messages/conversations/:id/read", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const result = await markAsRead("conv-101");
      expect(apiClient.patch).toHaveBeenCalledWith("/messages/conversations/conv-101/read");
      expect(result.success).toBe(true);
    });

    it("should return success fallback when API fails", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValueOnce(new Error("Offline"));

      const result = await chatService.markAsRead("conv-101");
      expect(result.success).toBe(true);
    });
  });

  describe("reportChat", () => {
    it("should send report via POST to API", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, id: "rep-999" });

      const result = await reportChat({
        reportedId: "user-bad",
        conversationId: "conv-101",
        reason: "spam",
        description: "Sending spam links",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/messages/reports", {
        reportedId: "user-bad",
        conversationId: "conv-101",
        reason: "spam",
        description: "Sending spam links",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe("rep-999");
    });

    it("should return fallback response when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await chatService.reportChat({
        reportedId: "user-bad",
        reason: "harassment",
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^rep-/);
    });
  });
});
