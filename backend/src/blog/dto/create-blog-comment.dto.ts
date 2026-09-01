import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBlogCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
}
