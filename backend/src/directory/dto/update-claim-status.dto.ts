import { IsIn, IsOptional, IsString } from 'class-validator';

export const CLAIM_STATUSES = [
  'pending',
  'verified',
  'approved',
  'rejected',
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export class UpdateClaimStatusDto {
  @IsIn(CLAIM_STATUSES, {
    message: `status must be one of: ${CLAIM_STATUSES.join(', ')}`,
  })
  status!: ClaimStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
