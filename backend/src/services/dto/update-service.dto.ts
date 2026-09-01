import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  price_unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  [key: string]: unknown;
}
