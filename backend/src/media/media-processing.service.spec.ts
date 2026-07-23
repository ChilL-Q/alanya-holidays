import { Test, TestingModule } from '@nestjs/testing';
import { MediaProcessingService } from './media-processing.service';
import { SupabaseService } from '../supabase/supabase.service';
import sharp from 'sharp';

describe('MediaProcessingService', () => {
  let service: MediaProcessingService;
  let supabaseServiceMock: {
    getClient: jest.Mock;
  };
  let uploadMock: jest.Mock;
  let getPublicUrlMock: jest.Mock;

  beforeEach(async () => {
    uploadMock = jest.fn().mockResolvedValue({ data: { path: 'test.webp' }, error: null });
    getPublicUrlMock = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/properties/test.webp' },
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
    const firstCallArgs = uploadMock.mock.calls[0];
    const secondCallArgs = uploadMock.mock.calls[1];

    expect(firstCallArgs[0]).toMatch(/^apartment-123\/[a-f0-9-]+-full\.webp$/);
    expect(firstCallArgs[2]).toEqual({ contentType: 'image/webp', upsert: true });

    expect(secondCallArgs[0]).toMatch(/^apartment-123\/[a-f0-9-]+-thumb\.webp$/);
    expect(secondCallArgs[2]).toEqual({ contentType: 'image/webp', upsert: true });

    // Verify sharp metadata on uploaded buffers
    const uploadedMainBuffer = firstCallArgs[1] as Buffer;
    const mainMeta = await sharp(uploadedMainBuffer).metadata();
    expect(mainMeta.format).toBe('webp');

    const uploadedThumbBuffer = secondCallArgs[1] as Buffer;
    const thumbMeta = await sharp(uploadedThumbBuffer).metadata();
    expect(thumbMeta.format).toBe('webp');
    expect(thumbMeta.width).toBeLessThanOrEqual(300);

    // Verify returned result object
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('thumbnailUrl');
    expect(result.format).toBe('webp');
  });

  it('should throw an error if file upload to Supabase fails', async () => {
    uploadMock.mockResolvedValueOnce({ data: null, error: new Error('Storage bucket full') });

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

    await expect(
      service.processAndUploadImage(
        {
          buffer: inputBuffer,
          originalname: 'fail.png',
          mimetype: 'image/png',
        },
        { bucket: 'properties' },
      ),
    ).rejects.toThrow('Storage bucket full');
  });
});
