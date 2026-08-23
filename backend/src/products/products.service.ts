import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ProductsRepository,
  ProductCategoryRow,
  ProductItemRow,
  ProductSkuRow,
  ShopCatalogResult,
  CreateOrderResult,
} from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';
import { Money } from '../common/domain/value-objects/money.vo';

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
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

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
    const role = await this.userRolesRepo.getRole(userId);
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
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const currency = dto.currency || 'EUR';

    // Server-authoritative pricing (audit 2.1): resolve prices from the DB,
    // never trust client-supplied unitPrice/finalPrice/subtotal.
    const dbProducts = await this.productsRepository.getOrderableProductsByIds(
      dto.items.map((item) => item.productId),
      dto.items
        .map((item) => item.skuId)
        .filter((id): id is string | number => id != null),
    );
    const dbByProductId = new Map(dbProducts.map((p) => [Number(p.id), p]));

    let calculatedSubtotal = Money.zero(currency);

    for (const item of dto.items) {
      const dbProduct = dbByProductId.get(Number(item.productId));
      if (!dbProduct) {
        throw new BadRequestException(
          `Product "${item.productName}" is not available for ordering`,
        );
      }

      if (dbProduct.currency.toUpperCase() !== currency.toUpperCase()) {
        throw new BadRequestException(
          `Currency mismatch for product "${dbProduct.name}": expected ${currency}, got ${dbProduct.currency}`,
        );
      }

      const unitPriceFromDb = dbProduct.sku_price ?? dbProduct.price;
      const stockFromDb = dbProduct.sku_stock ?? dbProduct.stock;
      if (stockFromDb < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${dbProduct.name}": requested ${item.quantity}, available ${stockFromDb}`,
        );
      }

      const itemSubtotal = Money.fromDecimal(unitPriceFromDb, currency)
        .multiply(item.quantity)
        .toDatabaseDecimal();

      // Overwrite client values with server-resolved ones before persisting.
      item.productName = dbProduct.name;
      item.unitPrice = unitPriceFromDb;
      item.finalPrice = unitPriceFromDb;
      item.subtotal = itemSubtotal;

      calculatedSubtotal = calculatedSubtotal.add(
        Money.fromDecimal(itemSubtotal, currency),
      );
    }

    dto.subtotal = calculatedSubtotal.toDatabaseDecimal();

    return this.productsRepository.createProductOrder(dto, userId);
  }

  async getMyOrders(userId: string) {
    return this.productsRepository.getMyOrders(userId);
  }

  async getOrderById(orderId: string | number, userId: string) {
    const role = await this.userRolesRepo.getRole(userId);
    const order = await this.productsRepository.getOrderById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== userId && role !== 'admin') {
      throw new UnauthorizedException('Not authorized to view this order');
    }

    return order;
  }
}
