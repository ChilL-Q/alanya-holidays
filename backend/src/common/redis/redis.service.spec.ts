import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should set and get values in fallback mode', async () => {
    await service.set('test_key', 'test_value', 10);
    const val = await service.get('test_key');
    expect(val).toBe('test_value');
  });

  it('should delete values', async () => {
    await service.set('test_key_del', 'val');
    await service.del('test_key_del');
    const val = await service.get('test_key_del');
    expect(val).toBeNull();
  });
});
