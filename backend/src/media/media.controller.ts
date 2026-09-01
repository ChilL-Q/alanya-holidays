import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MediaProcessingService,
  ProcessedMediaResult,
} from './media-processing.service';

import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UploadMediaDto {
  @IsString({ message: 'Bucket name is required' })
  @IsNotEmpty({ message: 'Bucket name is required' })
  @IsIn(['blog-media', 'category-images', 'forum-media'])
  bucket!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  folder?: string;
}

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    }),
  )
  async uploadMedia(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ProcessedMediaResult> {
    if (!file) {
      throw new BadRequestException('File is required for media upload');
    }

    if (!dto || !dto.bucket) {
      throw new BadRequestException('Bucket name is required in request body');
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Image must not exceed 5 MB');
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const folder = dto.folder
      ? `${user.id}/${dto.folder.replace(/[^a-zA-Z0-9_-]/g, '-')}`
      : user.id;

    return this.mediaProcessingService.processAndUploadImage(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      {
        bucket: dto.bucket,
        folder,
      },
    );
  }
}
