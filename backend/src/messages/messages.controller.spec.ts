import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ReportChatDto } from './dto/report-chat.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import {
  ConversationMessagesQueryDto,
  ConversationsQueryDto,
} from './dto/messages-pagination-query.dto';

describe('MessagesController', () => {
  let controller: MessagesController;

  const mockService = {
    getConversations: jest.fn(),
    createOrGetConversation: jest.fn(),
    getConversationMessages: jest.fn(),
    sendChatMessage: jest.fn(),
    markConversationAsRead: jest.fn(),
    reportChat: jest.fn(),
    sendContactMessage: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  describe('getConversations', () => {
    it('should delegate getConversations call to MessagesService with user id', async () => {
      mockService.getConversations.mockResolvedValue([]);

      const query = Object.assign(new ConversationsQueryDto(), {
        limit: 10,
        offset: 20,
      });
      const res = await controller.getConversations(mockUser, query);

      expect(res).toEqual([]);
      expect(mockService.getConversations).toHaveBeenCalledWith(
        'user-123',
        10,
        20,
      );
    });
  });

  describe('createConversation', () => {
    it('should delegate createOrGetConversation call to MessagesService', async () => {
      const dto: CreateConversationDto = {
        recipientId: 'user-456',
        propertyId: 'prop-1',
        initialMessage: 'Hello host',
      };
      mockService.createOrGetConversation.mockResolvedValue({ id: 'conv-1' });

      const res = await controller.createConversation(dto, mockUser);

      expect(res).toEqual({ id: 'conv-1' });
      expect(mockService.createOrGetConversation).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
    });
  });

  describe('getConversationMessages', () => {
    it('should delegate getConversationMessages call to MessagesService with pagination', async () => {
      mockService.getConversationMessages.mockResolvedValue([]);

      const query = Object.assign(new ConversationMessagesQueryDto(), {
        limit: 20,
        offset: 5,
      });
      const res = await controller.getConversationMessages(
        'conv-1',
        mockUser,
        query,
      );

      expect(res).toEqual([]);
      expect(mockService.getConversationMessages).toHaveBeenCalledWith(
        'user-123',
        'conv-1',
        20,
        5,
      );
    });
  });

  describe('sendChatMessage', () => {
    it('should delegate sendChatMessage call to MessagesService', async () => {
      const dto: SendChatMessageDto = { content: 'Hello!' };
      mockService.sendChatMessage.mockResolvedValue({
        id: 'msg-1',
        content: 'Hello!',
      });

      const res = await controller.sendChatMessage('conv-1', dto, mockUser);

      expect(res).toEqual({ id: 'msg-1', content: 'Hello!' });
      expect(mockService.sendChatMessage).toHaveBeenCalledWith(
        'user-123',
        'conv-1',
        dto,
      );
    });
  });

  describe('markConversationAsRead', () => {
    it('should delegate markConversationAsRead call to MessagesService', async () => {
      mockService.markConversationAsRead.mockResolvedValue({
        success: true,
        updated: true,
      });

      const res = await controller.markConversationAsRead('conv-1', mockUser);

      expect(res).toEqual({ success: true, updated: true });
      expect(mockService.markConversationAsRead).toHaveBeenCalledWith(
        'user-123',
        'conv-1',
      );
    });
  });

  describe('reportChat', () => {
    it('should delegate reportChat call to MessagesService', async () => {
      const dto: ReportChatDto = {
        reportedId: 'user-456',
        reason: 'Harassment',
      };
      mockService.reportChat.mockResolvedValue({ id: 'rep-1' });

      const res = await controller.reportChat(dto, mockUser);

      expect(res).toEqual({ id: 'rep-1' });
      expect(mockService.reportChat).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('sendContactMessage', () => {
    it('should delegate sendContactMessage call to MessagesService for /messages/contact', async () => {
      const dto: CreateContactMessageDto = {
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
      };
      mockService.sendContactMessage.mockResolvedValue({ success: true });

      const res = await controller.sendContactMessage(dto);

      expect(res).toEqual({ success: true });
      expect(mockService.sendContactMessage).toHaveBeenCalledWith(dto);
    });

    it('should delegate sendMessage call to MessagesService for legacy /messages', async () => {
      const dto: CreateContactMessageDto = {
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello',
      };
      mockService.sendContactMessage.mockResolvedValue({ success: true });

      const res = await controller.sendMessage(dto);

      expect(res).toEqual({ success: true });
      expect(mockService.sendContactMessage).toHaveBeenCalledWith(dto);
    });
  });
});
