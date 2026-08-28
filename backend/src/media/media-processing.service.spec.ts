import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaProcessingService } from './media-processing.service';
import { SupabaseService } from '../supabase/supabase.service';
import sharp from 'sharp';

describe('MediaProcessingService', () => {
  jest.setTimeout(30000);
  let service: MediaProcessingService;
  let supabaseServiceMock: {
    getClient: jest.Mock;
  };
  let uploadMock: jest.Mock;
  let getPublicUrlMock: jest.Mock;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    uploadMock = jest
      .fn()
      .mockResolvedValue({ data: { path: 'test.webp' }, error: null });
    getPublicUrlMock = jest.fn().mockReturnValue({
      data: {
        publicUrl:
          'https://example.supabase.co/storage/v1/object/public/properties/test.webp',
      },
    });

    supabaseServiceMock = {
      getClient: jest.fn().mockReturnValue({
        storage: {
          from: jest.fn().mockReturnValue({
            upload: uploadMock,
            getPublicUrl: getPublicUrlMock,
          }),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaProcessingService,
        {
          provide: SupabaseService,
          useValue: supabaseServiceMock,
        },
      ],
    }).compile();

    service = module.get<MediaProcessingService>(MediaProcessingService);
  });

  it('should process input image into main WebP and thumbnail WebP and upload both to Supabase Storage', async () => {
    // Generate a simple valid 100x100 PNG buffer using sharp
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await service.processAndUploadImage(
      {
        buffer: inputBuffer,
        originalname: 'test-photo.png',
        mimetype: 'image/png',
      },
      {
        bucket: 'properties',
        folder: 'apartment-123',
      },
    );

    // Verify upload was called twice (1 for main image, 1 for thumbnail)
    expect(uploadMock).toHaveBeenCalledTimes(2);

    // Check bucket upload call arguments
    const firstCallArgs = uploadMock.mock.calls[0] as [
      string,
      Buffer,
      { contentType: string; upsert: boolean },
    ];
    const secondCallArgs = uploadMock.mock.calls[1] as [
      string,
      Buffer,
      { contentType: string; upsert: boolean },
    ];

    expect(firstCallArgs[0]).toMatch(/^apartment-123\/[a-f0-9-]+-full\.webp$/);
    expect(firstCallArgs[2]).toEqual({
      contentType: 'image/webp',
      upsert: true,
    });

    expect(secondCallArgs[0]).toMatch(
      /^apartment-123\/[a-f0-9-]+-thumb\.webp$/,
    );
    expect(secondCallArgs[2]).toEqual({
      contentType: 'image/webp',
      upsert: true,
    });

    // Verify sharp metadata on uploaded buffers
    const uploadedMainBuffer = firstCallArgs[1];
    const mainMeta = await sharp(uploadedMainBuffer).metadata();
    expect(mainMeta.format).toBe('webp');

    const uploadedThumbBuffer = secondCallArgs[1];
    const thumbMeta = await sharp(uploadedThumbBuffer).metadata();
    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBeLessThanOrEqual(300);

    // Verify returned result object
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('thumbnailUrl');
    expect(result.format).toBe('webp');
  });

  it('returns a sanitized 500 and logs storage failures server-side', async () => {
    uploadMock.mockResolvedValueOnce({
      data: null,
      error: new Error('Storage bucket full'),
    });

    const inputBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const processing = service.processAndUploadImage(
      {
        buffer: inputBuffer,
        originalname: 'fail.png',
        mimetype: 'image/png',
      },
      { bucket: 'properties' },
    );

    await expect(processing).rejects.toEqual(
      new InternalServerErrorException('Unable to process image'),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Image processing failed',
      expect.objectContaining({
        operation: 'upload',
        originalName: 'fail.png',
        error: expect.stringContaining('Storage bucket full'),
      }),
    );
  });

  it('returns a stable sanitized 400 for invalid image content', async () => {
    const processing = service.processAndUploadImage(
      {
        buffer: Buffer.from('not an image'),
        originalname: 'invalid.png',
        mimetype: 'image/png',
      },
      { bucket: 'properties' },
    );

    await expect(processing).rejects.toEqual(
      new BadRequestException('Invalid image content'),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Invalid image content',
      expect.objectContaining({
        operation: 'validate',
        originalName: 'invalid.png',
        error: expect.any(String),
      }),
    );
  });

  it('returns a generic 500 for an operational failure in the initial Sharp pipeline', async () => {
    const inputBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const processing = service.processAndUploadImage(
      {
        buffer: inputBuffer,
        originalname: 'operational.png',
        mimetype: 'image/png',
      },
      { bucket: 'properties', maxFullWidth: 0 },
    );

    await expect(processing).rejects.toEqual(
      new InternalServerErrorException('Unable to process image'),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Image processing failed',
      expect.objectContaining({
        operation: 'validate',
        originalName: 'operational.png',
        error: expect.stringContaining('Expected positive integer'),
      }),
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('returns a stable generic 500 for unexpected failures', async () => {
    supabaseServiceMock.getClient.mockImplementation(() => {
      throw new Error('/var/run/secrets/storage-client.sock unavailable');
    });

    const inputBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const processing = service.processAndUploadImage(
      {
        buffer: inputBuffer,
        originalname: 'unexpected.png',
        mimetype: 'image/png',
      },
      { bucket: 'properties' },
    );

    await expect(processing).rejects.toEqual(
      new InternalServerErrorException('Unable to process image'),
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Image processing failed',
      expect.objectContaining({
        operation: 'upload',
        originalName: 'unexpected.png',
        error: expect.stringContaining('/var/run/secrets'),
      }),
    );
  });

  it('should convert raw image buffer into WebP format', async () => {
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const webpBuffer = await service.convertToWebp(samplePng, 80);
    expect(webpBuffer).toBeDefined();
    expect(Buffer.isBuffer(webpBuffer)).toBe(true);
  });
});
