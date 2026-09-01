import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';

@Module({
  providers: [MessagesService, MessagesRepository, EmailOutboxRepository],
  controllers: [MessagesController],
})
export class MessagesModule {}
