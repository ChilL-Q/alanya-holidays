import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';

@Module({
  providers: [MessagesService, MessagesRepository],
  controllers: [MessagesController],
})
export class MessagesModule {}
