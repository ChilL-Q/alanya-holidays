import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class SaveListingDraftDto {
  @IsOptional()
  @IsString()
  draftId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  short_description?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsArray()
  gallery?: string[];

  @IsOptional()
  @IsEnum(['explorer', 'voyager', 'signature', 'partner'])
  tier?: 'explorer' | 'voyager' | 'signature' | 'partner';

  @IsOptional()
  price_level?: number | string;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  booking_url?: string;

  @IsOptional()
  @IsArray()
  locationIds?: string[];

  [key: string]: unknown;
}
