import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

const CATALOG_ITEM_STATUSES = ['active', 'inactive', 'draft'] as const;

export class CreateSellerProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  media?: Array<{ url: string; type: string }> | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  category_id?: number | null;
}

export class UpdateSellerProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  media?: Array<{ url: string; type: string }> | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  category_id?: number | null;

  @IsOptional()
  @IsIn(CATALOG_ITEM_STATUSES)
  status?: (typeof CATALOG_ITEM_STATUSES)[number];
}
