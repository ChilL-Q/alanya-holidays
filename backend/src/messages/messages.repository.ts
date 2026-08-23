import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ChatConversationEntity,
  ChatMessageEntity,
  ChatReportEntity,
  ProfileSummary,
  PropertySummary,
} from './types/messages.types';

@Injectable()
export class MessagesRepository {
  private readonly logger = new Logger(MessagesRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async findUserConversations(
    userId: string,
  ): Promise<ChatConversationEntity[]> {
    const { data, error } = await this.client
      .from('chat_conversations')
      .select('*')
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as unknown as ChatConversationEntity[];
  }

  async findConversationById(
    conversationId: string,
  ): Promise<ChatConversationEntity | null> {
    const { data, error } = await this.client
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown as ChatConversationEntity) || null;
  }

  async findExistingConversation(
    guestId: string,
    hostId: string,
    propertyId?: string | null,
  ): Promise<ChatConversationEntity | null> {
    let query = this.client
      .from('chat_conversations')
      .select('*')
      .or(
        `and(guest_id.eq.${guestId},host_id.eq.${hostId}),and(guest_id.eq.${hostId},host_id.eq.${guestId})`,
      );

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    return data && data.length > 0
      ? (data[0] as unknown as ChatConversationEntity)
      : null;
  }

  async createConversation(data: {
    guest_id: string;
    host_id: string;
    property_id?: string | null;
  }): Promise<ChatConversationEntity> {
    const { data: created, error } = await this.client
      .from('chat_conversations')
      .insert({
        guest_id: data.guest_id,
        host_id: data.host_id,
        property_id: data.property_id || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as unknown as ChatConversationEntity;
  }

  async findMessagesByConversationId(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessageEntity[]> {
    const { data, error } = await this.client
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return (data || []) as unknown as ChatMessageEntity[];
  }

  async insertChatMessage(data: {
    conversation_id: string;
    sender_id: string;
    content: string;
  }): Promise<ChatMessageEntity> {
    const { data: message, error } = await this.client
      .from('chat_messages')
      .insert({
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return message as unknown as ChatMessageEntity;
  }

  async updateConversationTimestamp(conversationId: string): Promise<void> {
    const { error } = await this.client
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw new Error(error.message);
  }

  async markMessagesAsRead(
    conversationId: string,
    recipientUserId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', recipientUserId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  }

  async insertChatReport(data: {
    reporter_id: string;
    reported_id: string;
    conversation_id?: string | null;
    reason: string;
    description?: string | null;
  }): Promise<ChatReportEntity> {
    const { data: report, error } = await this.client
      .from('chat_reports')
      .insert({
        reporter_id: data.reporter_id,
        reported_id: data.reported_id,
        conversation_id: data.conversation_id || null,
        reason: data.reason,
        details: data.description || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return report as unknown as ChatReportEntity;
  }

  async getProfilesByIds(userIds: string[]): Promise<ProfileSummary[]> {
    if (!userIds.length) return [];
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', userIds);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPropertiesByIds(propertyIds: string[]): Promise<PropertySummary[]> {
    if (!propertyIds.length) return [];
    const { data, error } = await this.client
      .from('properties')
      .select('id, title, images')
      .in('id', propertyIds);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getLastMessagesAndUnreadCounts(
    conversationIds: string[],
    currentUserId: string,
  ): Promise<
    Record<
      string,
      { last_message: ChatMessageEntity | null; unread_count: number }
    >
  > {
    if (!conversationIds.length) return {};

    const result: Record<
      string,
      { last_message: ChatMessageEntity | null; unread_count: number }
    > = {};
    for (const id of conversationIds) {
      result[id] = { last_message: null, unread_count: 0 };
    }

    // Fast Path: Single-query RPC using DISTINCT ON & COUNT FILTER (O(1) network transfer)
    try {
      interface ChatRpcRow {
        conversation_id: string;
        last_message_id: string | null;
        last_message_sender_id: string | null;
        last_message_content: string | null;
        last_message_is_read: boolean | null;
        last_message_created_at: string | null;
        unread_count: number | string | null;
      }

      const response = (await this.client.rpc(
        'get_conversations_last_and_unread',
        {
          p_conversation_ids: conversationIds,
          p_user_id: currentUserId,
        },
      )) as {
        data: ChatRpcRow[] | null;
        error: { message: string } | null;
      };

      if (
        !response.error &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        for (const row of response.data) {
          result[row.conversation_id] = {
            last_message: row.last_message_id
              ? {
                  id: row.last_message_id,
                  conversation_id: row.conversation_id,
                  sender_id: row.last_message_sender_id || '',
                  content: row.last_message_content || '',
                  is_read: Boolean(row.last_message_is_read),
                  created_at: row.last_message_created_at || '',
                }
              : null,
            unread_count: Number(row.unread_count) || 0,
          };
        }
        return result;
      }
    } catch {
      // Graceful fallback for mock environments or legacy replicas
    }

    // Fallback: Batched dual queries
    const [messagesRes, unreadRes] = await Promise.all([
      this.client
        .from('chat_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false }),
      this.client
        .from('chat_messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', currentUserId)
        .eq('is_read', false),
    ]);

    if (messagesRes.data) {
      for (const msg of messagesRes.data as unknown as ChatMessageEntity[]) {
        if (!result[msg.conversation_id].last_message) {
          result[msg.conversation_id].last_message = msg;
        }
      }
    }

    if (unreadRes.data) {
      for (const row of unreadRes.data as unknown as {
        conversation_id: string;
      }[]) {
        if (result[row.conversation_id]) {
          result[row.conversation_id].unread_count += 1;
        }
      }
    }

    return result;
  }

  async insertContactMessage(messageData: {
    name: string;
    email: string;
    subject?: string | null;
    message: string;
    visa_type?: string | null;
    phone?: string | null;
  }): Promise<void> {
    const { error } = await this.client.from('messages').insert([messageData]);
    if (error) throw new Error(error.message);
  }

  invokeEmailFunction(payload: Record<string, unknown>): void {
    this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err: unknown) => {
        this.logger.error(
          'Failed to send email',
          err instanceof Error ? err.stack : undefined,
        );
      });
  }
}
