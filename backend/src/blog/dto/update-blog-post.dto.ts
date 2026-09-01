import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000)
  @IsOptional()
  content?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  excerpt?: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  @IsOptional()
  cover_image?: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  @IsOptional()
  cover_image_url?: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  @IsOptional()
  video_url?: string;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  category?: string;

  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  @IsOptional()
  tag_ids?: string[];

  @IsIn(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsIn(['blog', 'guide'])
  @IsOptional()
  content_type?: 'blog' | 'guide';
}
