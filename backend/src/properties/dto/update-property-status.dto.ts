import { IsIn, IsOptional, IsString } from 'class-validator';
import type { PropertyStatus } from '../domain/entities/property.entity';

export const PROPERTY_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'archived',
] as const;

export class UpdatePropertyStatusDto {
  @IsIn(PROPERTY_STATUSES, {
    message: `status must be one of: ${PROPERTY_STATUSES.join(', ')}`,
  })
  status!: PropertyStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
