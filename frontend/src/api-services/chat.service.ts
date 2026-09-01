import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  online?: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  isOutgoing?: boolean;
  status?: "sending" | "delivered" | "failed";
}

export interface ChatConversation {
  id: string;
  participant: ChatParticipant;
  propertyId?: string;
  propertyName?: string;
  lastMessage?: {
    id?: string;
    content: string;
    createdAt: string;
    senderId?: string;
    isRead?: boolean;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export function formatMessageClockTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export interface CreateConversationInput {
  recipientId: string;
  propertyId?: string;
  initialMessage?: string;
}

export interface ReportChatInput {
  reportedId: string;
  conversationId?: string;
  reason: string;
  description?: string;
}

export interface BackendChatConversation {
  id: string;
  property_id?: string | null;
  guest_id?: string;
  host_id?: string;
  created_at?: string;
  updated_at?: string;
  participant?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
  last_message?: {
    id?: string;
    content: string;
    created_at: string;
    sender_id?: string;
    is_read?: boolean;
  };
  unread_count?: number;
  property?: {
    id: string;
    title: string;
  };
}

export interface BackendChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read?: boolean;
  created_at?: string;
  sender?: {
    id?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function formatChatTime(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function mapBackendConversationToChatConversation(
  conv: BackendChatConversation
): ChatConversation {
  const defaultAvatar =
    "/images/placeholder-business.svg";

  return {
    id: conv.id,
    participant: {
      id: conv.participant?.id || conv.host_id || conv.guest_id || "participant-unknown",
      name: conv.participant?.full_name || "Alanya Member",
      avatar: conv.participant?.avatar_url || defaultAvatar,
      role: conv.participant?.role || "Member",
      online: true,
    },
    propertyId: conv.property_id || undefined,
    propertyName: conv.property?.title,
    lastMessage: conv.last_message
      ? {
          id: conv.last_message.id,
          content: conv.last_message.content,
          createdAt: conv.last_message.created_at,
          senderId: conv.last_message.sender_id,
          isRead: conv.last_message.is_read,
        }
      : undefined,
    unreadCount: conv.unread_count ?? 0,
    createdAt: conv.created_at || new Date().toISOString(),
    updatedAt: conv.updated_at || conv.created_at || new Date().toISOString(),
  };
}

export function mapBackendMessageToChatMessage(msg: BackendChatMessage): ChatMessage {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    senderName: msg.sender?.full_name,
    senderAvatar: msg.sender?.avatar_url,
    content: msg.content,
    isRead: Boolean(msg.is_read),
    createdAt: msg.created_at || new Date().toISOString(),
  };
}

export class ChatService {
  /**
   * Retrieves user's active conversations list from live backend.
   */
  async getConversations(options?: RequestOptions): Promise<ChatConversation[]> {
    try {
      const data = options
        ? await apiClient.get<BackendChatConversation[]>("/messages/conversations", options)
        : await apiClient.get<BackendChatConversation[]>("/messages/conversations");
      if (Array.isArray(data)) {
        return data.map(mapBackendConversationToChatConversation);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves message history for a specific conversation.
   */
  async getMessages(
    conversationId: string,
    options: { limit?: number; offset?: number } & RequestOptions = {}
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const { limit = 50, offset = 0, params: extraParams, ...reqConfig } = options;
    const params: Record<string, string | number | boolean | undefined> = { limit, offset };

    const response = await apiClient.get<{ messages: BackendChatMessage[]; total: number }>(
      `/messages/conversations/${conversationId}/messages`,
      {
        ...reqConfig,
        params: { ...extraParams, ...params },
      }
    );

    if (response && Array.isArray(response.messages)) {
      const messages = response.messages.map(mapBackendMessageToChatMessage);
      return {
        messages,
        total: response.total ?? messages.length,
      };
    }

    return {
      messages: [],
      total: 0,
    };
  }

  /**
   * Sends a new message in a conversation.
   */
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.post<BackendChatMessage>(
      `/messages/conversations/${conversationId}/messages`,
      { content }
    );

    return {
      ...mapBackendMessageToChatMessage(response),
      isOutgoing: true,
      status: "delivered",
    };
  }

  /**
   * Creates a new conversation with a host/user.
   */
  async createConversation(input: CreateConversationInput): Promise<ChatConversation> {
    const response = await apiClient.post<BackendChatConversation>("/messages/conversations", {
      recipientId: input.recipientId,
      propertyId: input.propertyId,
      initialMessage: input.initialMessage,
    });

    return mapBackendConversationToChatConversation(response);
  }

  /**
   * Marks unread messages in a conversation as read.
   */
  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(`/messages/conversations/${conversationId}/read`);
  }

  /**
   * Reports a user or abusive conversation to admins.
   */
  async reportChat(input: ReportChatInput): Promise<{ success: boolean; id: string }> {
    return apiClient.post<{ success: boolean; id: string }>("/messages/reports", {
      reportedId: input.reportedId,
      conversationId: input.conversationId,
      reason: input.reason,
      description: input.description,
    });
  }
}

export const chatService = new ChatService();

export const getConversations = (options?: RequestOptions) =>
  chatService.getConversations(options);
export const getMessages = (
  conversationId: string,
  options?: { limit?: number; offset?: number } & RequestOptions
) => chatService.getMessages(conversationId, options);
export const sendMessage = (conversationId: string, content: string) =>
  chatService.sendMessage(conversationId, content);
export const createConversation = (input: CreateConversationInput) =>
  chatService.createConversation(input);
export const markAsRead = (conversationId: string) => chatService.markAsRead(conversationId);
export const reportChat = (input: ReportChatInput) => chatService.reportChat(input);
