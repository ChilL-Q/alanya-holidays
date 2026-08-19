import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaProcessingService } from './media-processing.service';
import { BadRequestException } from '@nestjs/common';

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
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should upload and process an image file successfully', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-bytes'),
      originalname: 'house.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    const result = await controller.uploadMedia(mockFile, {
      bucket: 'properties',
      folder: 'house-12',
    });

    expect(serviceMock.processAndUploadImage).toHaveBeenCalledWith(
      {
        buffer: mockFile.buffer,
        originalname: 'house.png',
        mimetype: 'image/png',
      },
      {
        bucket: 'properties',
        folder: 'house-12',
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
      controller.uploadMedia(undefined as unknown as Express.Multer.File, {
        bucket: 'properties',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
