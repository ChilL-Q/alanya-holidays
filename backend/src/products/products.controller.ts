import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Product, ProductVariant } from './products.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@Query('category') category?: string) {
    return this.productsService.getProducts(category);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(@Body() data: Product, @Req() req: any) {
    return this.productsService.createProduct(data, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updates: Partial<Product>,
    @Req() req: any,
  ) {
    return this.productsService.updateProduct(id, updates, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(@Param('id') id: string, @Req() req: any) {
    return this.productsService.deleteProduct(id, req.user.id);
  }

  // Variants
  @Get(':id/variants')
  async getProductVariants(@Param('id') id: string) {
    return this.productsService.getProductVariants(id);
  }

  @Post(':id/variants')
  @UseGuards(AuthGuard)
  async createProductVariant(
    @Param('id') id: string,
    @Body() data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>,
    @Req() req: any,
  ) {
    return this.productsService.createProductVariant(id, data, req.user.id);
  }

  @Put('variants/:variantId')
  @UseGuards(AuthGuard)
  async updateProductVariant(
    @Param('variantId') variantId: string,
    @Body() updates: Partial<ProductVariant>,
    @Req() req: any,
  ) {
    return this.productsService.updateProductVariant(
      variantId,
      updates,
      req.user.id,
    );
  }

  @Delete('variants/:variantId')
  @UseGuards(AuthGuard)
  async deleteProductVariant(
    @Param('variantId') variantId: string,
    @Req() req: any,
  ) {
    return this.productsService.deleteProductVariant(variantId, req.user.id);
  }
}
