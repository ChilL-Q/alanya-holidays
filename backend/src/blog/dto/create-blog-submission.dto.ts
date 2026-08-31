import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  ArrayMaxSize,
  IsUrl,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';

export class CreateBlogSubmissionDto {
  @IsIn(['blog', 'guide'])
  @IsOptional()
  content_type?: 'blog' | 'guide';

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(100000)
  content!: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  author_name?: string;

  @IsEmail()
  @IsOptional()
  author_email?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  category?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  @IsOptional()
  tags?: string[];

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  @IsOptional()
  video_url?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true },
  )
  @IsOptional()
  media_urls?: string[];

  @IsOptional()
  payment_details?: Record<string, unknown>;
}
