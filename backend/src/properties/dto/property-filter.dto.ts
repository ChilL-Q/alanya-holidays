import {
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  IsString,
} from 'class-validator';

export class PropertyFilterDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  priceRange?: [number, number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minGuests?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBeds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  @IsOptional()
  @IsBoolean()
  hasPhotos?: boolean;
}
