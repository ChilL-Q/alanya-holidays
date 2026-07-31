import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MediaProcessingService,
  ProcessedMediaResult,
} from './media-processing.service';

export class UploadMediaDto {
  bucket: string;
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
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp|avif)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 15 * 1024 * 1024, // 15MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
          fileIsRequired: true,
        }),
    )
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
