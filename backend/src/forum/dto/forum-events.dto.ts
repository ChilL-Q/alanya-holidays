import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetForumEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  upcomingOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeUnpublished?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateForumEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsString()
  @IsNotEmpty()
  event_date!: string;

  @IsOptional()
  @IsString()
  image_url?: string | null;

  @IsOptional()
  @IsString()
  host_id?: string | null;

  @IsOptional()
  @IsString()
  category_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class UpdateForumEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  event_date?: string;

  @IsOptional()
  @IsString()
  image_url?: string | null;

  @IsOptional()
  @IsString()
  host_id?: string | null;

  @IsOptional()
  @IsString()
  category_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class ToggleEventRsvpDto {
  @IsOptional()
  @IsString()
  contactPhone?: string | null;
}
