import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MediaProcessingService,
  ProcessedMediaResult,
} from './media-processing.service';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadMediaDto {
  @IsString({ message: 'Bucket name is required' })
  @IsNotEmpty({ message: 'Bucket name is required' })
  bucket!: string;

  @IsOptional()
  @IsString()
  folder?: string;
}

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ): Promise<ProcessedMediaResult> {
    if (!file) {
      throw new BadRequestException('File is required for media upload');
    }

    if (!dto || !dto.bucket) {
      throw new BadRequestException('Bucket name is required in request body');
    }

    return this.mediaProcessingService.processAndUploadImage(
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      {
        bucket: dto.bucket,
        folder: dto.folder,
      },
    );
  }
}
