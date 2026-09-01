import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ReportChatDto } from './dto/report-chat.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import {
  ConversationMessagesQueryDto,
  ConversationsQueryDto,
} from './dto/messages-pagination-query.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @UseGuards(AuthGuard)
  async getConversations(
    @CurrentUser() user: AuthUser,
    @Query() query: ConversationsQueryDto,
  ) {
    return this.messagesService.getConversations(
      user.id,
      query.limit,
      query.offset,
    );
  }

  @Post('conversations')
  @UseGuards(AuthGuard)
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.createOrGetConversation(user.id, dto);
  }

  @Get('conversations/:id/messages')
  @UseGuards(AuthGuard)
  async getConversationMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ConversationMessagesQueryDto,
  ) {
    return this.messagesService.getConversationMessages(
      user.id,
      conversationId,
      query.limit,
      query.offset,
    );
  }

  @Post('conversations/:id/messages')
  @UseGuards(AuthGuard)
  async sendChatMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendChatMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.sendChatMessage(user.id, conversationId, dto);
  }

  @Patch('conversations/:id/read')
  @UseGuards(AuthGuard)
  async markConversationAsRead(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.markConversationAsRead(user.id, conversationId);
  }

  @Post('reports')
  @UseGuards(AuthGuard)
  async reportChat(@Body() dto: ReportChatDto, @CurrentUser() user: AuthUser) {
    return this.messagesService.reportChat(user.id, dto);
  }

  @Post('contact')
  async sendContactMessage(@Body() dto: CreateContactMessageDto) {
    return this.messagesService.sendContactMessage(dto);
  }

  @Post()
  async sendMessage(@Body() dto: CreateContactMessageDto) {
    return this.messagesService.sendContactMessage(dto);
  }
}
