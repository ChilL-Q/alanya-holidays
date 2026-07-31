import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_per_night?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_guests?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsString()
  house_rules?: string;
}
