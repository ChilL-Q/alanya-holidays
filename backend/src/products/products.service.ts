import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import {
  ProductsRepository,
  ProductCategoryRow,
  ProductItemRow,
  ProductSkuRow,
  ShopCatalogResult,
  CreateOrderResult,
} from './products.repository';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';

export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  seller_id?: string;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  price: number;
  stock: number;
  sku: string | null;
  created_at: string;
}

export interface ShopProductDetailResult {
  product: ProductItemRow;
  variants: unknown[];
  skus: ProductSkuRow[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async createProduct(data: Product, requestUserId: string) {
    const insertData = { ...data, seller_id: requestUserId };
    const product = await this.productsRepository.insertProduct(insertData);
    return product as Product;
  }

  async getProducts(category?: string) {
    const data = await this.productsRepository.getProducts(category);
    return data as Product[];
  }

  async getFeaturedProducts(limit = 8) {
    return this.productsRepository.getFeaturedProducts(limit);
  }

  async getProduct(id: string) {
    const data = await this.productsRepository.getProductById(id);
    if (!data) throw new NotFoundException('Product not found');
    return data as Product;
  }

  private async checkOwnership(productId: string, userId: string) {
    const role = await this.productsRepository.getUserRole(userId);
    const existingProduct =
      await this.productsRepository.getProductOwnership(productId);

    if (!existingProduct) throw new NotFoundException('Product not found');

    if (
      existingProduct.seller_id !== userId &&
      existingProduct.artisan_id !== userId &&
      role !== 'admin'
    ) {
      throw new UnauthorizedException('Not authorized');
    }
    return existingProduct;
  }

  async updateProduct(
    id: string,
    updates: Partial<Product>,
    requestUserId: string,
  ) {
    await this.checkOwnership(id, requestUserId);
    const { seller_id: _seller_id, ...safeUpdates } = updates;
    await this.productsRepository.updateProduct(id, safeUpdates);
    return { success: true };
  }

  async deleteProduct(id: string, requestUserId: string) {
    await this.checkOwnership(id, requestUserId);
    await this.productsRepository.deleteProduct(id);
    return { success: true };
  }

  // Variants
  async getProductVariants(productId: string) {
    const data = await this.productsRepository.getProductVariants(productId);
    return data as ProductVariant[];
  }

  async createProductVariant(
    productId: string,
    data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>,
    requestUserId: string,
  ) {
    await this.checkOwnership(productId, requestUserId);
    const variant = await this.productsRepository.insertProductVariant({
      ...data,
      product_id: productId,
    });
    return variant as ProductVariant;
  }

  async updateProductVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
    requestUserId: string,
  ) {
    const productId =
      await this.productsRepository.getVariantProductId(variantId);
    if (!productId) throw new NotFoundException('Variant not found');

    await this.checkOwnership(productId, requestUserId);

    const {
      id: _id,
      product_id: _productId,
      created_at: _createdAt,
      ...safeUpdates
    } = updates as Record<string, unknown>;
    await this.productsRepository.updateProductVariant(variantId, safeUpdates);
    return { success: true };
  }

  async deleteProductVariant(variantId: string, requestUserId: string) {
    const productId =
      await this.productsRepository.getVariantProductId(variantId);
    if (!productId) throw new NotFoundException('Variant not found');

    await this.checkOwnership(productId, requestUserId);
    await this.productsRepository.deleteProductVariant(variantId);
    return { success: true };
  }

  // --- Shop Catalog & Orders Methods ---

  async getShopCategories(): Promise<ProductCategoryRow[]> {
    return this.productsRepository.getShopCategories();
  }

  async getShopCatalog(
    query?: GetShopCatalogQueryDto,
  ): Promise<ShopCatalogResult> {
    return this.productsRepository.getShopCatalog(query);
  }

  async getShopProductDetails(
    productId: string | number,
  ): Promise<ShopProductDetailResult> {
    const result =
      await this.productsRepository.getShopProductDetails(productId);
    if (!result.product) {
      throw new NotFoundException('Product not found');
    }
    return {
      product: result.product,
      variants: result.variants,
      skus: result.skus,
    };
  }

  async createProductOrder(
    dto: CreateProductOrderDto,
    userId?: string,
  ): Promise<CreateOrderResult> {
    return this.productsRepository.createProductOrder(dto, userId);
  }
}
