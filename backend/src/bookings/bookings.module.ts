import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BOOKINGS_REPOSITORY } from './domain';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [
    BookingsService,
    BookingsRepository,
    {
      provide: BOOKINGS_REPOSITORY,
      useExisting: BookingsRepository,
    },
  ],
  controllers: [BookingsController],
  exports: [BookingsService, BookingsRepository, BOOKINGS_REPOSITORY],
})
export class BookingsModule {}
