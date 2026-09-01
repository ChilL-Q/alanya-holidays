import {
  IsNumber,
  Min,
  Max,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreatePropertyReviewDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  comment!: string;

  [key: string]: unknown;
}

export class BulkDeleteReviewsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  reviewIds!: string[];
}
