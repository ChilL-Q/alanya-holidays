import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

@Controller('products/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProductsAdmin(@Query('category') category?: string) {
    return this.productsService.getProducts(category);
  }

  @Get(':id')
  async getProductAdmin(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Patch(':id/status')
  async updateProductStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateProduct(
      id,
      { status } as Record<string, unknown>,
      user.id,
    );
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.deleteProduct(id, user.id);
  }
}
