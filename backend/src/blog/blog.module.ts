import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';

@Module({
  imports: [AuthModule, AdminModule, NotificationsModule],
  providers: [BlogService, BlogRepository, EmailOutboxRepository],
  controllers: [BlogController],
})
export class BlogModule {}
