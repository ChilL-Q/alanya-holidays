import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsInt,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetBlogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsUUID('4')
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  is_featured?: string;
}

export { GetBlogQueryDto as GetBlogPostsQueryDto };
