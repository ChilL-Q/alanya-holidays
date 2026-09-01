import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const BLOG_SUBMISSION_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
] as const;

export type BlogSubmissionStatus = (typeof BLOG_SUBMISSION_STATUSES)[number];

export class GetBlogSubmissionsQueryDto {
  @IsOptional()
  @MaxLength(14)
  @IsIn(BLOG_SUBMISSION_STATUSES)
  status?: BlogSubmissionStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
