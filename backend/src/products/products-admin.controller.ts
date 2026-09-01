import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { AdminProductsQueryDto } from './dto/product-pagination-query.dto';
import {
  CreateAdminProductDto,
  UpdateAdminProductDto,
} from './dto/admin-product.dto';

@Controller('products/admin')
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('admin')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProductsAdmin(@Query() query: AdminProductsQueryDto) {
    return this.productsService.getProductsAdmin(
      query.category_id,
      query.page ?? 1,
      query.limit ?? 20,
      query.search,
    );
  }

  @Get(':id')
  async getProductAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getAdminProduct(id);
  }

  @Post()
  async createProduct(
    @Body() body: CreateAdminProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createAdminProduct(body, user.id);
  }

  @Put(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAdminProductDto,
  ) {
    return this.productsService.updateAdminProduct(id, body);
  }

  @Patch(':id/status')
  async updateProductStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAdminProductDto,
  ) {
    return this.productsService.updateAdminProduct(id, {
      status: body.status,
    });
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.deleteAdminProduct(id);
  }
}
