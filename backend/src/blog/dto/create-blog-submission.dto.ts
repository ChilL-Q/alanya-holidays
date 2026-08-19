import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
} from 'class-validator';

export class CreateBlogSubmissionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  author_name?: string;

  @IsEmail()
  @IsOptional()
  author_email?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  video_url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  media_urls?: string[];

  @IsOptional()
  payment_details?: Record<string, unknown>;
}
