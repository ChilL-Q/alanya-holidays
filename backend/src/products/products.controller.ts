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
import { ProductDraftsService } from './product-drafts.service';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';
import {
  ProductPaginationQueryDto,
  ProductVariantsQueryDto,
} from './dto/product-pagination-query.dto';
import {
  CreateSellerProductDto,
  UpdateSellerProductDto,
} from './dto/seller-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';
import {
  CreateProductDto,
  CreateProductVariantDto,
  PublishProductDraftDto,
  SaveProductDraftDto,
  UpdateProductDto,
  UpdateProductVariantDto,
} from './dto/product-write.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productDraftsService: ProductDraftsService,
  ) {}

  // --- Shop Catalog & Orders Endpoints ---

  @Get('categories')
  async getShopCategories() {
    return this.productsService.getShopCategories();
  }

  @Get('catalog')
  async getShopCatalog(@Query() query?: GetShopCatalogQueryDto) {
    return this.productsService.getShopCatalog(query);
  }

  @Get('items/:id')
  async getShopProductDetails(@Param('id') id: string) {
    return this.productsService.getShopProductDetails(id);
  }

  // --- Seller (Business Dashboard) Endpoints ---
  // Declared before the @Get(':id') catch-all so literal paths win.

  @Get('mine')
  @UseGuards(AuthGuard)
  async getMyProducts(@CurrentUser() user: AuthUser) {
    return this.productsService.getMyProducts(user.id);
  }

  @Post('mine')
  @UseGuards(AuthGuard)
  async createMyProduct(
    @Body() dto: CreateSellerProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createMyProduct(dto, user.id);
  }

  @Patch('mine/:id')
  @UseGuards(AuthGuard)
  async updateMyProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSellerProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateMyProduct(id, dto, user.id);
  }

  @Delete('mine/:id')
  @UseGuards(AuthGuard)
  async deleteMyProduct(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.deleteMyProduct(id, user.id);
  }

  @Get('orders/seller')
  @UseGuards(AuthGuard)
  async getSellerOrders(@CurrentUser() user: AuthUser) {
    return this.productsService.getSellerOrders(user.id);
  }

  @Patch('orders/:id/status')
  @UseGuards(AuthGuard)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateOrderStatus(id, dto.status, user.id);
  }

  @Post('orders')
  async createProductOrder(
    @Body() dto: CreateProductOrderDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.productsService.createProductOrder(dto, user?.id);
  }

  @Get('orders/my-orders')
  @UseGuards(AuthGuard)
  async getMyOrders(@CurrentUser() user: AuthUser) {
    return this.productsService.getMyOrders(user.id);
  }

  @Get('orders/:id')
  @UseGuards(AuthGuard)
  async getOrderById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.getOrderById(id, user.id);
  }

  // --- Products Endpoints ---

  @Get()
  async getProducts(@Query() query: ProductPaginationQueryDto) {
    return this.productsService.getProducts(
      query.category,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('featured')
  async getFeaturedProducts(@Query() query?: LimitQueryDto) {
    return this.productsService.getFeaturedProducts(query?.limit ?? 8);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(
    @Body() data: CreateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createProduct(data, user.id);
  }

  @Post('draft')
  @UseGuards(AuthGuard)
  async saveProductDraft(
    @Body() data: SaveProductDraftDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string }> {
    return this.productDraftsService.saveProductDraft(data, user.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  async publishProductDraft(
    @Param('id') id: string,
    @Body() updates: PublishProductDraftDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.productDraftsService.publishProductDraft(id, updates, user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updates: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateProduct(id, updates, user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productsService.deleteProduct(id, user.id);
  }

  // --- Variants Endpoints ---

  @Get(':id/variants')
  async getProductVariants(
    @Param('id') id: string,
    @Query() query: ProductVariantsQueryDto,
  ) {
    return this.productsService.getProductVariants(
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Post(':id/variants')
  @UseGuards(AuthGuard)
  async createProductVariant(
    @Param('id') id: string,
    @Body() data: CreateProductVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createProductVariant(id, data, user.id);
  }

  @Put('variants/:variantId')
  @UseGuards(AuthGuard)
  async updateProductVariant(
    @Param('variantId') variantId: string,
    @Body() updates: UpdateProductVariantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.updateProductVariant(
      variantId,
      updates,
      user.id,
    );
  }

  @Delete('variants/:variantId')
  @UseGuards(AuthGuard)
  async deleteProductVariant(
    @Param('variantId') variantId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.deleteProductVariant(variantId, user.id);
  }
}
