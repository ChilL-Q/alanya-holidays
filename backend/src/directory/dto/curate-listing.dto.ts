import { IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CurateListingScoreDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  base_score?: number;
}
