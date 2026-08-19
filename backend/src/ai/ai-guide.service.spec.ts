import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AiGuideService,
  ALANYA_GUIDE_SYSTEM_INSTRUCTION,
} from './ai-guide.service';
import { AiGuideDto, ChatMessageDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { RedisService } from '../common/redis/redis.service';

interface RequestPayload {
  system_instruction?: {
    parts: Array<{ text: string }>;
  };
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
}

describe('AiGuideService', () => {
  let service: AiGuideService;
  let redisService: RedisService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiGuideService, RedisService],
    }).compile();

    service = module.get<AiGuideService>(AiGuideService);
    redisService = module.get<RedisService>(RedisService);
    redisService.onModuleInit();
  });

  afterEach(() => {
    redisService.onModuleDestroy();
    process.env = originalEnv;
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

  describe('Gemini API Integration & Request Formatting', () => {
    it('should format multi-turn history, system instructions, and custom model correctly', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GEMINI_MODEL = 'gemini-1.5-pro';

      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Dim River has refreshing floating restaurants and water parks.',
                },
              ],
            },
          },
        ],
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGeminiResponse),
      } as unknown as Response);

      const dto: AiGuideDto = {
        propertyName: 'Riverside Resort',
        location: 'Tosmur',
        userQuestion: 'How cold is the water in Dim Cayi?',
        history: [
          { role: 'user', content: 'Hi, I want to visit Dim Cayi.' },
          {
            role: 'model',
            content: 'Dim Cayi is an amazing valley in Alanya!',
          },
        ],
      };

      const result = await service.askGuide(dto);

      expect(result.cached).toBe(false);
      expect(result.answer).toBe(
        'Dim River has refreshing floating restaurants and water parks.',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];

      // Model check
      expect(calledUrl).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=test-gemini-key',
      );

      const parsedBody = JSON.parse(
        calledOptions?.body as string,
      ) as RequestPayload;

      // System instruction verification
      expect(parsedBody.system_instruction).toBeDefined();
      expect(parsedBody.system_instruction?.parts[0].text).toContain(
        'Alanya Holidays',
      );
      expect(parsedBody.system_instruction?.parts[0].text).toContain(
        'Russian (RU)',
      );
      expect(parsedBody.system_instruction?.parts[0].text).toContain(
        'English (EN)',
      );
      expect(parsedBody.system_instruction?.parts[0].text).toContain(
        'Turkish (TR)',
      );

      // Multi-turn contents verification
      expect(parsedBody.contents).toHaveLength(3);
      expect(parsedBody.contents[0]).toEqual({
        role: 'user',
        parts: [{ text: 'Hi, I want to visit Dim Cayi.' }],
      });
      expect(parsedBody.contents[1]).toEqual({
        role: 'model',
        parts: [{ text: 'Dim Cayi is an amazing valley in Alanya!' }],
      });
      expect(parsedBody.contents[2].role).toBe('user');
      expect(parsedBody.contents[2].parts[0].text).toContain(
        'Location: Tosmur. Property: Riverside Resort.',
      );
      expect(parsedBody.contents[2].parts[0].text).toContain(
        'Question: How cold is the water in Dim Cayi?',
      );
    });

    it('should default to gemini-1.5-flash if GEMINI_MODEL is not set', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      delete process.env.GEMINI_MODEL;

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Default model response' }],
                },
              },
            ],
          }),
      } as unknown as Response);

      const dto: AiGuideDto = {
        userQuestion: 'Where to watch sunset?',
      };

      const result = await service.askGuide(dto);

      expect(result.answer).toBe('Default model response');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=test-gemini-key',
        expect.any(Object),
      );
    });
  });

  describe('Fallback & Error Handling', () => {
    it('should return curated fallback if GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      const fetchSpy = jest.spyOn(global, 'fetch');

      const result = await service.askGuide({
        userQuestion: 'What are the best beaches?',
      });

      expect(result.cached).toBe(false);
      expect(result.answer).toContain('Alanya Castle');
      expect(result.answer).toContain('Kleopatra Beach');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return curated fallback if Gemini API returns non-200 HTTP status', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      const result = await service.askGuide({
        userQuestion: 'Where is the harbor?',
      });

      expect(result.cached).toBe(false);
      expect(result.answer).toContain('Alanya Castle');
    });

    it('should return curated fallback if fetch throws network error', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await service.askGuide({
        userQuestion: 'Can I rent a car?',
      });

      expect(result.cached).toBe(false);
      expect(result.answer).toContain('Alanya Castle');
    });

    it('should return curated fallback if API response lacks candidates or content', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ candidates: [] }),
      } as unknown as Response);

      const result = await service.askGuide({
        userQuestion: 'Tell me about caves.',
      });

      expect(result.cached).toBe(false);
      expect(result.answer).toContain('Damlatas Cave');
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

  describe('generateItinerary', () => {
    it('should return curated fallback itinerary when no API key is set', async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await service.generateItinerary({
        days: 3,
        district: 'Alanya',
      });

      expect(result.cached).toBe(false);
      expect(result.title).toContain('3-Day Curated Alanya Itinerary');
      expect(result.days).toHaveLength(3);
      expect(result.days?.[0].items.length).toBeGreaterThan(0);
    });

    it('should cache generated itinerary on repeated requests', async () => {
      delete process.env.GEMINI_API_KEY;

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

    it('should parse valid JSON response from Gemini API', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockAiOutput = JSON.stringify({
        title: 'Custom 2-Day Castle Experience',
        description: 'Exclusive tour of ancient ruins.',
        days: [
          {
            day: 1,
            dayLabel: 'Day 1',
            title: 'Castle Day',
            items: [
              {
                time: '10:00',
                name: 'Ehmedek Fortress',
                description: 'Explore the upper castle fortifications.',
                timeSlot: 'Morning (8AM - 12PM)',
              },
            ],
          },
        ],
      });

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: `\`\`\`json\n${mockAiOutput}\n\`\`\`` }],
                },
              },
            ],
          }),
      } as unknown as Response);

      const result = await service.generateItinerary({
        days: 1,
        district: 'Castle',
      });

      expect(result.cached).toBe(false);
      expect(result.title).toBe('Custom 2-Day Castle Experience');
      expect(result.days?.[0].items[0].name).toBe('Ehmedek Fortress');
    });
  });
});
