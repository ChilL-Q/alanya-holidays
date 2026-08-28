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

  it('should setJson and getJson properly', async () => {
    const testData = { id: '123', name: 'Alanya Apartment', price: 100 };
    await service.setJson('properties:item:123', testData, 60);

    const cached = await service.getJson<typeof testData>(
      'properties:item:123',
    );
    expect(cached).toEqual(testData);
  });

  it('should delete keys by pattern', async () => {
    await service.setJson('properties:list:page1', { data: [1, 2] });
    await service.setJson('properties:list:page2', { data: [3, 4] });
    await service.setJson('directory:cat:food', { data: ['rest1'] });

    await service.delByPattern('properties:*');

    expect(await service.getJson('properties:list:page1')).toBeNull();
    expect(await service.getJson('properties:list:page2')).toBeNull();
    expect(await service.getJson('directory:cat:food')).not.toBeNull();
  });

  it('should propagate command failures when Redis is configured', async () => {
    const failingClient = {
      status: 'ready',
      eval: jest.fn().mockRejectedValue(new Error('command failed')),
      disconnect: jest.fn(),
    };
    Object.assign(service, {
      redisConfigured: true,
      client: failingClient,
    });

    await expect(
      service.incrementWithExpiry('rate:configured', 60),
    ).rejects.toThrow('command failed');
  });

  it('should atomically increment fallback counters without lost updates', async () => {
    const counts = await Promise.all(
      Array.from({ length: 25 }, () =>
        service.incrementWithExpiry('rate:concurrent', 60),
      ),
    );

    expect([...counts].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );
  });

  it('should set fallback counter expiry only on the first increment', async () => {
    jest.useFakeTimers();
    try {
      await expect(service.incrementWithExpiry('rate:ttl', 1)).resolves.toBe(1);
      jest.advanceTimersByTime(800);
      await expect(service.incrementWithExpiry('rate:ttl', 1)).resolves.toBe(2);
      jest.advanceTimersByTime(300);
      await expect(service.incrementWithExpiry('rate:ttl', 1)).resolves.toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should handle SWR caching correctly', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return Promise.resolve({ count: callCount, title: 'Alanya Tour' });
    };

    // First call (MISS): fetches data synchronously
    const firstCall = await service.getOrFetchSWR('swr:test:1', fetcher, {
      ttlFreshSeconds: 1,
      ttlStaleSeconds: 60,
    });
    expect(firstCall.count).toBe(1);
    expect(callCount).toBe(1);

    // Immediate second call (FRESH HIT): returns cached data without calling fetcher
    const secondCall = await service.getOrFetchSWR('swr:test:1', fetcher, {
      ttlFreshSeconds: 1,
      ttlStaleSeconds: 60,
    });
    expect(secondCall.count).toBe(1);
    expect(callCount).toBe(1);
  });
});
