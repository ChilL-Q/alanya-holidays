import { Test, TestingModule } from '@nestjs/testing';
import {
  FavoritesController,
  AuthenticatedRequest,
} from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let mockService: {
    getFavorites: jest.Mock;
    addFavorite: jest.Mock;
    removeFavorite: jest.Mock;
    syncFavorites: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      getFavorites: jest.fn().mockResolvedValue(['item-1']),
      addFavorite: jest.fn().mockResolvedValue({ success: true }),
      removeFavorite: jest.fn().mockResolvedValue({ success: true }),
      syncFavorites: jest.fn().mockResolvedValue(['item-1', 'item-2']),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  const mockReq = {
    user: { id: 'u123' },
  } as AuthenticatedRequest;

  it('should pass req.user.id to getFavorites', async () => {
    const res = await controller.getFavorites(mockReq);
    expect(res).toEqual(['item-1']);
    expect(mockService.getFavorites).toHaveBeenCalledWith('u123');
  });

  it('should pass item_id and req.user.id to addFavorite', async () => {
    const res = await controller.addFavorite({ item_id: 'item-10' }, mockReq);
    expect(res).toEqual({ success: true });
    expect(mockService.addFavorite).toHaveBeenCalledWith('item-10', 'u123');
  });

  it('should pass item_id and req.user.id to removeFavorite', async () => {
    const res = await controller.removeFavorite('item-10', mockReq);
    expect(res).toEqual({ success: true });
    expect(mockService.removeFavorite).toHaveBeenCalledWith('item-10', 'u123');
  });

  it('should pass item_ids and req.user.id to syncFavorites', async () => {
    const res = await controller.syncFavorites(
      { item_ids: ['item-1', 'item-2'] },
      mockReq,
    );
    expect(res).toEqual(['item-1', 'item-2']);
    expect(mockService.syncFavorites).toHaveBeenCalledWith(
      ['item-1', 'item-2'],
      'u123',
    );
  });
});
