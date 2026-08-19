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
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';

interface RequestWithUser {
  user?: {
    id: string;
    role?: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
    @Req() req?: RequestWithUser,
  ) {
    return this.productsService.createProductOrder(dto, req?.user?.id);
  }

  // --- Products Endpoints ---

  @Get()
  async getProducts(@Query('category') category?: string) {
    return this.productsService.getProducts(category);
  }

  @Get('featured')
  async getFeaturedProducts(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 8;
    return this.productsService.getFeaturedProducts(
      Number.isNaN(parsedLimit) ? 8 : parsedLimit,
    );
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(
    @Body() data: Product,
    @Req() req: RequestWithUser & { user: { id: string } },
  ) {
    return this.productsService.createProduct(data, req.user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updates: Partial<Product>,
    @Req() req: RequestWithUser & { user: { id: string } },
  ) {
    return this.productsService.updateProduct(id, updates, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteProduct(
    @Param('id') id: string,
    @Req() req: RequestWithUser & { user: { id: string } },
  ) {
    return this.productsService.deleteProduct(id, req.user.id);
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
    @Req() req: RequestWithUser & { user: { id: string } },
  ) {
    return this.productsService.createProductVariant(id, data, req.user.id);
  }

  @Put('variants/:variantId')
  @UseGuards(AuthGuard)
  async updateProductVariant(
    @Param('variantId') variantId: string,
    @Body() updates: Partial<ProductVariant>,
    @Req() req: RequestWithUser & { user: { id: string } },
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
    @Req() req: RequestWithUser & { user: { id: string } },
  ) {
    return this.productsService.deleteProductVariant(variantId, req.user.id);
  }
}
