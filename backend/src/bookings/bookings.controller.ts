import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService, CreateBookingDto } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';

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
    return this.bookingsService.checkConflict(
      itemId,
      itemType,
      checkIn,
      checkOut,
    );
  }

  @Post()
  async createBooking(@Body() createBookingDto: any) {
    return this.bookingsService.createBooking(createBookingDto);
  }

  // ============================================
  // Migrated from Queries
  // ============================================

  @Get('my-bookings')
  @UseGuards(AuthGuard)
  async getUserBookings(@Req() req: any) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminBookings(@Query('status') status: string, @Req() req: any) {
    return this.bookingsService.getAdminBookings(status, req.user.id);
  }

  @Get('host/:hostId')
  @UseGuards(AuthGuard)
  async getBookingsForHost(
    @Param('hostId') hostId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: any,
  ) {
    return this.bookingsService.getBookingsForHost(
      hostId,
      dateFrom,
      dateTo,
      req.user.id,
    );
  }

  // ============================================
  // Migrated from Mutations
  // ============================================

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Req() req: any,
  ) {
    return this.bookingsService.updateBookingStatus(
      id,
      body.status,
      body.reason,
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async cancelBooking(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }

  @Patch(':id/payout-status')
  @UseGuards(AuthGuard)
  async updatePayoutStatus(
    @Param('id') id: string,
    @Body('payoutStatus') payoutStatus: string,
    @Req() req: any,
  ) {
    return this.bookingsService.updatePayoutStatus(
      id,
      payoutStatus,
      req.user.id,
    );
  }
}
