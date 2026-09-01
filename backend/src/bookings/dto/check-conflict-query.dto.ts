import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator';

/**
 * Allowed item types, aligned with the `create_booking` RPC
 * (supabase/migrations/20260411000000_fix_booking_race_condition_advisory_lock.sql):
 * 'property' maps to properties; 'service', 'product', 'tour', 'rental', 'car'
 * are stored under the 'service' booking branch.
 */
export const BOOKING_ITEM_TYPES = [
  'property',
  'service',
  'product',
  'tour',
  'rental',
  'car',
] as const;

export class CheckConflictQueryDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsIn(BOOKING_ITEM_TYPES)
  itemType!: (typeof BOOKING_ITEM_TYPES)[number];

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;
}
