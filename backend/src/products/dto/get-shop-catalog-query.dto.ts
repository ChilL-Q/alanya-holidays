import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductPaginationQueryDto } from './product-pagination-query.dto';

export class GetShopCatalogQueryDto extends ProductPaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;
}
