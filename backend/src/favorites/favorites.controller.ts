import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { SyncFavoritesDto } from './dto/sync-favorites.dto';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@CurrentUser() user: AuthUser): Promise<string[]> {
    return this.favoritesService.getFavorites(user.id);
  }

  @Post()
  async addFavorite(
    @Body() body: AddFavoriteDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.favoritesService.addFavorite(body.item_id, user.id);
  }

  @Delete(':item_id')
  async removeFavorite(
    @Param('item_id') itemId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.favoritesService.removeFavorite(itemId, user.id);
  }

  @Post('sync')
  async syncFavorites(
    @Body() body: SyncFavoritesDto,
    @CurrentUser() user: AuthUser,
  ): Promise<string[]> {
    return this.favoritesService.syncFavorites(body.item_ids || [], user.id);
  }
}
