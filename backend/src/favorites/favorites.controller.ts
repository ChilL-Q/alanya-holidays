import { Controller, Get, Post, Delete, Body, Req, UseGuards, Param } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('favorites')
@UseGuards(AuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@Req() req: any) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Post()
  async addFavorite(@Body() body: { item_id: string }, @Req() req: any) {
    return this.favoritesService.addFavorite(body.item_id, req.user.id);
  }

  @Delete(':item_id')
  async removeFavorite(@Param('item_id') itemId: string, @Req() req: any) {
    return this.favoritesService.removeFavorite(itemId, req.user.id);
  }
}
