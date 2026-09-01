import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorites.repository';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockRepository: {
    client: unknown;
    upsertFavorite: jest.Mock;
    upsertFavorites: jest.Mock;
    deleteFavorite: jest.Mock;
    getFavorites: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      client: {},
      upsertFavorite: jest.fn().mockResolvedValue(undefined),
      upsertFavorites: jest.fn().mockResolvedValue(undefined),
      deleteFavorite: jest.fn().mockResolvedValue(undefined),
      getFavorites: jest
        .fn()
        .mockResolvedValue([{ item_id: 'item-1' }, { item_id: 'item-2' }]),
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
    expect(mockRepository.upsertFavorite).toHaveBeenCalledWith(
      'item-1',
      'user-1',
    );
  });

  it('should call repository to remove favorite and return success', async () => {
    const res = await service.removeFavorite('item-1', 'user-1');
    expect(res).toEqual({ success: true });
    expect(mockRepository.deleteFavorite).toHaveBeenCalledWith(
      'item-1',
      'user-1',
    );
  });

  it('should return array of item_ids from getFavorites', async () => {
    const res = await service.getFavorites('user-1');
    expect(res).toEqual(['item-1', 'item-2']);
    expect(mockRepository.getFavorites).toHaveBeenCalledWith('user-1');
  });

  describe('syncFavorites', () => {
    it('should upsert multiple items and return updated favorites list', async () => {
      mockRepository.getFavorites.mockResolvedValueOnce([
        { item_id: 'item-1' },
        { item_id: 'item-2' },
        { item_id: 'item-3' },
      ]);

      const res = await service.syncFavorites(['item-2', 'item-3'], 'user-1');
      expect(mockRepository.upsertFavorites).toHaveBeenCalledWith(
        ['item-2', 'item-3'],
        'user-1',
      );
      expect(res).toEqual(['item-1', 'item-2', 'item-3']);
      expect(mockRepository.getFavorites).toHaveBeenCalledWith('user-1');
    });

    it('should return current favorites without calling upsertFavorites if itemIds is empty', async () => {
      const res = await service.syncFavorites([], 'user-1');
      expect(mockRepository.upsertFavorites).not.toHaveBeenCalled();
      expect(res).toEqual(['item-1', 'item-2']);
      expect(mockRepository.getFavorites).toHaveBeenCalledWith('user-1');
    });
  });
});
