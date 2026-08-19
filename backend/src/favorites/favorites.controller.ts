import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { SyncFavoritesDto } from './dto/sync-favorites.dto';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  headers?: Record<string, string | string[] | undefined>;
  [key: string]: unknown;
}

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@Req() req: AuthenticatedRequest): Promise<string[]> {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Post()
  async addFavorite(
    @Body() body: AddFavoriteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.favoritesService.addFavorite(body.item_id, req.user.id);
  }

  @Delete(':item_id')
  async removeFavorite(
    @Param('item_id') itemId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.favoritesService.removeFavorite(itemId, req.user.id);
  }

  @Post('sync')
  async syncFavorites(
    @Body() body: SyncFavoritesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<string[]> {
    return this.favoritesService.syncFavorites(
      body.item_ids || [],
      req.user.id,
    );
  }
}
