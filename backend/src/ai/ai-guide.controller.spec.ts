import { Test, TestingModule } from '@nestjs/testing';
import { AiGuideController } from './ai-guide.controller';
import { AiGuideService } from './ai-guide.service';
import { AiGuideDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';

describe('AiGuideController', () => {
  let controller: AiGuideController;

  const mockAiGuideService = {
    askGuide: jest.fn(),
    generateItinerary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiGuideController],
      providers: [
        {
          provide: AiGuideService,
          useValue: mockAiGuideService,
        },
      ],
    }).compile();

    controller = module.get<AiGuideController>(AiGuideController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('askGuide', () => {
    it('should delegate to aiGuideService.askGuide and return the result', async () => {
      const dto: AiGuideDto = {
        userQuestion: 'What are the top beaches in Alanya?',
        location: 'Kleopatra',
      };
      const expectedResponse = {
        answer: 'Kleopatra beach is world-famous.',
        cached: false,
      };

      mockAiGuideService.askGuide.mockResolvedValue(expectedResponse);

      const result = await controller.askGuide(dto);

      expect(mockAiGuideService.askGuide).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('generateItinerary', () => {
    it('should delegate to aiGuideService.generateItinerary and return the itinerary response', async () => {
      const dto: GenerateItineraryDto = {
        duration: 3,
        companion: 'family',
        interests: ['history', 'beaches'],
        pace: 'moderate',
        budget: 'standard',
        district: 'Kleopatra',
      };

      const expectedResponse = {
        itinerary: [
          {
            day: 1,
            title: 'Historic Alanya & Castle',
            items: [
              {
                time: '09:30',
                title: 'Alanya Castle & Teleferik',
                description:
                  'Explore the medieval fortress and take the scenic cable car.',
                location: 'Alanya Castle',
                lat: 36.5438,
                lng: 31.9998,
              },
            ],
          },
        ],
        cached: false,
      };

      mockAiGuideService.generateItinerary.mockResolvedValue(expectedResponse);

      const result = await controller.generateItinerary(dto);

      expect(mockAiGuideService.generateItinerary).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });
});
