import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
export class UpdateForumCommentDto {
  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateForumCommentDto {
  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  parent_id?: string | null;
}

export class GetForumCommentsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeRemoved?: boolean;
}

export class GetRemovedCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
