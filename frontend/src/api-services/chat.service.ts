import { apiClient } from "@/lib/api-client";

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
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatMessageClockTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Rich mock conversation threads for graceful offline/demo fallback
const mockConversations: ChatConversation[] = [
  {
    id: "conv-elena",
    participant: {
      id: "user-elena",
      name: "Elena Karaca",
      avatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%2030s%20warm%20smile%20natural%20lighting%20soft%20background%20editorial%20style&width=120&height=120&seq=msg-avatar-01&orientation=squarish",
      role: "Local Host & Expat Guide",
      online: true,
      lastSeen: "Active now",
    },
    propertyName: "Cleopatra Beach View Apartment",
    lastMessage: {
      content:
        "Hey! Are you coming to the language exchange this Saturday? It is at the new cafe near the harbor...",
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      senderId: "user-elena",
      isRead: false,
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-marco",
    participant: {
      id: "user-marco",
      name: "Marco Bianchi",
      avatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Italian%20man%20in%20his%2040s%20friendly%20expression%20outdoor%20cafe%20setting%20Mediterranean%20light&width=120&height=120&seq=msg-avatar-02&orientation=squarish",
      role: "Verified Guest",
      online: false,
      lastSeen: "1h ago",
    },
    propertyName: "Taurus Mountain Luxury Retreat",
    lastMessage: {
      content: "I found that hidden beach you mentioned! Absolutely stunning. Thanks for the tip.",
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      senderId: "user-marco",
      isRead: false,
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-aylin",
    participant: {
      id: "user-aylin",
      name: "Aylin Demir",
      avatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%20late%2020s%20confident%20expression%20modern%20casual%20style%20warm%20studio%20lighting&width=120&height=120&seq=msg-avatar-03&orientation=squarish",
      role: "Event Organizer",
      online: true,
      lastSeen: "Active now",
    },
    lastMessage: {
      content: "The event next week has been updated — we moved it to Thursday instead of Wednesday.",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      senderId: "user-aylin",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-community",
    participant: {
      id: "user-community",
      name: "Community Announcements",
      avatar:
        "https://readdy.ai/api/search-image?query=Alanya%20Forum%20community%20logo%20icon%20on%20warm%20textured%20background%20Mediterranean%20colors%20minimalist%20design&width=120&height=120&seq=msg-avatar-04&orientation=squarish",
      role: "Official Alanya Holidays Team",
      online: true,
      lastSeen: "Official Channel",
    },
    lastMessage: {
      content: "New feature: you can now RSVP to events directly from the forum. Check it out!",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      senderId: "user-community",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-david",
    participant: {
      id: "user-david",
      name: "David Chen",
      avatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Asian%20man%20in%20his%2030s%20relaxed%20smile%20outdoor%20setting%20warm%20golden%20light%20editorial%20photography&width=120&height=120&seq=msg-avatar-05&orientation=squarish",
      role: "Foodie & Traveler",
      online: false,
      lastSeen: "2d ago",
    },
    lastMessage: {
      content: "Thanks for the restaurant recommendations! We tried Pasha Lounge last night and it was incredible.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      senderId: "user-david",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "conv-hiking",
    participant: {
      id: "user-hiking",
      name: "Hiking Group",
      avatar:
        "https://readdy.ai/api/search-image?query=Group%20of%20hikers%20on%20Mediterranean%20coastal%20trail%20warm%20sunlight%20scenic%20mountain%20view%20Turkey%20editorial%20adventure%20photography&width=120&height=120&seq=msg-avatar-06&orientation=squarish",
      role: "Adventure Club",
      online: false,
      lastSeen: "3d ago",
    },
    lastMessage: {
      content: "This Sunday hiking route: Dim Valley to Taurus mountains. Meeting point at 7 AM sharp.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      senderId: "user-hiking",
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockThreadMessages: Record<string, ChatMessage[]> = {
  "conv-elena": [
    {
      id: "msg-e1",
      conversationId: "conv-elena",
      senderId: "user-elena",
      senderName: "Elena Karaca",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%2030s%20warm%20smile%20natural%20lighting%20soft%20background%20editorial%20style&width=120&height=120&seq=msg-avatar-01&orientation=squarish",
      content: "Hi there! Welcome to Alanya Holidays. How can I help you regarding the Cleopatra Beach Apartment?",
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
    {
      id: "msg-e2",
      conversationId: "conv-elena",
      senderId: "me",
      senderName: "You",
      content: "Hi Elena! Is the balcony sea-facing? And is high-speed Wi-Fi available for remote work?",
      isRead: true,
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      isOutgoing: true,
    },
    {
      id: "msg-e3",
      conversationId: "conv-elena",
      senderId: "user-elena",
      senderName: "Elena Karaca",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%2030s%20warm%20smile%20natural%20lighting%20soft%20background%20editorial%20style&width=120&height=120&seq=msg-avatar-01&orientation=squarish",
      content: "Yes, absolutely! 100 Mbps fiber optic connection, and direct sunset sea views over Cleopatra Beach.",
      isRead: true,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
    {
      id: "msg-e4",
      conversationId: "conv-elena",
      senderId: "user-elena",
      senderName: "Elena Karaca",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%2030s%20warm%20smile%20natural%20lighting%20soft%20background%20editorial%20style&width=120&height=120&seq=msg-avatar-01&orientation=squarish",
      content:
        "Hey! Are you coming to the language exchange this Saturday? It is at the new cafe near the harbor...",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
  "conv-marco": [
    {
      id: "msg-m1",
      conversationId: "conv-marco",
      senderId: "me",
      senderName: "You",
      content: "Hey Marco, check out the cove just past Syedra ruins — almost no tourists there.",
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isOutgoing: true,
    },
    {
      id: "msg-m2",
      conversationId: "conv-marco",
      senderId: "user-marco",
      senderName: "Marco Bianchi",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Italian%20man%20in%20his%2040s%20friendly%20expression%20outdoor%20cafe%20setting%20Mediterranean%20light&width=120&height=120&seq=msg-avatar-02&orientation=squarish",
      content: "I found that hidden beach you mentioned! Absolutely stunning. Thanks for the tip.",
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
  "conv-aylin": [
    {
      id: "msg-a1",
      conversationId: "conv-aylin",
      senderId: "user-aylin",
      senderName: "Aylin Demir",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Turkish%20woman%20in%20her%20late%2020s%20confident%20expression%20modern%20casual%20style%20warm%20studio%20lighting&width=120&height=120&seq=msg-avatar-03&orientation=squarish",
      content: "The event next week has been updated — we moved it to Thursday instead of Wednesday.",
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
  "conv-community": [
    {
      id: "msg-c1",
      conversationId: "conv-community",
      senderId: "user-community",
      senderName: "Community Announcements",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Alanya%20Forum%20community%20logo%20icon%20on%20warm%20textured%20background%20Mediterranean%20colors%20minimalist%20design&width=120&height=120&seq=msg-avatar-04&orientation=squarish",
      content: "New feature: you can now RSVP to events directly from the forum. Check it out!",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
  "conv-david": [
    {
      id: "msg-d1",
      conversationId: "conv-david",
      senderId: "user-david",
      senderName: "David Chen",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Portrait%20of%20Asian%20man%20in%20his%2030s%20relaxed%20smile%20outdoor%20setting%20warm%20golden%20light%20editorial%20photography&width=120&height=120&seq=msg-avatar-05&orientation=squarish",
      content: "Thanks for the restaurant recommendations! We tried Pasha Lounge last night and it was incredible.",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
  "conv-hiking": [
    {
      id: "msg-h1",
      conversationId: "conv-hiking",
      senderId: "user-hiking",
      senderName: "Hiking Group",
      senderAvatar:
        "https://readdy.ai/api/search-image?query=Group%20of%20hikers%20on%20Mediterranean%20coastal%20trail%20warm%20sunlight%20scenic%20mountain%20view%20Turkey%20editorial%20adventure%20photography&width=120&height=120&seq=msg-avatar-06&orientation=squarish",
      content: "This Sunday hiking route: Dim Valley to Taurus mountains. Meeting point at 7 AM sharp.",
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isOutgoing: false,
    },
  ],
};

function mapBackendConversationToChatConversation(raw: BackendChatConversation): ChatConversation {
  return {
    id: raw.id,
    participant: {
      id: raw.participant?.id || raw.host_id || raw.guest_id || "participant-unknown",
      name: raw.participant?.full_name || "Community Member",
      avatar:
        raw.participant?.avatar_url ||
        "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20natural%20light&width=120&height=120&seq=msg-avatar-default&orientation=squarish",
      role: raw.participant?.role || "Member",
      online: false,
    },
    propertyId: raw.property_id || raw.property?.id || undefined,
    propertyName: raw.property?.title || undefined,
    lastMessage: raw.last_message
      ? {
          id: raw.last_message.id,
          content: raw.last_message.content,
          createdAt: raw.last_message.created_at,
          senderId: raw.last_message.sender_id,
          isRead: raw.last_message.is_read,
        }
      : undefined,
    unreadCount: raw.unread_count ?? 0,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.created_at || new Date().toISOString(),
  };
}

function mapBackendMessageToChatMessage(raw: BackendChatMessage): ChatMessage {
  return {
    id: raw.id,
    conversationId: raw.conversation_id,
    senderId: raw.sender_id,
    senderName: raw.sender?.full_name || "Member",
    senderAvatar: raw.sender?.avatar_url,
    content: raw.content,
    isRead: !!raw.is_read,
    createdAt: raw.created_at || new Date().toISOString(),
    isOutgoing: false,
  };
}

const KNOWN_MOCK_CONVERSATION_IDS = new Set([
  "conv-elena",
  "conv-marco",
  "conv-aylin",
  "conv-community",
  "conv-david",
  "conv-hiking",
]);

export class ChatService {
  private isMockId(id: string): boolean {
    return (
      KNOWN_MOCK_CONVERSATION_IDS.has(id) ||
      id.startsWith("msg-client-") ||
      id.startsWith("msg-fallback-")
    );
  }

  /**
   * Retrieves user's active conversations list.
   * Falls back to mock conversations if offline or unauthenticated.
   */
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const data = await apiClient.get<BackendChatConversation[]>("/messages/conversations");
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapBackendConversationToChatConversation);
      }
    } catch {
      // Unauthenticated or offline - return mock conversations
    }

    return [...mockConversations];
  }

  /**
   * Retrieves message history for a specific conversation with optional pagination.
   */
  async getMessages(
    conversationId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    if (!this.isMockId(conversationId)) {
      try {
        const params: Record<string, string | number | boolean | undefined> = { limit, offset };
        const response = await apiClient.get<{ messages: BackendChatMessage[]; total: number }>(
          `/messages/conversations/${conversationId}/messages`,
          { params }
        );

        if (response && Array.isArray(response.messages)) {
          const messages = response.messages.map(mapBackendMessageToChatMessage);
          return {
            messages,
            total: response.total ?? messages.length,
          };
        }
      } catch {
        // Fall back to mock thread
      }
    }

    // Fallback mock handling
    const thread = mockThreadMessages[conversationId];
    if (thread && thread.length > 0) {
      const paginated = thread.slice(offset, offset + limit);
      return {
        messages: paginated,
        total: thread.length,
      };
    }

    // Generate fallback thread if conversation ID not in predefined map
    const defaultThread: ChatMessage[] = [
      {
        id: `msg-fallback-${conversationId}-1`,
        conversationId,
        senderId: "host-default",
        senderName: "Alanya Host",
        senderAvatar:
          "https://readdy.ai/api/search-image?query=Professional%20host%20portrait&width=120&height=120&seq=msg-fallback-avatar&orientation=squarish",
        content: "Hello! Welcome to our conversation. How can I help you today?",
        isRead: true,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
    ];

    return {
      messages: defaultThread,
      total: defaultThread.length,
    };
  }

  /**
   * Sends a new message in a conversation.
   */
  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    if (!this.isMockId(conversationId)) {
      try {
        const response = await apiClient.post<BackendChatMessage>(
          `/messages/conversations/${conversationId}/messages`,
          { content }
        );

        if (response && response.id) {
          return {
            ...mapBackendMessageToChatMessage(response),
            isOutgoing: true,
          };
        }
      } catch {
        // Fall back to optimistic message
      }
    }

    // Fallback newly generated message
    const optimisticMessage: ChatMessage = {
      id: `msg-client-${Date.now()}`,
      conversationId,
      senderId: "me",
      senderName: "You",
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      isOutgoing: true,
    };

    if (!mockThreadMessages[conversationId]) {
      mockThreadMessages[conversationId] = [];
    }
    mockThreadMessages[conversationId].push(optimisticMessage);

    return optimisticMessage;
  }

  /**
   * Creates a new conversation with a host/user.
   */
  async createConversation(input: CreateConversationInput): Promise<ChatConversation> {
    try {
      const response = await apiClient.post<BackendChatConversation>("/messages/conversations", {
        recipientId: input.recipientId,
        propertyId: input.propertyId,
        initialMessage: input.initialMessage,
      });

      if (response && response.id) {
        return mapBackendConversationToChatConversation(response);
      }
    } catch {
      // Fallback
    }

    const newId = `conv-${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      participant: {
        id: input.recipientId,
        name: "Alanya Host",
        avatar:
          "https://readdy.ai/api/search-image?query=Portrait%20host%20welcome&width=120&height=120&seq=conv-new-avatar&orientation=squarish",
        role: "Host",
        online: true,
      },
      propertyId: input.propertyId,
      lastMessage: input.initialMessage
        ? {
            content: input.initialMessage,
            createdAt: new Date().toISOString(),
            senderId: "me",
            isRead: false,
          }
        : undefined,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockConversations.unshift(newConv);
    return newConv;
  }

  /**
   * Marks unread messages in a conversation as read.
   */
  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    if (!this.isMockId(conversationId)) {
      try {
        await apiClient.patch<{ success: boolean }>(`/messages/conversations/${conversationId}/read`);
      } catch {
        // Fallback
      }
    }
    return { success: true };
  }

  /**
   * Reports a user or abusive conversation to admins.
   */
  async reportChat(input: ReportChatInput): Promise<{ success: boolean; id: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; id: string }>("/messages/reports", {
        reportedId: input.reportedId,
        conversationId: input.conversationId,
        reason: input.reason,
        description: input.description,
      });

      if (response && response.success) {
        return response;
      }
    } catch (err) {
      console.warn("Failed to submit chat report to API, using fallback response:", err);
    }

    return {
      success: true,
      id: `rep-${Date.now()}`,
    };
  }
}

export const chatService = new ChatService();

export const getConversations = () => chatService.getConversations();
export const getMessages = (conversationId: string, options?: { limit?: number; offset?: number }) =>
  chatService.getMessages(conversationId, options);
export const sendMessage = (conversationId: string, content: string) =>
  chatService.sendMessage(conversationId, content);
export const createConversation = (input: CreateConversationInput) =>
  chatService.createConversation(input);
export const markAsRead = (conversationId: string) => chatService.markAsRead(conversationId);
export const reportChat = (input: ReportChatInput) => chatService.reportChat(input);
