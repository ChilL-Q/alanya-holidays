import { Test, TestingModule } from '@nestjs/testing';
import { slugify, generateUniqueSlug } from '../utils/slugify';
import { AiGuideService } from './ai-guide.service';
import {
  AI_GUIDE_DRIVER,
  AiGuideDriver,
} from './drivers/ai-guide-driver.interface';
import { CuratedTemplateAdapter } from './drivers/curated-template.adapter';
import { RedisService } from '../common/redis/redis.service';
import { ItinerariesService } from '../itineraries/itineraries.service';
import { ItinerariesRepository } from '../itineraries/itineraries.repository';

describe('Adversarial Challenger: Candidate 4 & Candidate 5 Deepening', () => {
  describe('Candidate 5: Slug & Multilingual Text Utility Stress Tests', () => {
    it('should handle complex Turkish diacritics with mixed capitalization and punctuation', () => {
      const input =
        'İSTANBUL ÇEŞME NİĞDE ÖLÜDENİZ ŞİLE ÜRGÜP - (2026 Tatil Rehberi!)';
      expect(slugify(input)).toBe(
        'istanbul-cesme-nigde-oludeniz-sile-urgup-2026-tatil-rehberi',
      );
    });

    it('should normalize Turkish dotless ı and dotted i with uppercase variants', () => {
      expect(slugify('ılık ışık İpek İNCİ')).toBe('ilik-isik-ipek-inci');
    });

    it('should handle European diacritics: German sharp s, Nordic o/ae/a, Polish l, Slavic dj', () => {
      expect(
        slugify('Große Straße & København & Ålesund & Łódź & Đakovo'),
      ).toBe('grosse-strasse-kobenhavn-alesund-lodz-djakovo');
    });

    it('should handle non-Latin (Cyrillic) sentences correctly', () => {
      expect(slugify('Лучшие пляжи и рестораны Аланьи')).toBe(
        'luchshie-plyazhi-i-restorany-alani',
      );
    });

    it('should handle emoji-only and punctuation-only strings with safe fallback', () => {
      expect(slugify('🌴🌊☀️ ✈️ 🏨')).toBe('');
      expect(slugify('---___---...///:::;;;')).toBe('');
      expect(generateUniqueSlug('🌴🌊☀️', [])).toBe('item');
      expect(generateUniqueSlug('🌴🌊☀️', ['item', 'item-1'])).toBe('item-2');
    });

    it('should safely handle non-string runtime inputs without throwing', () => {
      expect(slugify(null as unknown as string)).toBe('');
      expect(slugify(undefined as unknown as string)).toBe('');
      expect(slugify(12345 as unknown as string)).toBe('');
      expect(slugify({} as unknown as string)).toBe('');
      expect(slugify([] as unknown as string)).toBe('');
    });

    it('should resolve massive sequential collisions deterministically', () => {
      const existing = Array.from({ length: 50 }, (_, i) =>
        i === 0 ? 'alanya-guide' : `alanya-guide-${i}`,
      );
      const unique = generateUniqueSlug('Alanya Guide', existing);
      expect(unique).toBe('alanya-guide-50');
    });

    it('should resolve async collisions under simulated concurrent checks', async () => {
      const taken = new Set([
        'villa-kestel',
        'villa-kestel-1',
        'villa-kestel-2',
        'villa-kestel-3',
      ]);
      const isTakenFn: (candidate: string) => Promise<boolean> = jest.fn(
        async (candidate: string) => {
          await new Promise((r) => setTimeout(r, 1));
          return taken.has(candidate);
        },
      );

      const unique = await generateUniqueSlug('Villa Kestel', isTakenFn);
      expect(unique).toBe('villa-kestel-4');
      expect(isTakenFn).toHaveBeenCalledTimes(5);
    });
  });

  describe('Candidate 4: AI Guide & Itinerary Assistant Module Stress Tests', () => {
    let service: AiGuideService;
    let redisService: RedisService;
    let curatedDriver: CuratedTemplateAdapter;

    beforeEach(async () => {
      curatedDriver = new CuratedTemplateAdapter();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiGuideService,
          RedisService,
          {
            provide: AI_GUIDE_DRIVER,
            useValue: curatedDriver,
          },
        ],
      }).compile();

      service = module.get<AiGuideService>(AiGuideService);
      redisService = module.get<RedisService>(RedisService);
      redisService.onModuleInit();
    });

    afterEach(() => {
      redisService.onModuleDestroy();
      jest.restoreAllMocks();
    });

    it('should clamp out-of-bounds days gracefully (negative or zero -> 1, >14 -> 14)', async () => {
      const lowResult = await service.generateItinerary({
        days: -5,
        district: 'Damlatas',
      });
      expect(lowResult.days).toHaveLength(1);
      expect(lowResult.title).toContain('1-Day Curated Damlatas Itinerary');

      const highResult = await service.generateItinerary({
        days: 99,
        district: 'Mahmutlar',
      });
      expect(highResult.days).toHaveLength(14);
      expect(highResult.title).toContain('14-Day Curated Mahmutlar Itinerary');
    });

    it('should cycle through curated templates when days > available template count', async () => {
      const result = await service.generateItinerary({
        days: 7,
        district: 'Alanya',
      });
      expect(result.days).toHaveLength(7);
      expect(result.days?.[0].day).toBe(1);
      expect(result.days?.[3].day).toBe(4);
      expect(result.days?.[6].day).toBe(7);
    });

    it('should allow runtime dynamic driver swapping via DI token', async () => {
      const generateGuideAnswer = jest
        .fn()
        .mockResolvedValue('Custom Driver Answer');
      const generateItineraryPlan = jest.fn().mockResolvedValue({
        title: 'Custom Injected Plan',
        description: 'Custom Driver Plan Description',
        days: [],
      });
      const customMockDriver: AiGuideDriver = {
        generateGuideAnswer,
        generateItineraryPlan,
      };

      const customModule = await Test.createTestingModule({
        providers: [
          AiGuideService,
          RedisService,
          {
            provide: AI_GUIDE_DRIVER,
            useValue: customMockDriver,
          },
        ],
      }).compile();

      const customService = customModule.get<AiGuideService>(AiGuideService);
      const customRedis = customModule.get<RedisService>(RedisService);
      customRedis.onModuleInit();

      const ans = await customService.askGuide({
        userQuestion: 'Testing custom mock driver',
      });
      expect(ans.answer).toBe('Custom Driver Answer');
      expect(generateGuideAnswer).toHaveBeenCalledTimes(1);

      const itin = await customService.generateItinerary({ days: 3 });
      expect(itin.title).toBe('Custom Injected Plan');
      expect(generateItineraryPlan).toHaveBeenCalledTimes(1);

      customRedis.onModuleDestroy();
    });

    it('should seamlessly coordinate ItinerariesService with AiGuideService', async () => {
      const createItinerary = jest.fn().mockImplementation(
        (
          userId: string,
          dto: {
            title: string;
            params?: Record<string, unknown>;
            itinerary?: unknown[];
          },
        ) =>
          Promise.resolve({
            id: 'itin-uuid-456',
            user_id: userId,
            title: dto.title,
            params: dto.params || {},
            itinerary: dto.itinerary || [],
            created_at: new Date().toISOString(),
          }),
      );
      const mockRepo = {
        createItinerary,
      } as unknown as ItinerariesRepository;

      const itinService = new ItinerariesService(mockRepo, service);

      const saved = await itinService.generateAndSaveItinerary('user-777', {
        days: 3,
        district: 'Cleopatra',
        interests: ['History', 'Beaches'],
      });

      expect(saved.id).toBe('itin-uuid-456');
      expect(saved.user_id).toBe('user-777');
      expect(saved.title).toContain('3-Day Curated Cleopatra Itinerary');
      expect(createItinerary).toHaveBeenCalledTimes(1);
    });
  });
});
