import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';

@Module({
  providers: [FavoritesService],
  controllers: [FavoritesController]
})
export class FavoritesModule {}
