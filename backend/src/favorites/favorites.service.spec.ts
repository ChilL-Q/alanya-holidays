import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorites.repository';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      upsertFavorite: jest.fn().mockResolvedValue({}),
      deleteFavorite: jest.fn().mockResolvedValue({}),
      getFavorites: jest.fn().mockResolvedValue([
        { item_id: 'item-1' },
        { item_id: 'item-2' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: FavoritesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should call repository to add favorite and return success', async () => {
    const res = await service.addFavorite('item-1', 'user-1');
    expect(res).toEqual({ success: true });
    expect(mockRepository.upsertFavorite).toHaveBeenCalledWith('item-1', 'user-1');
  });

  it('should call repository to remove favorite and return success', async () => {
    const res = await service.removeFavorite('item-1', 'user-1');
    expect(res).toEqual({ success: true });
    expect(mockRepository.deleteFavorite).toHaveBeenCalledWith('item-1', 'user-1');
  });

  it('should return array of item_ids from getFavorites', async () => {
    const res = await service.getFavorites('user-1');
    expect(res).toEqual(['item-1', 'item-2']);
    expect(mockRepository.getFavorites).toHaveBeenCalledWith('user-1');
  });
});
