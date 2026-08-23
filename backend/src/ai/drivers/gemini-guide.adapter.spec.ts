import { GeminiGuideAdapter } from './gemini-guide.adapter';
import { CuratedTemplateAdapter } from './curated-template.adapter';

describe('GeminiGuideAdapter', () => {
  let adapter: GeminiGuideAdapter;
  let curatedAdapter: CuratedTemplateAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;

    curatedAdapter = new CuratedTemplateAdapter();
    adapter = new GeminiGuideAdapter(curatedAdapter);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('generateGuideAnswer', () => {
    it('should fallback to curated adapter when GEMINI_API_KEY is not set', async () => {
      const fallbackSpy = jest.spyOn(curatedAdapter, 'generateGuideAnswer');
      const fetchSpy = jest.spyOn(global, 'fetch');

      const answer = await adapter.generateGuideAnswer({
        userQuestion: 'Best places for sunset?',
      });

      expect(answer).toContain('Alanya Castle');
      expect(fallbackSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should call Gemini API when GEMINI_API_KEY is set and format response', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      process.env.GEMINI_MODEL = 'gemini-1.5-pro';

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Visit Alanya Castle and Red Tower for sunset views.' },
              ],
            },
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const answer = await adapter.generateGuideAnswer({
        userQuestion: 'Best places for sunset?',
        propertyName: 'Villa Sunset',
        location: 'Kestel',
      });

      expect(answer).toBe(
        'Visit Alanya Castle and Red Tower for sunset views.',
      );
    });

    it('should fallback to curated adapter on network or API failure', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Network offline'));

      const fallbackSpy = jest.spyOn(curatedAdapter, 'generateGuideAnswer');
      const answer = await adapter.generateGuideAnswer({
        userQuestion: 'Best beaches?',
      });

      expect(answer).toContain('Alanya Castle');
      expect(fallbackSpy).toHaveBeenCalled();
    });
  });

  describe('generateItineraryPlan', () => {
    it('should parse Gemini JSON itinerary output', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockAiOutput = JSON.stringify({
        title: 'Custom 2-Day Adventure',
        description: 'Guided tour in Alanya',
        days: [
          {
            day: 1,
            dayLabel: 'Day 1',
            title: 'Harbor Walk',
            items: [
              {
                time: '10:00',
                name: 'Kızıl Kule',
                description: 'Explore the red tower.',
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

      const result = await adapter.generateItineraryPlan({
        days: 1,
        district: 'Alanya',
      });

      expect(result.title).toBe('Custom 2-Day Adventure');
      expect(result.days).toHaveLength(1);
      expect(result.days?.[0].items[0].name).toBe('Kızıl Kule');
    });

    it('should fallback to curated itinerary when Gemini response is invalid', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Invalid JSON response from AI model' }],
                },
              },
            ],
          }),
      } as unknown as Response);

      const result = await adapter.generateItineraryPlan({
        days: 2,
        district: 'Oba',
      });

      expect(result.title).toContain('2-Day Curated Oba Itinerary');
      expect(result.days).toHaveLength(2);
    });

    it('should parse Gemini response with markdown wrapper and conversational preamble', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const jsonPayload = JSON.stringify({
        title: 'Preamble Test Itinerary',
        description: 'Testing markdown parsing',
        days: [
          {
            day: 1,
            title: 'Day 1 Castle',
            items: [
              { time: '09:00', name: 'Castle', description: 'Historic site' },
            ],
          },
        ],
      });

      const fullAiText = `Here is your customized travel itinerary:\n\`\`\`json\n${jsonPayload}\n\`\`\`\nI hope you enjoy your stay!`;

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: fullAiText }],
                },
              },
            ],
          }),
      } as unknown as Response);

      const result = await adapter.generateItineraryPlan({
        days: 1,
        district: 'Alanya',
      });

      expect(result.title).toBe('Preamble Test Itinerary');
      expect(result.days).toHaveLength(1);
    });

    it('should parse Gemini response when output is a direct array of days', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const arrayPayload = JSON.stringify([
        {
          day: 1,
          title: 'Direct Array Day',
          items: [{ time: '10:00', name: 'Beach', description: 'Sunbathing' }],
        },
      ]);

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: `\`\`\`json\n${arrayPayload}\n\`\`\`` }],
                },
              },
            ],
          }),
      } as unknown as Response);

      const result = await adapter.generateItineraryPlan({
        days: 1,
        district: 'Cleopatra',
      });

      expect(result.days).toHaveLength(1);
      expect(result.days?.[0].title).toBe('Direct Array Day');
    });

    it('should fallback gracefully when Gemini candidates array is empty or undefined', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ candidates: [] }),
      } as unknown as Response);

      const result = await adapter.generateItineraryPlan({
        days: 2,
        district: 'Kestel',
      });

      expect(result.title).toContain('2-Day Curated Kestel Itinerary');
      expect(result.days).toHaveLength(2);
    });
  });
});
