import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class GetPropertiesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  allowedIds?: string;

  @IsOptional()
  @IsString()
  filters?: string; // Will be a JSON string that needs parsing
}
