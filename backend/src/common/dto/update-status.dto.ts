import { IsString, IsOptional } from 'class-validator';

/**
 * Shared body DTO for the admin `PATCH :id/status` endpoints on bookings,
 * properties, and services. The concrete allowed status values differ per
 * entity and are enforced downstream (service/DB), so here we only guarantee
 * `status` is a string (blocks object/array injection) and `reason` is an
 * optional string.
 */
export class UpdateStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
