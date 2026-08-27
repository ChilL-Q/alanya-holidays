import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

import { BookingsRepository } from './bookings.repository';
import { EmailOutboxRepository } from './email-outbox.repository';
import { BOOKINGS_REPOSITORY } from './domain';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  providers: [
    BookingsService,
    BookingsRepository,
    EmailOutboxRepository,
    {
      provide: BOOKINGS_REPOSITORY,
      useExisting: BookingsRepository,
    },
  ],
  controllers: [BookingsController],
  exports: [BookingsService, BookingsRepository, BOOKINGS_REPOSITORY],
})
export class BookingsModule {}
