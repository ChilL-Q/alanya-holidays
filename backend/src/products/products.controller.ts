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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDraftsService } from './product-drafts.service';
import type { Product, ProductVariant } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';

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
  async getProducts(@Query('category') category?: string) {
    return this.productsService.getProducts(category);
  }

  @Get('featured')
  async getFeaturedProducts(@Query() query?: LimitQueryDto | string) {
    let limit = 8;
    if (typeof query === 'string') {
      const parsed = Number.parseInt(query, 10);
      limit = Number.isNaN(parsed) ? 8 : parsed;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 8;
    }
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(@Body() data: Product, @CurrentUser() user: AuthUser) {
    return this.productsService.createProduct(data, user.id);
  }

  @Post('draft')
  @UseGuards(AuthGuard)
  async saveProductDraft(
    @Body() data: Partial<Product> & { draftId?: string },
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string }> {
    return this.productDraftsService.saveProductDraft(data, user.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard)
  async publishProductDraft(
    @Param('id') id: string,
    @Body() updates: Partial<Product>,
    @CurrentUser() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.productDraftsService.publishProductDraft(id, updates, user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updates: Partial<Product>,
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
  async getProductVariants(@Param('id') id: string) {
    return this.productsService.getProductVariants(id);
  }

  @Post(':id/variants')
  @UseGuards(AuthGuard)
  async createProductVariant(
    @Param('id') id: string,
    @Body() data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.productsService.createProductVariant(id, data, user.id);
  }

  @Put('variants/:variantId')
  @UseGuards(AuthGuard)
  async updateProductVariant(
    @Param('variantId') variantId: string,
    @Body() updates: Partial<ProductVariant>,
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
