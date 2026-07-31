import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { RedisService } from '../redis/redis.service';

describe('QueueService', () => {
  let service: QueueService;
  let redisServiceMock: {
    setJson: jest.Mock;
    getJson: jest.Mock;
  };

  beforeEach(async () => {
    redisServiceMock = {
      setJson: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should format queue job correctly', async () => {
    expect(service).toBeDefined();
    const result = await service.enqueueTask('media', 'process-photo', { id: '123' });
    expect(result).toBe(true);
    expect(redisServiceMock.setJson).toHaveBeenCalledWith(
      expect.stringMatching(/^queue:media:process-photo:\d+$/),
      { id: '123' },
      3600,
    );
  });
});
