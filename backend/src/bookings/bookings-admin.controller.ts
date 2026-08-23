import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class BookingsAdminController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('list')
  async getAdminBookings(
    @Query('status') status: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.getAdminBookings(status, user.id);
  }

  @Patch(':id/status')
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

  @Patch(':id/payout-status')
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

  @Post(':id/refund')
  async refundBooking(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.cancelBooking(id, user.id);
  }
}
