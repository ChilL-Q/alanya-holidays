import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ReportChatDto } from './dto/report-chat.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { AuthenticatedRequest } from './types/messages.types';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @UseGuards(AuthGuard)
  async getConversations(@Req() req: AuthenticatedRequest) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Post('conversations')
  @UseGuards(AuthGuard)
  async createConversation(
    @Body() dto: CreateConversationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.createOrGetConversation(req.user.id, dto);
  }

  @Get('conversations/:id/messages')
  @UseGuards(AuthGuard)
  async getConversationMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return this.messagesService.getConversationMessages(
      req.user.id,
      conversationId,
      parsedLimit,
      parsedOffset,
    );
  }

  @Post('conversations/:id/messages')
  @UseGuards(AuthGuard)
  async sendChatMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendChatMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.sendChatMessage(
      req.user.id,
      conversationId,
      dto,
    );
  }

  @Patch('conversations/:id/read')
  @UseGuards(AuthGuard)
  async markConversationAsRead(
    @Param('id') conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.markConversationAsRead(
      req.user.id,
      conversationId,
    );
  }

  @Post('reports')
  @UseGuards(AuthGuard)
  async reportChat(
    @Body() dto: ReportChatDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.reportChat(req.user.id, dto);
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
