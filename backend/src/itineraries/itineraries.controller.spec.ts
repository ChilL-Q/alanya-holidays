import { Test, TestingModule } from '@nestjs/testing';
import { ItinerariesController } from './itineraries.controller';
import { ItinerariesService } from './itineraries.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { SavedItineraryRow } from './itineraries.repository';

describe('ItinerariesController', () => {
  let controller: ItinerariesController;
  let mockService: jest.Mocked<Partial<ItinerariesService>>;

  const mockItinerary: SavedItineraryRow = {
    id: 'itin-123',
    user_id: 'user-1',
    title: '3 Days in Alanya',
    params: { days: 3 },
    itinerary: [{ day: 1, activities: ['Castle visit'] }],
    created_at: '2026-08-19T00:00:00.000Z',
  };

  const mockUser: AuthUser = { id: 'user-1' };

  beforeEach(async () => {
    mockService = {
      createItinerary: jest.fn().mockResolvedValue(mockItinerary),
      getMyItineraries: jest.fn().mockResolvedValue([mockItinerary]),
      getCommunityItineraries: jest.fn().mockResolvedValue([mockItinerary]),
      getItineraryById: jest.fn().mockResolvedValue(mockItinerary),
      updateItinerary: jest.fn().mockResolvedValue({
        ...mockItinerary,
        title: 'Updated Title',
      }),
      deleteItinerary: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItinerariesController],
      providers: [
        {
          provide: ItinerariesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ItinerariesController>(ItinerariesController);
  });

  describe('createItinerary', () => {
    it('should delegate createItinerary to service with req.user.id', async () => {
      const dto: CreateItineraryDto = {
        title: '3 Days in Alanya',
        params: { days: 3 },
        itinerary: [{ day: 1 }],
      };

      const result = await controller.createItinerary(dto, mockUser);

      expect(result).toEqual(mockItinerary);
      expect(mockService.createItinerary).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getMyItineraries', () => {
    it('should delegate getMyItineraries to service with req.user.id', async () => {
      const result = await controller.getMyItineraries(mockUser);

      expect(result).toEqual([mockItinerary]);
      expect(mockService.getMyItineraries).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getCommunityItineraries', () => {
    it('should delegate getCommunityItineraries with parsed limit', async () => {
      const result = await controller.getCommunityItineraries({ limit: 15 });

      expect(result).toEqual([mockItinerary]);
      expect(mockService.getCommunityItineraries).toHaveBeenCalledWith(15);
    });

    it('should delegate getCommunityItineraries with default limit when not passed', async () => {
      const result = await controller.getCommunityItineraries();

      expect(result).toEqual([mockItinerary]);
      expect(mockService.getCommunityItineraries).toHaveBeenCalledWith(20);
    });
  });

  describe('getItineraryById', () => {
    it('should delegate getItineraryById to service', async () => {
      const result = await controller.getItineraryById('itin-123');

      expect(result).toEqual(mockItinerary);
      expect(mockService.getItineraryById).toHaveBeenCalledWith('itin-123');
    });
  });

  describe('updateItinerary and patchItinerary', () => {
    it('should delegate updateItinerary (PUT) to service with id, dto, req.user.id', async () => {
      const dto: UpdateItineraryDto = { title: 'Updated Title' };

      const result = await controller.updateItinerary(
        'itin-123',
        dto,
        mockUser,
      );

      expect(result).toEqual({ ...mockItinerary, title: 'Updated Title' });
      expect(mockService.updateItinerary).toHaveBeenCalledWith(
        'itin-123',
        dto,
        'user-1',
      );
    });

    it('should delegate patchItinerary (PATCH) to service with id, dto, req.user.id', async () => {
      const dto: UpdateItineraryDto = { title: 'Patched Title' };

      const result = await controller.patchItinerary('itin-123', dto, mockUser);

      expect(result).toEqual({ ...mockItinerary, title: 'Updated Title' });
      expect(mockService.updateItinerary).toHaveBeenCalledWith(
        'itin-123',
        dto,
        'user-1',
      );
    });
  });

  describe('deleteItinerary', () => {
    it('should delegate deleteItinerary to service with id, req.user.id', async () => {
      const result = await controller.deleteItinerary('itin-123', mockUser);

      expect(result).toEqual({ success: true });
      expect(mockService.deleteItinerary).toHaveBeenCalledWith(
        'itin-123',
        'user-1',
      );
    });
  });
});
