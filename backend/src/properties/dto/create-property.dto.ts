import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  type!: string;

  @IsString()
  location!: string;

  @IsNumber()
  @Min(0)
  price_per_night!: number;

  @IsNumber()
  @Min(0)
  max_guests!: number;

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
