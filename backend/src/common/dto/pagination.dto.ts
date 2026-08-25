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

/**
 * Единый парсинг page/limit из query: PaginationDto (transformed) имеет
 * приоритет, иначе строковые query-параметры, иначе дефолты вызова.
 */
export function parsePagination(
  query: { page?: string; limit?: string },
  pagination?: PaginationDto,
  defaults: { page?: number; limit?: number } = {},
): { page: number; limit: number } {
  return {
    page:
      pagination?.page ??
      (query.page ? parseInt(query.page, 10) : (defaults.page ?? 1)),
    limit:
      pagination?.limit ??
      (query.limit ? parseInt(query.limit, 10) : (defaults.limit ?? 20)),
  };
}
