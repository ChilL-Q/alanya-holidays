import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getFavorites: jest.fn().mockResolvedValue(['item-1']),
      addFavorite: jest.fn().mockResolvedValue({ success: true }),
      removeFavorite: jest.fn().mockResolvedValue({ success: true }),
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

  it('should pass req.user.id to getFavorites', async () => {
    const req = { user: { id: 'u123' } };
    const res = await controller.getFavorites(req);
    expect(res).toEqual(['item-1']);
    expect(mockService.getFavorites).toHaveBeenCalledWith('u123');
  });

  it('should pass item_id and req.user.id to addFavorite', async () => {
    const req = { user: { id: 'u123' } };
    const res = await controller.addFavorite({ item_id: 'item-10' }, req);
    expect(res).toEqual({ success: true });
    expect(mockService.addFavorite).toHaveBeenCalledWith('item-10', 'u123');
  });

  it('should pass item_id and req.user.id to removeFavorite', async () => {
    const req = { user: { id: 'u123' } };
    const res = await controller.removeFavorite('item-10', req);
    expect(res).toEqual({ success: true });
    expect(mockService.removeFavorite).toHaveBeenCalledWith('item-10', 'u123');
  });
});
