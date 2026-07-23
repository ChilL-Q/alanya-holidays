import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export interface ProcessedMediaResult {
  originalName: string;
  url: string;
  thumbnailUrl: string;
  format: 'webp';
  sizeBytes: number;
}

export interface ImageProcessingOptions {
  bucket: string;
  folder?: string;
  quality?: number;
  maxFullWidth?: number;
  maxThumbWidth?: number;
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class MediaProcessingService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async processAndUploadImage(
    file: UploadedFile,
    options: ImageProcessingOptions,
  ): Promise<ProcessedMediaResult> {
    const quality = options.quality ?? 80;
    const maxFullWidth = options.maxFullWidth ?? 1920;
    const maxThumbWidth = options.maxThumbWidth ?? 300;

    try {
      // 1. Convert & resize full image
      const fullBuffer = await sharp(file.buffer)
        .resize({ width: maxFullWidth, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      // 2. Convert & resize thumbnail
      const thumbBuffer = await sharp(file.buffer)
        .resize({ width: maxThumbWidth, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      // 3. Generate unique filenames
      const fileId = randomUUID();
      const folderPrefix = options.folder ? `${options.folder}/` : '';
      const fullPath = `${folderPrefix}${fileId}-full.webp`;
      const thumbPath = `${folderPrefix}${fileId}-thumb.webp`;

      // 4. Upload to Supabase Storage
      const storage = this.supabaseService.getClient().storage.from(options.bucket);

      const [fullUpload, thumbUpload] = await Promise.all([
        storage.upload(fullPath, fullBuffer, { contentType: 'image/webp', upsert: true }),
        storage.upload(thumbPath, thumbBuffer, { contentType: 'image/webp', upsert: true }),
      ]);

      if (fullUpload.error) {
        throw new Error(fullUpload.error.message || 'Failed to upload full image');
      }

      if (thumbUpload.error) {
        throw new Error(thumbUpload.error.message || 'Failed to upload thumbnail');
      }

      // 5. Get Public URLs
      const fullPublicUrlData = storage.getPublicUrl(fullPath);
      const thumbPublicUrlData = storage.getPublicUrl(thumbPath);

      return {
        originalName: file.originalname,
        url: fullPublicUrlData.data.publicUrl,
        thumbnailUrl: thumbPublicUrlData.data.publicUrl,
        format: 'webp',
        sizeBytes: fullBuffer.length,
      };
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Storage bucket')) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Image processing or storage upload failed',
      );
    }
  }
}
