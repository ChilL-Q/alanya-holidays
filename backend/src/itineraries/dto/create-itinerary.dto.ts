import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateItineraryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;

  @IsArray()
  itinerary!: unknown[];
}
