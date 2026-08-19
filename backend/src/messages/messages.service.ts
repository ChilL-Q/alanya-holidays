import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ReportChatDto } from './dto/report-chat.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import {
  ChatConversationEntity,
  ChatMessageEntity,
  ChatReportEntity,
  EnrichedConversation,
  ProfileSummary,
  PropertySummary,
} from './types/messages.types';

const sanitizeString = (str?: string | null): string => {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
};

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  async getConversations(userId: string): Promise<EnrichedConversation[]> {
    const rawConversations =
      await this.messagesRepository.findUserConversations(userId);

    if (!rawConversations.length) {
      return [];
    }

    return this.enrichConversations(rawConversations, userId);
  }

  async createOrGetConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<EnrichedConversation> {
    if (dto.recipientId === userId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    let conversation = await this.messagesRepository.findExistingConversation(
      userId,
      dto.recipientId,
      dto.propertyId,
    );

    if (!conversation) {
      conversation = await this.messagesRepository.createConversation({
        guest_id: userId,
        host_id: dto.recipientId,
        property_id: dto.propertyId || null,
      });
    }

    if (dto.initialMessage) {
      const sanitizedContent = sanitizeString(dto.initialMessage);
      if (sanitizedContent) {
        await this.messagesRepository.insertChatMessage({
          conversation_id: conversation.id,
          sender_id: userId,
          content: sanitizedContent,
        });
        await this.messagesRepository.updateConversationTimestamp(
          conversation.id,
        );
      }
    }

    const [enriched] = await this.enrichConversations([conversation], userId);
    return enriched;
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
    limit?: number,
    offset?: number,
  ): Promise<ChatMessageEntity[]> {
    const conversation =
      await this.messagesRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.guest_id !== userId && conversation.host_id !== userId) {
      throw new ForbiddenException('Access denied to conversation');
    }

    return this.messagesRepository.findMessagesByConversationId(
      conversationId,
      limit ?? 50,
      offset ?? 0,
    );
  }

  async sendChatMessage(
    userId: string,
    conversationId: string,
    dto: SendChatMessageDto,
  ): Promise<ChatMessageEntity> {
    const conversation =
      await this.messagesRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.guest_id !== userId && conversation.host_id !== userId) {
      throw new ForbiddenException('Access denied to conversation');
    }

    const sanitizedContent = sanitizeString(dto.content);
    if (!sanitizedContent) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.messagesRepository.insertChatMessage({
      conversation_id: conversationId,
      sender_id: userId,
      content: sanitizedContent,
    });

    await this.messagesRepository.updateConversationTimestamp(conversationId);

    return message;
  }

  async markConversationAsRead(
    userId: string,
    conversationId: string,
  ): Promise<{ success: boolean; updated: boolean }> {
    const conversation =
      await this.messagesRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.guest_id !== userId && conversation.host_id !== userId) {
      throw new ForbiddenException('Access denied to conversation');
    }

    await this.messagesRepository.markMessagesAsRead(conversationId, userId);

    return { success: true, updated: true };
  }

  async reportChat(
    userId: string,
    dto: ReportChatDto,
  ): Promise<ChatReportEntity> {
    const sanitizedReason = sanitizeString(dto.reason);
    const sanitizedDesc = dto.description
      ? sanitizeString(dto.description)
      : null;

    if (!sanitizedReason) {
      throw new BadRequestException('Reason cannot be empty');
    }

    return this.messagesRepository.insertChatReport({
      reporter_id: userId,
      reported_id: dto.reportedId,
      conversation_id: dto.conversationId || null,
      reason: sanitizedReason,
      description: sanitizedDesc,
    });
  }

  async sendContactMessage(
    dto: CreateContactMessageDto,
  ): Promise<{ success: boolean }> {
    const sanitized = {
      name: sanitizeString(dto.name).slice(0, 200),
      email: sanitizeString(dto.email).slice(0, 320),
      subject: dto.subject ? sanitizeString(dto.subject).slice(0, 500) : null,
      message: sanitizeString(dto.message).slice(0, 10000),
      visa_type: dto.visa_type
        ? sanitizeString(dto.visa_type).slice(0, 100)
        : null,
      phone: dto.phone ? sanitizeString(dto.phone).slice(0, 50) : null,
    };

    await this.messagesRepository.insertContactMessage(sanitized);

    this.messagesRepository.invokeEmailFunction({
      type: 'admin_contact_message',
      to: 'contact@alanyaholidays.com',
      data: {
        name: sanitized.name,
        email: sanitized.email,
        subject: sanitized.subject,
        message: sanitized.message,
        visa_type: sanitized.visa_type,
        phone: sanitized.phone,
      },
    });

    return { success: true };
  }

  async sendMessage(
    dto: CreateContactMessageDto,
  ): Promise<{ success: boolean }> {
    return this.sendContactMessage(dto);
  }

  private async enrichConversations(
    conversations: ChatConversationEntity[],
    currentUserId: string,
  ): Promise<EnrichedConversation[]> {
    const userIds = [
      ...new Set(
        conversations.flatMap((c) => [c.guest_id, c.host_id]).filter(Boolean),
      ),
    ];
    const propertyIds = [
      ...new Set(
        conversations
          .map((c) => c.property_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const conversationIds = conversations.map((c) => c.id);

    const [profiles, properties, messageDataMap] = await Promise.all([
      this.messagesRepository.getProfilesByIds(userIds),
      this.messagesRepository.getPropertiesByIds(propertyIds),
      this.messagesRepository.getLastMessagesAndUnreadCounts(
        conversationIds,
        currentUserId,
      ),
    ]);

    const profilesMap = new Map<string, ProfileSummary>(
      profiles.map((p) => [p.id, p]),
    );
    const propertiesMap = new Map<string, PropertySummary>(
      properties.map((p) => [p.id, p]),
    );

    return conversations.map((conv) => {
      const guest = profilesMap.get(conv.guest_id) || null;
      const host = profilesMap.get(conv.host_id) || null;
      const otherUserId =
        conv.guest_id === currentUserId ? conv.host_id : conv.guest_id;
      const otherUser = profilesMap.get(otherUserId) || null;
      const property = conv.property_id
        ? propertiesMap.get(conv.property_id) || null
        : null;
      const msgMeta = messageDataMap[conv.id] || {
        last_message: null,
        unread_count: 0,
      };

      return {
        ...conv,
        guest,
        host,
        other_user: otherUser,
        property,
        last_message: msgMeta.last_message,
        unread_count: msgMeta.unread_count,
      };
    });
  }
}
