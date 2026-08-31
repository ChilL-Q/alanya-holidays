import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SellerProductMediaDto } from './seller-product.dto';

const CATALOG_ITEM_STATUSES = ['active', 'inactive', 'draft'] as const;

export class CreateAdminProductDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SellerProductMediaDto)
  media?: SellerProductMediaDto[] | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number | null;

  @IsOptional()
  @IsIn(CATALOG_ITEM_STATUSES)
  status?: (typeof CATALOG_ITEM_STATUSES)[number];
}

export class UpdateAdminProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SellerProductMediaDto)
  media?: SellerProductMediaDto[] | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  category_id?: number | null;

  @IsOptional()
  @IsIn(CATALOG_ITEM_STATUSES)
  status?: (typeof CATALOG_ITEM_STATUSES)[number];
}
