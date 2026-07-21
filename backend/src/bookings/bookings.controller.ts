import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BookingsService, CreateBookingDto } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('conflict')
  async checkConflict(
    @Query('itemId') itemId: string,
    @Query('itemType') itemType: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.bookingsService.checkConflict(itemId, itemType, checkIn, checkOut);
  }

  @Post()
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createBooking(createBookingDto);
  }
}
