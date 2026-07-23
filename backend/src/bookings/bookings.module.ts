import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [BookingsService, BookingsRepository],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
