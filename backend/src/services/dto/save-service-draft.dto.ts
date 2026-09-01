import { IsOptional, IsString, IsNumber, IsArray, Min } from 'class-validator';

/**
 * Lenient DTO for saving service drafts: every field is optional so partial
 * saves always succeed. Strict validation happens at publish time.
 */
export class SaveServiceDraftDto {
  @IsOptional() @IsString() draftId?: string;

  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() price_unit?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];

  [key: string]: unknown;
}
