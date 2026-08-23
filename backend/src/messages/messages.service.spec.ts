import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ReportChatDto } from './dto/report-chat.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockRepository = {
    findUserConversations: jest.fn(),
    findConversationById: jest.fn(),
    findExistingConversation: jest.fn(),
    createConversation: jest.fn(),
    findMessagesByConversationId: jest.fn(),
    insertChatMessage: jest.fn(),
    updateConversationTimestamp: jest.fn(),
    markMessagesAsRead: jest.fn(),
    insertChatReport: jest.fn(),
    getProfilesByIds: jest.fn(),
    getPropertiesByIds: jest.fn(),
    getLastMessagesAndUnreadCounts: jest.fn(),
    insertContactMessage: jest.fn(),
    invokeEmailFunction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: MessagesRepository,
          useValue: mockRepository,
        },
        {
          provide: EmailOutboxRepository,
          useValue: { enqueue: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('getConversations', () => {
    it('should return empty array if user has no conversations', async () => {
      mockRepository.findUserConversations.mockResolvedValue([]);

      const result = await service.getConversations('user-1');

      expect(result).toEqual([]);
      expect(mockRepository.findUserConversations).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should return enriched conversations with participants, property, last message, and unread count', async () => {
      const rawConversations = [
        {
          id: 'conv-1',
          guest_id: 'user-1',
          host_id: 'user-2',
          property_id: 'prop-1',
          created_at: '2026-08-19T00:00:00Z',
          updated_at: '2026-08-19T01:00:00Z',
        },
      ];

      mockRepository.findUserConversations.mockResolvedValue(rawConversations);
      mockRepository.getProfilesByIds.mockResolvedValue([
        {
          id: 'user-1',
          full_name: 'Guest One',
          avatar_url: 'https://img.com/1.jpg',
          email: 'guest@test.com',
        },
        {
          id: 'user-2',
          full_name: 'Host Two',
          avatar_url: 'https://img.com/2.jpg',
          email: 'host@test.com',
        },
      ]);
      mockRepository.getPropertiesByIds.mockResolvedValue([
        { id: 'prop-1', title: 'Luxury Villa', images: ['villa.jpg'] },
      ]);
      mockRepository.getLastMessagesAndUnreadCounts.mockResolvedValue({
        'conv-1': {
          last_message: {
            id: 'msg-1',
            conversation_id: 'conv-1',
            sender_id: 'user-2',
            content: 'Hello guest!',
            is_read: false,
            created_at: '2026-08-19T01:00:00Z',
          },
          unread_count: 1,
        },
      });

      const result = await service.getConversations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv-1');
      expect(result[0].other_user?.id).toBe('user-2');
      expect(result[0].other_user?.full_name).toBe('Host Two');
      expect(result[0].guest?.full_name).toBe('Guest One');
      expect(result[0].host?.full_name).toBe('Host Two');
      expect(result[0].property?.title).toBe('Luxury Villa');
      expect(result[0].last_message?.content).toBe('Hello guest!');
      expect(result[0].unread_count).toBe(1);
    });
  });

  describe('createOrGetConversation', () => {
    it('should throw BadRequestException if recipient is the current user', async () => {
      const dto: CreateConversationDto = { recipientId: 'user-1' };

      await expect(
        service.createOrGetConversation('user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing conversation if one already exists', async () => {
      const dto: CreateConversationDto = {
        recipientId: 'user-2',
        propertyId: 'prop-1',
      };
      const existingConv = {
        id: 'conv-1',
        guest_id: 'user-1',
        host_id: 'user-2',
        property_id: 'prop-1',
        created_at: '2026-08-19T00:00:00Z',
        updated_at: '2026-08-19T00:00:00Z',
      };

      mockRepository.findExistingConversation.mockResolvedValue(existingConv);
      mockRepository.getProfilesByIds.mockResolvedValue([
        { id: 'user-1', full_name: 'Guest', avatar_url: null },
        { id: 'user-2', full_name: 'Host', avatar_url: null },
      ]);
      mockRepository.getPropertiesByIds.mockResolvedValue([]);
      mockRepository.getLastMessagesAndUnreadCounts.mockResolvedValue({
        'conv-1': { last_message: null, unread_count: 0 },
      });

      const result = await service.createOrGetConversation('user-1', dto);

      expect(result.id).toBe('conv-1');
      expect(mockRepository.createConversation).not.toHaveBeenCalled();
    });

    it('should create new conversation and post initial message if provided', async () => {
      const dto: CreateConversationDto = {
        recipientId: 'user-2',
        propertyId: 'prop-1',
        initialMessage: '<script>alert(1)</script>Hi there!',
      };
      const createdConv = {
        id: 'conv-2',
        guest_id: 'user-1',
        host_id: 'user-2',
        property_id: 'prop-1',
        created_at: '2026-08-19T00:00:00Z',
        updated_at: '2026-08-19T00:00:00Z',
      };

      mockRepository.findExistingConversation.mockResolvedValue(null);
      mockRepository.createConversation.mockResolvedValue(createdConv);
      mockRepository.insertChatMessage.mockResolvedValue({
        id: 'msg-new',
        conversation_id: 'conv-2',
        sender_id: 'user-1',
        content: 'Hi there!',
        is_read: false,
        created_at: '2026-08-19T00:00:00Z',
      });
      mockRepository.getProfilesByIds.mockResolvedValue([
        { id: 'user-1', full_name: 'Guest', avatar_url: null },
        { id: 'user-2', full_name: 'Host', avatar_url: null },
      ]);
      mockRepository.getPropertiesByIds.mockResolvedValue([]);
      mockRepository.getLastMessagesAndUnreadCounts.mockResolvedValue({
        'conv-2': { last_message: null, unread_count: 0 },
      });

      const result = await service.createOrGetConversation('user-1', dto);

      expect(mockRepository.createConversation).toHaveBeenCalledWith({
        guest_id: 'user-1',
        host_id: 'user-2',
        property_id: 'prop-1',
      });
      expect(mockRepository.insertChatMessage).toHaveBeenCalledWith({
        conversation_id: 'conv-2',
        sender_id: 'user-1',
        content: 'alert(1)Hi there!',
      });
      expect(result.id).toBe('conv-2');
    });
  });

  describe('getConversationMessages', () => {
    it('should throw NotFoundException if conversation does not exist', async () => {
      mockRepository.findConversationById.mockResolvedValue(null);

      await expect(
        service.getConversationMessages('user-1', 'conv-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither guest nor host', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-2',
        host_id: 'user-3',
      });

      await expect(
        service.getConversationMessages('user-intruder', 'conv-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return messages for valid participant with pagination', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-1',
        host_id: 'user-2',
      });
      mockRepository.findMessagesByConversationId.mockResolvedValue([
        {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-2',
          content: 'Hello',
          is_read: true,
          created_at: '2026-08-19T00:00:00Z',
        },
      ]);

      const messages = await service.getConversationMessages(
        'user-1',
        'conv-1',
        50,
        0,
      );

      expect(messages).toHaveLength(1);
      expect(mockRepository.findMessagesByConversationId).toHaveBeenCalledWith(
        'conv-1',
        50,
        0,
      );
    });
  });

  describe('sendChatMessage', () => {
    it('should throw NotFoundException if conversation does not exist', async () => {
      mockRepository.findConversationById.mockResolvedValue(null);

      await expect(
        service.sendChatMessage('user-1', 'conv-none', { content: 'hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-2',
        host_id: 'user-3',
      });

      await expect(
        service.sendChatMessage('user-intruder', 'conv-1', {
          content: 'hello',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should sanitize content, insert message, and update conversation timestamp', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-1',
        host_id: 'user-2',
      });
      mockRepository.insertChatMessage.mockResolvedValue({
        id: 'msg-10',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Clean text',
        is_read: false,
        created_at: '2026-08-19T00:00:00Z',
      });

      const result = await service.sendChatMessage('user-1', 'conv-1', {
        content: '<b>Clean text</b>',
      });

      expect(result.id).toBe('msg-10');
      expect(mockRepository.insertChatMessage).toHaveBeenCalledWith({
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Clean text',
      });
      expect(mockRepository.updateConversationTimestamp).toHaveBeenCalledWith(
        'conv-1',
      );
    });
  });

  describe('markConversationAsRead', () => {
    it('should throw NotFoundException if conversation not found', async () => {
      mockRepository.findConversationById.mockResolvedValue(null);

      await expect(
        service.markConversationAsRead('user-1', 'conv-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not participant', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-2',
        host_id: 'user-3',
      });

      await expect(
        service.markConversationAsRead('user-intruder', 'conv-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should mark unread messages as read', async () => {
      mockRepository.findConversationById.mockResolvedValue({
        id: 'conv-1',
        guest_id: 'user-1',
        host_id: 'user-2',
      });
      mockRepository.markMessagesAsRead.mockResolvedValue(undefined);

      const result = await service.markConversationAsRead('user-1', 'conv-1');

      expect(result).toEqual({ success: true, updated: true });
      expect(mockRepository.markMessagesAsRead).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
      );
    });
  });

  describe('reportChat', () => {
    it('should insert chat report into repository', async () => {
      const dto: ReportChatDto = {
        reportedId: 'user-2',
        conversationId: 'conv-1',
        reason: 'Spamming',
        description: 'Sent spam links',
      };
      const createdReport = {
        id: 'report-1',
        reporter_id: 'user-1',
        reported_id: 'user-2',
        conversation_id: 'conv-1',
        reason: 'Spamming',
        description: 'Sent spam links',
        status: 'pending',
        created_at: '2026-08-19T00:00:00Z',
      };

      mockRepository.insertChatReport.mockResolvedValue(createdReport);

      const result = await service.reportChat('user-1', dto);

      expect(result).toEqual(createdReport);
      expect(mockRepository.insertChatReport).toHaveBeenCalledWith({
        reporter_id: 'user-1',
        reported_id: 'user-2',
        conversation_id: 'conv-1',
        reason: 'Spamming',
        description: 'Sent spam links',
      });
    });
  });

  describe('sendContactMessage', () => {
    it('should sanitize input HTML tags, insert contact message, and enqueue email into the outbox', async () => {
      const outboxEnqueue = jest.fn().mockResolvedValue(undefined);
      // Rebuild service with a spy-able outbox for this test.
      const { EmailOutboxRepository: OutboxRepo } =
        await import('../bookings/email-outbox.repository');
      const module2: TestingModule = await Test.createTestingModule({
        providers: [
          MessagesService,
          { provide: MessagesRepository, useValue: mockRepository },
          {
            provide: OutboxRepo,
            useValue: { enqueue: outboxEnqueue },
          },
        ],
      }).compile();
      const svc = module2.get<MessagesService>(MessagesService);

      const dto: CreateContactMessageDto = {
        name: '<b>John Doe</b>',
        email: 'john@example.com',
        subject: '<script>alert(1)</script>Inquiry',
        message: '<p>Hello Alanya!</p>',
      };

      const result = await svc.sendContactMessage(dto);

      expect(result).toEqual({ success: true });
      expect(mockRepository.insertContactMessage).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'alert(1)Inquiry',
        message: 'Hello Alanya!',
        visa_type: null,
        phone: null,
      });
      expect(outboxEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'admin_contact_message',
          to: 'contact@alanyaholidays.com',
        }),
      );
    });
  });
});
