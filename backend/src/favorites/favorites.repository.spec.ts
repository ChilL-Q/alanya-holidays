import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesRepository } from './favorites.repository';
import { SupabaseService } from '../supabase/supabase.service';

describe('FavoritesRepository', () => {
  let repository: FavoritesRepository;
  let mockSupabaseClient: {
    from: jest.Mock;
  };
  let mockFromBuilder: {
    upsert: jest.Mock;
    delete: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
  };

  beforeEach(async () => {
    mockFromBuilder = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockFromBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesRepository,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<FavoritesRepository>(FavoritesRepository);
  });

  describe('upsertFavorite', () => {
    it('should upsert single item to supabase', async () => {
      await repository.upsertFavorite('item-1', 'user-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorites');
      expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
        [{ user_id: 'user-1', item_id: 'item-1' }],
        { onConflict: 'user_id,item_id', ignoreDuplicates: true },
      );
    });

    it('should throw error if upsert fails', async () => {
      mockFromBuilder.upsert.mockResolvedValueOnce({
        error: { message: 'DB Error' },
      });
      await expect(
        repository.upsertFavorite('item-1', 'user-1'),
      ).rejects.toThrow('DB Error');
    });
  });

  describe('upsertFavorites', () => {
    it('should upsert multiple items to supabase', async () => {
      await repository.upsertFavorites(['item-1', 'item-2'], 'user-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorites');
      expect(mockFromBuilder.upsert).toHaveBeenCalledWith(
        [
          { user_id: 'user-1', item_id: 'item-1' },
          { user_id: 'user-1', item_id: 'item-2' },
        ],
        { onConflict: 'user_id,item_id', ignoreDuplicates: true },
      );
    });

    it('should do nothing if itemIds is empty', async () => {
      await repository.upsertFavorites([], 'user-1');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should throw error if bulk upsert fails', async () => {
      mockFromBuilder.upsert.mockResolvedValueOnce({
        error: { message: 'Bulk Error' },
      });
      await expect(
        repository.upsertFavorites(['item-1'], 'user-1'),
      ).rejects.toThrow('Bulk Error');
    });
  });

  describe('deleteFavorite', () => {
    it('should delete item from supabase', async () => {
      mockFromBuilder.eq
        .mockReturnValueOnce(mockFromBuilder)
        .mockResolvedValueOnce({ error: null });

      await repository.deleteFavorite('item-1', 'user-1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorites');
      expect(mockFromBuilder.delete).toHaveBeenCalled();
    });

    it('should throw error if delete fails', async () => {
      mockFromBuilder.eq
        .mockReturnValueOnce(mockFromBuilder)
        .mockResolvedValueOnce({ error: { message: 'Delete Error' } });

      await expect(
        repository.deleteFavorite('item-1', 'user-1'),
      ).rejects.toThrow('Delete Error');
    });
  });

  describe('getFavorites', () => {
    it('should query favorites by user_id', async () => {
      mockFromBuilder.eq.mockResolvedValueOnce({
        data: [{ item_id: 'item-1' }],
        error: null,
      });

      const res = await repository.getFavorites('user-1');
      expect(res).toEqual([{ item_id: 'item-1' }]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('favorites');
    });

    it('should return empty array if data is null', async () => {
      mockFromBuilder.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const res = await repository.getFavorites('user-1');
      expect(res).toEqual([]);
    });

    it('should throw error if select fails', async () => {
      mockFromBuilder.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Select Error' },
      });

      await expect(repository.getFavorites('user-1')).rejects.toThrow(
        'Select Error',
      );
    });
  });
});
