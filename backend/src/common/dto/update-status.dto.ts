import { IsString, IsOptional } from 'class-validator';

/**
 * @deprecated Use entity-specific status DTOs with strict `@IsIn(...)` whitelist validation:
 * - `UpdateBookingStatusDto` from `bookings/dto/update-booking-status.dto`
 * - `UpdatePropertyStatusDto` from `properties/dto/update-property-status.dto`
 * - `UpdateServiceStatusDto` from `services/dto/update-service-status.dto`
 * - `UpdateEnquiryStatusDto` from `admin/dto/update-enquiry-status.dto`
 * - `UpdateListingStatusDto` from `directory/dto/update-listing-status.dto`
 * - `UpdateClaimStatusDto` from `directory/dto/update-claim-status.dto`
 */
export class UpdateStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
