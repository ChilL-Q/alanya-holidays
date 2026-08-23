import { IsOptional, IsString, IsNumber, IsArray, Min } from 'class-validator';

/**
 * Lenient DTO for saving property drafts: every field is optional so partial
 * saves always succeed. Strict validation happens at publish time.
 */
export class SavePropertyDraftDto {
  @IsOptional() @IsString() draftId?: string;

  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumber() @Min(0) price_per_night?: number;
  @IsOptional() @IsNumber() @Min(0) cleaning_fee?: number;
  @IsOptional() @IsNumber() @Min(1) min_stay_nights?: number;
  @IsOptional() @IsNumber() @Min(1) max_guests?: number;
  @IsOptional() @IsNumber() @Min(0) bedrooms?: number;
  @IsOptional() @IsNumber() @Min(0) bathrooms?: number;
  @IsOptional() @IsNumber() @Min(0) beds?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() currency?: string;

  [key: string]: unknown;
}
