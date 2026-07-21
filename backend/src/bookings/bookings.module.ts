import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';

@Module({
  providers: [BookingsService, BookingsRepository],
  controllers: [BookingsController],
})
export class BookingsModule {}
