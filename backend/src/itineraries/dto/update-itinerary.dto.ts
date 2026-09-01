import {
  IsString,
  IsOptional,
  MaxLength,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateItineraryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  itinerary?: unknown[];
}
