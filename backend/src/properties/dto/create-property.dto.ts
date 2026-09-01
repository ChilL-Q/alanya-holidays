import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  location!: string;

  @IsNumber()
  @Min(0)
  price_per_night!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cleaning_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  min_stay_nights?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_guests?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  beds?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  [key: string]: unknown;
}
