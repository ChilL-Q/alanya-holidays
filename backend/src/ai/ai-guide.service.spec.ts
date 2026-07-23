import { Test, TestingModule } from '@nestjs/testing';
import { AiGuideService } from './ai-guide.service';
import { RedisService } from '../common/redis/redis.service';

describe('AiGuideService', () => {
  let service: AiGuideService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiGuideService, RedisService],
    }).compile();

    service = module.get<AiGuideService>(AiGuideService);
    redisService = module.get<RedisService>(RedisService);
    redisService.onModuleInit();
  });

  afterEach(() => {
    redisService.onModuleDestroy();
  });

  it('should return cached answer on subsequent identical calls', async () => {
    const dto = {
      propertyName: 'Kleopatra Suite',
      location: 'Alanya',
      userQuestion: 'What is near this property?',
    };

    const res1 = await service.askGuide(dto);
    expect(res1.cached).toBe(false);
    expect(res1.answer).toBeDefined();

    const res2 = await service.askGuide(dto);
    expect(res2.cached).toBe(true);
    expect(res2.answer).toEqual(res1.answer);
  });
});
