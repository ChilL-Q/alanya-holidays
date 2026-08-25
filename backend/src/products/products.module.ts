import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products-admin.controller';
import { ProductsService } from './products.service';
import { ProductDraftsService } from './product-drafts.service';
import { ProductsRepository } from './products.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  // Admin controller MUST stay first: Express resolves the first matching
  // route, and ProductsController declares a @Get(':id') catch-all that
  // would otherwise swallow GET /products/admin.
  controllers: [ProductsAdminController, ProductsController],
  providers: [ProductsService, ProductDraftsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
