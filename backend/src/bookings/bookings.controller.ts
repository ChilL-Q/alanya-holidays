import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../forum/types/forum.types';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';

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
  async createBooking(@Body() createBookingDto: CreateBookingDto) {
    const bookingId =
      await this.bookingsService.createBooking(createBookingDto);
    return { id: bookingId, data: bookingId };
  }

  // ============================================
  // Migrated from Queries
  // ============================================

  @Get('my-bookings')
  @UseGuards(AuthGuard)
  async getUserBookings(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  async getAdminBookings(
    @Query('status') status: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.getAdminBookings(status, req.user.id);
  }

  @Get('host/:hostId')
  @UseGuards(AuthGuard)
  async getBookingsForHost(
    @Param('hostId') hostId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Req() req: AuthenticatedRequest,
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
    @Body() body: UpdateStatusDto,
    @Req() req: AuthenticatedRequest,
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
  async cancelBooking(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }

  @Patch(':id/payout-status')
  @UseGuards(AuthGuard)
  async updatePayoutStatus(
    @Param('id') id: string,
    @Body('payoutStatus') payoutStatus: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.updatePayoutStatus(
      id,
      payoutStatus,
      req.user.id,
    );
  }
}
