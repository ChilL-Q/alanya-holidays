import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetForumPostsQueryDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRemoved?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removedOnly?: boolean;

  @IsOptional()
  @IsIn(['announcement', 'discussion', 'question'])
  postType?: 'announcement' | 'discussion' | 'question';

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateForumPostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category_id?: string | null;

  @IsOptional()
  @IsIn(['announcement', 'discussion', 'question'])
  post_type?: 'announcement' | 'discussion' | 'question';
}

export class UpdateForumPostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category_id?: string | null;
}

export class SetPinnedDto {
  @IsBoolean()
  pinned!: boolean;
}

export class SetRemovedDto {
  @IsBoolean()
  removed!: boolean;
}
