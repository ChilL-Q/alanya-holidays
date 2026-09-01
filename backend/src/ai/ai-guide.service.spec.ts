import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AiGuideService,
  ALANYA_GUIDE_SYSTEM_INSTRUCTION,
} from './ai-guide.service';
import { AiGuideDto, ChatMessageDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { RedisService } from '../common/redis/redis.service';
import {
  AI_GUIDE_DRIVER,
  AiGuideDriver,
} from './drivers/ai-guide-driver.interface';
import { CuratedTemplateAdapter } from './drivers/curated-template.adapter';

describe('AiGuideService', () => {
  let service: AiGuideService;
  let redisService: RedisService;
  let driver: AiGuideDriver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGuideService,
        RedisService,
        CuratedTemplateAdapter,
        {
          provide: AI_GUIDE_DRIVER,
          useClass: CuratedTemplateAdapter,
        },
      ],
    }).compile();

    service = module.get<AiGuideService>(AiGuideService);
    redisService = module.get<RedisService>(RedisService);
    driver = module.get<AiGuideDriver>(AI_GUIDE_DRIVER);
    redisService.onModuleInit();
  });

  afterEach(() => {
    redisService.onModuleDestroy();
    jest.restoreAllMocks();
  });

  describe('Caching & Hash Computation', () => {
    it('should return cached answer on subsequent identical calls', async () => {
      const dto: AiGuideDto = {
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

    it('should produce different cache keys for different questions', async () => {
      const dto1: AiGuideDto = {
        userQuestion: 'What are the best restaurants in Alanya?',
      };
      const dto2: AiGuideDto = {
        userQuestion: 'How to get to Dim Cayi?',
      };

      const res1 = await service.askGuide(dto1);
      const res2 = await service.askGuide(dto2);

      expect(res1.cached).toBe(false);
      expect(res2.cached).toBe(false);
    });

    it('should prevent cache collisions across different dialog histories', async () => {
      const question = 'Where can I find ATMs?';
      const dtoWithoutHistory: AiGuideDto = {
        userQuestion: question,
      };
      const dtoWithHistoryA: AiGuideDto = {
        userQuestion: question,
        history: [
          { role: 'user', content: 'I am staying in Mahmutlar.' },
          { role: 'model', content: 'Mahmutlar has great amenities.' },
        ],
      };
      const dtoWithHistoryB: AiGuideDto = {
        userQuestion: question,
        history: [
          { role: 'user', content: 'I am staying near Damlatas cave.' },
          { role: 'model', content: 'Damlatas is centrally located.' },
        ],
      };

      const res1 = await service.askGuide(dtoWithoutHistory);
      const res2 = await service.askGuide(dtoWithHistoryA);
      const res3 = await service.askGuide(dtoWithHistoryB);

      expect(res1.cached).toBe(false);
      expect(res2.cached).toBe(false);
      expect(res3.cached).toBe(false);

      // Subsequent call with exact same history should hit cache
      const resWithHistoryAAgain = await service.askGuide(dtoWithHistoryA);
      expect(resWithHistoryAAgain.cached).toBe(true);
    });

    it('should treat undefined history and empty array history equivalently', async () => {
      const dto1: AiGuideDto = {
        userQuestion: 'Best sunset spot?',
        history: undefined,
      };
      const dto2: AiGuideDto = {
        userQuestion: 'Best sunset spot?',
        history: [],
      };

      const res1 = await service.askGuide(dto1);
      expect(res1.cached).toBe(false);

      const res2 = await service.askGuide(dto2);
      expect(res2.cached).toBe(true);
      expect(res2.answer).toEqual(res1.answer);
    });
  });

  describe('Driver Delegation', () => {
    it('should delegate askGuide to injected AiGuideDriver', async () => {
      const driverSpy = jest.spyOn(driver, 'generateGuideAnswer');
      const dto: AiGuideDto = {
        userQuestion: 'Top spots for lunch?',
      };

      const res = await service.askGuide(dto);
      expect(res.cached).toBe(false);
      expect(driverSpy).toHaveBeenCalledWith(dto);
    });

    it('should delegate generateItinerary to injected AiGuideDriver', async () => {
      const driverSpy = jest.spyOn(driver, 'generateItineraryPlan');
      const dto: GenerateItineraryDto = {
        days: 3,
        district: 'Alanya',
      };

      const res = await service.generateItinerary(dto);
      expect(res.cached).toBe(false);
      expect(driverSpy).toHaveBeenCalledWith(dto);
      expect(res.title).toBe('3-Day Curated Alanya Itinerary');
      expect(res.days).toHaveLength(3);
    });
  });

  describe('System Instructions & Persona Definition', () => {
    it('should define comprehensive persona with multilingual support', () => {
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Alanya Holidays');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Russian (RU)');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('English (EN)');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Turkish (TR)');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Kleopatra');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Damlatas');
      expect(ALANYA_GUIDE_SYSTEM_INSTRUCTION).toContain('Alanya Castle');
    });
  });

  describe('DTO Validation', () => {
    it('should validate valid AiGuideDto successfully', async () => {
      const plain = {
        propertyName: 'Villa Sunset',
        location: 'Konakli',
        userQuestion: 'Where is the closest beach?',
        mode: 'chat',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'model', content: 'Hello! How can I help?' },
        ],
      };

      const dto = plainToInstance(AiGuideDto, plain);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid role in history', async () => {
      const plain = {
        userQuestion: 'What is the weather?',
        history: [{ role: 'system', content: 'Invalid role message' }],
      };

      const dto = plainToInstance(AiGuideDto, plain);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(errors)).toContain('isIn');
    });

    it('should validate ChatMessageDto individually', async () => {
      const validMsg = plainToInstance(ChatMessageDto, {
        role: 'user',
        content: 'Valid message',
      });
      const validErrors = await validate(validMsg);
      expect(validErrors).toHaveLength(0);

      const invalidMsg = plainToInstance(ChatMessageDto, {
        role: 'admin',
        content: '',
      });
      const invalidErrors = await validate(invalidMsg);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('should reject missing userQuestion', async () => {
      const plain = {
        propertyName: 'Hotel',
      };

      const dto = plainToInstance(AiGuideDto, plain);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(errors)).toContain('isNotEmpty');
    });

    it('should validate valid GenerateItineraryDto', async () => {
      const plain = {
        days: 5,
        district: 'Kleopatra',
        interests: ['history', 'beaches'],
        pace: 'moderate',
        budget: 'standard',
        companion: 'family',
        language: 'en',
      };

      const dto = plainToInstance(GenerateItineraryDto, plain);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject out-of-bounds days in GenerateItineraryDto', async () => {
      const plain = {
        days: 20, // max is 14
      };

      const dto = plainToInstance(GenerateItineraryDto, plain);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('atomic rate limiting', () => {
    it('allows the first ten guide requests and rejects request eleven with 429', async () => {
      const dto: AiGuideDto = { userQuestion: 'Where should I go today?' };

      for (let request = 1; request <= 10; request++) {
        await expect(service.askGuide(dto, 'rate-test-user')).resolves.toEqual(
          expect.objectContaining({ answer: expect.any(String) }),
        );
      }

      await expect(
        service.askGuide(dto, 'rate-test-user'),
      ).rejects.toMatchObject({ status: 429 });
    });

    it('returns 429 when the itinerary limit is exceeded', async () => {
      jest.spyOn(redisService, 'incrementWithExpiry').mockResolvedValueOnce(11);

      await expect(
        service.generateItinerary({ days: 2 }, 'limited-user'),
      ).rejects.toMatchObject({ status: 429 });
    });

    it('fails closed on a configured Redis command outage without invoking the AI driver', async () => {
      const failingClient = {
        status: 'ready',
        eval: jest.fn().mockRejectedValue(new Error('Redis command outage')),
        disconnect: jest.fn(),
      };
      Object.assign(redisService, {
        redisConfigured: true,
        client: failingClient,
      });
      const driverSpy = jest.spyOn(driver, 'generateGuideAnswer');

      await expect(
        service.askGuide({ userQuestion: 'Expensive request' }, 'outage-user'),
      ).rejects.toEqual(
        new ServiceUnavailableException(
          'AI service is temporarily unavailable. Please try again later.',
        ),
      );
      expect(failingClient.eval).toHaveBeenCalledWith(
        expect.stringContaining("redis.call('INCR', KEYS[1])"),
        1,
        expect.stringMatching(/^ai_rate:guide:outage-user:\d+$/),
        60,
      );
      expect(driverSpy).not.toHaveBeenCalled();
    });
  });

  describe('generateItinerary caching', () => {
    it('should cache generated itinerary on repeated requests', async () => {
      const dto: GenerateItineraryDto = {
        days: 2,
        district: 'Kleopatra',
        pace: 'relaxed',
      };

      const res1 = await service.generateItinerary(dto);
      expect(res1.cached).toBe(false);

      const res2 = await service.generateItinerary(dto);
      expect(res2.cached).toBe(true);
      expect(res2.title).toEqual(res1.title);
      expect(res2.days).toEqual(res1.days);
    });
  });
});
