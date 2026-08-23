import { IsIn, IsOptional, IsString } from 'class-validator';
import type { BookingStatus } from '../domain/entities/booking.entity';

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancelled',
  'rejected',
  'completed',
] as const;

export class UpdateBookingStatusDto {
  @IsIn(BOOKING_STATUSES, {
    message: `status must be one of: ${BOOKING_STATUSES.join(', ')}`,
  })
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
