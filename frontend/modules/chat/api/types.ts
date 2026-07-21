import { ChatConversation, ChatMessage } from '../../../types/index';

export interface IChatRepository {
  getConversations(): Promise<ChatConversation[]>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, content: string): Promise<ChatMessage>;
  createConversation(propertyId: string, hostId: string): Promise<string>;
  createDirectConversation(guestId: string): Promise<string>;
  markAsRead(conversationId: string): Promise<void>;
  clearHistory(conversationId: string): Promise<void>;
  submitReport(data: {
        reporter_id: string;
        reported_id?: string;
        conversation_id: string;
        reason: string;
        description: string;
    }): Promise<void>;
  subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void): any;
}
