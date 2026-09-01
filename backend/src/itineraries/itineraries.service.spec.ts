import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';
import {
  ItinerariesRepository,
  SavedItineraryRow,
} from './itineraries.repository';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { AiGuideService } from '../ai/ai-guide.service';
import { GenerateItineraryDto } from '../ai/dto/generate-itinerary.dto';

describe('ItinerariesService', () => {
  let service: ItinerariesService;
  let mockRepository: jest.Mocked<Partial<ItinerariesRepository>>;
  let mockAiGuideService: jest.Mocked<Partial<AiGuideService>>;

  const mockItinerary: SavedItineraryRow = {
    id: 'itin-123',
    user_id: 'user-1',
    title: '3 Days in Alanya',
    params: { days: 3, district: 'Alanya' },
    itinerary: [{ day: 1, activities: ['Castle visit'] }],
    created_at: '2026-08-19T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockRepository = {
      createItinerary: jest.fn().mockResolvedValue(mockItinerary),
      findByUserId: jest.fn().mockResolvedValue([mockItinerary]),
      findById: jest.fn().mockResolvedValue(mockItinerary),
      findCommunity: jest.fn().mockResolvedValue([mockItinerary]),
      updateItinerary: jest.fn().mockResolvedValue({
        ...mockItinerary,
        title: 'Updated Title',
      }),
      deleteItinerary: jest.fn().mockResolvedValue(undefined),
    };

    mockAiGuideService = {
      generateItinerary: jest.fn().mockResolvedValue({
        title: 'AI Generated 3-Day Alanya Itinerary',
        description: 'Great plan',
        district: 'Alanya',
        days: [{ day: 1, items: [] }],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItinerariesService,
        {
          provide: ItinerariesRepository,
          useValue: mockRepository,
        },
        {
          provide: AiGuideService,
          useValue: mockAiGuideService,
        },
      ],
    }).compile();

    service = module.get<ItinerariesService>(ItinerariesService);
  });

  describe('createItinerary', () => {
    it('should call repository.createItinerary with userId and dto', async () => {
      const dto: CreateItineraryDto = {
        title: '3 Days in Alanya',
        params: { days: 3 },
        itinerary: [{ day: 1, activities: ['Castle visit'] }],
      };

      const result = await service.createItinerary('user-1', dto);

      expect(result).toEqual(mockItinerary);
      expect(mockRepository.createItinerary).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
    });
  });

  describe('generateAndSaveItinerary', () => {
    it('should invoke AiGuideService and persist generated itinerary to repository', async () => {
      const dto: GenerateItineraryDto = {
        days: 3,
        district: 'Alanya',
        interests: ['beaches'],
      };

      const result = await service.generateAndSaveItinerary('user-1', dto);

      expect(result).toEqual(mockItinerary);
      expect(mockAiGuideService.generateItinerary).toHaveBeenCalledWith(dto);
      expect(mockRepository.createItinerary).toHaveBeenCalledWith('user-1', {
        title: 'AI Generated 3-Day Alanya Itinerary',
        params: {
          days: 3,
          district: 'Alanya',
          interests: ['beaches'],
          pace: 'moderate',
          budget: 'standard',
          companion: '',
        },
        itinerary: [{ day: 1, items: [] }],
      });
    });
  });

  describe('getMyItineraries', () => {
    it('should call repository.findByUserId and return user itineraries', async () => {
      const result = await service.getMyItineraries('user-1');

      expect(result).toEqual([mockItinerary]);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getCommunityItineraries', () => {
    it('should call repository.findCommunity with given limit', async () => {
      const result = await service.getCommunityItineraries(10);

      expect(result).toEqual([mockItinerary]);
      expect(mockRepository.findCommunity).toHaveBeenCalledWith(10);
    });

    it('should use default limit 20 if not specified', async () => {
      const result = await service.getCommunityItineraries();

      expect(result).toEqual([mockItinerary]);
      expect(mockRepository.findCommunity).toHaveBeenCalledWith(20);
    });
  });

  describe('getItineraryById', () => {
    it('should return itinerary if found', async () => {
      const result = await service.getItineraryById('itin-123');

      expect(result).toEqual(mockItinerary);
      expect(mockRepository.findById).toHaveBeenCalledWith('itin-123');
    });

    it('should throw NotFoundException if itinerary does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getItineraryById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateItinerary', () => {
    const updateDto: UpdateItineraryDto = {
      title: 'Updated Title',
    };

    it('should update and return itinerary if user is owner', async () => {
      const result = await service.updateItinerary(
        'itin-123',
        updateDto,
        'user-1',
      );

      expect(result).toEqual({ ...mockItinerary, title: 'Updated Title' });
      expect(mockRepository.updateItinerary).toHaveBeenCalledWith(
        'itin-123',
        updateDto,
      );
    });

    it('should throw NotFoundException if itinerary does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateItinerary('non-existent', updateDto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      await expect(
        service.updateItinerary('itin-123', updateDto, 'different-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.updateItinerary).not.toHaveBeenCalled();
    });
  });

  describe('deleteItinerary', () => {
    it('should delete itinerary if user is owner', async () => {
      const result = await service.deleteItinerary('itin-123', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockRepository.deleteItinerary).toHaveBeenCalledWith('itin-123');
    });

    it('should throw NotFoundException if itinerary does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteItinerary('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      await expect(
        service.deleteItinerary('itin-123', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.deleteItinerary).not.toHaveBeenCalled();
    });
  });
});
