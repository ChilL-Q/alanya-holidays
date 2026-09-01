import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateBlogSubmissionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @IsOptional()
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(100000)
  @IsOptional()
  content?: string;

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
}
