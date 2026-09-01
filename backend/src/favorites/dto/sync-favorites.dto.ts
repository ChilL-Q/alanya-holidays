import { IsArray, IsString } from 'class-validator';

export class SyncFavoritesDto {
  @IsArray()
  @IsString({ each: true })
  item_ids!: string[];
}
