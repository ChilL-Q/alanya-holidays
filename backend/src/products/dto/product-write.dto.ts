import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PRODUCT_TITLE_MAX_LENGTH = 120;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 2000;
const PRODUCT_CATEGORY_MAX_LENGTH = 60;
const PRODUCT_IMAGES_MAX_SIZE = 10;

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(PRODUCT_TITLE_MAX_LENGTH)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsString()
  @MaxLength(PRODUCT_CATEGORY_MAX_LENGTH)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  category!: string;

  @IsArray()
  @ArrayMaxSize(PRODUCT_IMAGES_MAX_SIZE)
  @IsUrl({}, { each: true })
  images!: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_TITLE_MAX_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_CATEGORY_MAX_LENGTH)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  category?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PRODUCT_IMAGES_MAX_SIZE)
  @IsUrl({}, { each: true })
  images?: string[];
}

export class SaveProductDraftDto extends UpdateProductDto {
  @IsOptional()
  @IsUUID()
  draftId?: string;
}

export class PublishProductDraftDto extends CreateProductDto {}

export class CreateProductVariantDto {
  @IsString()
  @MaxLength(60)
  size_label!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string | null;
}

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  size_label?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string | null;
}
