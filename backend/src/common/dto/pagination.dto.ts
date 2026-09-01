import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, IsIn } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  get offset(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}

export class PaginationQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';
}

export class LimitQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DaysQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
