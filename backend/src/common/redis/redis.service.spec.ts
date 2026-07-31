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
});
