import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAuditLogDto {
  @IsNotEmpty()
  @IsString()
  entity_type!: string;

  @IsNotEmpty()
  @IsString()
  entity_id!: string;

  @IsNotEmpty()
  @IsString()
  action!: string;

  @IsNotEmpty()
  @IsString()
  admin_id!: string;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class GetAuditLogsQueryDto {
  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  admin_id?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export interface ModerationAuditLogAdmin {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface ModerationAuditLogRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  admin_id: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  admin?: ModerationAuditLogAdmin | null;
}

export interface PaginatedAuditLogsResult {
  data: ModerationAuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
