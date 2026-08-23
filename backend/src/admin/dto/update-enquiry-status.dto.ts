import { IsIn, IsOptional, IsString } from 'class-validator';

export const ENQUIRY_STATUSES = [
  'new',
  'in_progress',
  'responded',
  'closed',
  'cancelled',
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export class UpdateEnquiryStatusDto {
  @IsIn(ENQUIRY_STATUSES, {
    message: `status must be one of: ${ENQUIRY_STATUSES.join(', ')}`,
  })
  status!: EnquiryStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
