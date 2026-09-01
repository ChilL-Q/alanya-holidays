import { IsIn, IsOptional, IsString } from 'class-validator';

export const LISTING_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export class UpdateListingStatusDto {
  @IsIn(LISTING_STATUSES, {
    message: `status must be one of: ${LISTING_STATUSES.join(', ')}`,
  })
  status!: ListingStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
