import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaProcessingService } from './media-processing.service';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '../auth/auth.guard';

describe('MediaController', () => {
  let controller: MediaController;
  let serviceMock: {
    processAndUploadImage: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      processAndUploadImage: jest.fn().mockResolvedValue({
        originalName: 'test.png',
        url: 'https://example.com/test-full.webp',
        thumbnailUrl: 'https://example.com/test-thumb.webp',
        format: 'webp',
        sizeBytes: 1234,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaProcessingService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should upload and process an image file successfully', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'house.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    const result = await controller.uploadMedia(
      mockFile,
      {
        bucket: 'blog-media',
        folder: 'house-12',
      },
      { id: 'user-1' },
    );

    expect(serviceMock.processAndUploadImage).toHaveBeenCalledWith(
      {
        buffer: mockFile.buffer,
        originalname: 'house.png',
        mimetype: 'image/png',
      },
      {
        bucket: 'blog-media',
        folder: 'user-1/house-12',
      },
    );

    expect(result).toEqual({
      originalName: 'test.png',
      url: 'https://example.com/test-full.webp',
      thumbnailUrl: 'https://example.com/test-thumb.webp',
      format: 'webp',
      sizeBytes: 1234,
    });
  });

  it('should throw BadRequestException if no file is provided', async () => {
    await expect(
      controller.uploadMedia(
        undefined as unknown as Express.Multer.File,
        { bucket: 'blog-media' },
        { id: 'user-1' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should require authentication for uploads', () => {
    const handler = Object.getOwnPropertyDescriptor(
      MediaController.prototype,
      'uploadMedia',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toContain(AuthGuard);
  });

  it('should reject unsupported image types before processing', async () => {
    const file = {
      buffer: Buffer.from('not-an-image'),
      originalname: 'payload.svg',
      mimetype: 'image/svg+xml',
      size: 128,
    } as Express.Multer.File;

    await expect(
      controller.uploadMedia(file, { bucket: 'blog-media' }, { id: 'user-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(serviceMock.processAndUploadImage).not.toHaveBeenCalled();
  });
});
