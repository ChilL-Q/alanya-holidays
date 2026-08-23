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
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckConflictQueryDto } from './dto/check-conflict-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('conflict')
  async checkConflict(@Query() query: CheckConflictQueryDto) {
    return this.bookingsService.checkConflict(
      query.itemId,
      query.itemType,
      query.checkIn,
      query.checkOut,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const bookingId = await this.bookingsService.createBooking(
      createBookingDto,
      user.id,
    );
    return { id: bookingId, data: bookingId };
  }

  // ============================================
  // Migrated from Queries
  // ============================================

  @Get('my-bookings')
  @UseGuards(AuthGuard)
  async getUserBookings(@CurrentUser() user: AuthUser) {
    return this.bookingsService.getUserBookings(user.id);
  }

  @Get('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getAdminBookings(
    @Query('status') status: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.getAdminBookings(status, user.id);
  }

  @Get('host/:hostId')
  @UseGuards(AuthGuard)
  async getBookingsForHost(
    @Param('hostId') hostId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.getBookingsForHost(
      hostId,
      dateFrom,
      dateTo,
      user.id,
    );
  }

  // ============================================
  // Migrated from Mutations
  // ============================================

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.updateBookingStatus(
      id,
      body.status,
      body.reason,
      user.id,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async cancelBooking(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.cancelBooking(id, user.id);
  }

  @Patch(':id/payout-status')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updatePayoutStatus(
    @Param('id') id: string,
    @Body() body: UpdatePayoutStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.updatePayoutStatus(
      id,
      body.payoutStatus,
      user.id,
    );
  }
}
