import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlogCommentDto {
  @IsString()
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;
}
