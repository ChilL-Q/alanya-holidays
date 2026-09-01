import { IsIn, IsOptional, IsString } from 'class-validator';
import type { ServiceOfferingStatus } from '../domain/entities/service-offering.entity';

export const SERVICE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'archived',
] as const;

export class UpdateServiceStatusDto {
  @IsIn(SERVICE_STATUSES, {
    message: `status must be one of: ${SERVICE_STATUSES.join(', ')}`,
  })
  status!: ServiceOfferingStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
