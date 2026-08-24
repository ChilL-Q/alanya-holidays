import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateForumReportDto {
  @IsIn(['post', 'comment'])
  target_type!: 'post' | 'comment';

  @IsString()
  @IsNotEmpty()
  target_id!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class GetForumReportsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeResolved?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(['post', 'comment'])
  target_type?: 'post' | 'comment';
}
