import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
} from 'class-validator';

export class GenerateItineraryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  days?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  duration?: number;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsIn(['relaxed', 'moderate', 'packed', 'balanced', 'intense'])
  pace?: string;

  @IsOptional()
  @IsIn(['economy', 'standard', 'luxury', 'budget', 'mid'])
  budget?: string;

  @IsOptional()
  @IsString()
  companion?: string;

  @IsOptional()
  @IsIn(['en', 'ru', 'tr', 'ar'])
  language?: string;
}
