import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DIRECTORY_ADMIN_PAGE_MAX_LIMIT = 100;

export class AdminPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DIRECTORY_ADMIN_PAGE_MAX_LIMIT)
  limit?: number = 20;
}

export class AdminDirectoryListingsQueryDto extends AdminPaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  query?: string;
}

export class AdminDirectoryStatusQueryDto extends AdminPaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
