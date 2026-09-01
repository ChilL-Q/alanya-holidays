import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import {
  CreateSellerProductDto,
  UpdateSellerProductDto,
} from './dto/seller-product.dto';
import type { SellerOrderStatus } from './dto/update-order-status.dto';
import {
  CreateProductDto,
  CreateProductVariantDto,
  UpdateProductDto,
  UpdateProductVariantDto,
} from './dto/product-write.dto';
import { Money } from '../common/domain/value-objects/money.vo';
import { BillingService } from '../billing/billing.service';
import {
  CreateAdminProductDto,
  UpdateAdminProductDto,
} from './dto/admin-product.dto';

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
  // Allowed seller fulfillment transitions; terminal states map to no exits.
  private static readonly ORDER_STATUS_TRANSITIONS: Record<
    string,
    readonly string[]
  > = {
    pending_payment: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
  };

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly userRolesRepo: UserRolesRepository,
    private readonly billingService: BillingService,
  ) {}

  private async requirePremiumMerchantAccess(userId: string): Promise<void> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role === 'admin') return;

    const hasAccess = await this.billingService.hasActivePremiumAccess(userId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'An active premium subscription is required to manage products',
      );
    }
  }

  async createProduct(data: CreateProductDto, requestUserId: string) {
    await this.requirePremiumMerchantAccess(requestUserId);
    const insertData = {
      title: data.title,
      description: data.description,
      price: data.price,
      stock: data.stock,
      category: data.category,
      images: data.images,
      seller_id: requestUserId,
    };
    const product = await this.productsRepository.insertProduct(insertData);
    return product as Product;
  }

  async getProducts(category?: string, page = 1, limit = 20) {
    const data = await this.productsRepository.getProducts(
      category,
      page,
      limit,
    );
    return data as Product[];
  }

  async getProductsAdmin(
    categoryId?: number,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    return this.productsRepository.getProductsAdmin(
      categoryId,
      page,
      limit,
      search,
    );
  }

  async getAdminProduct(itemId: number) {
    const item = await this.productsRepository.getCatalogItemAdmin(itemId);
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async createAdminProduct(data: CreateAdminProductDto, adminId: string) {
    return this.productsRepository.createCatalogItemAdmin({
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      currency: (data.currency || 'EUR').toUpperCase(),
      stock: data.stock ?? 0,
      media: data.media ?? [],
      category_id: data.category_id ?? null,
      status: data.status ?? 'active',
      seller_id: adminId,
    });
  }

  async updateAdminProduct(itemId: number, data: UpdateAdminProductDto) {
    const updates: Record<string, unknown> = {};
    for (const key of [
      'name',
      'description',
      'price',
      'stock',
      'media',
      'category_id',
      'status',
    ] as const) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    if (data.currency !== undefined) {
      updates.currency = data.currency.toUpperCase();
    }

    const item = await this.productsRepository.updateCatalogItemAdmin(
      itemId,
      updates,
    );
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async deleteAdminProduct(itemId: number) {
    const deleted =
      await this.productsRepository.deleteCatalogItemAdmin(itemId);
    if (!deleted) throw new NotFoundException('Product not found');
    return { success: true };
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
    updates: UpdateProductDto,
    requestUserId: string,
  ) {
    await this.requirePremiumMerchantAccess(requestUserId);
    await this.checkOwnership(id, requestUserId);
    const safeUpdates = this.mapProductUpdates(updates);
    await this.productsRepository.updateProduct(id, safeUpdates);
    return { success: true };
  }

  private mapProductUpdates(updates: UpdateProductDto) {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined)
      payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.stock !== undefined) payload.stock = updates.stock;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.images !== undefined) payload.images = updates.images;
    return payload;
  }

  async deleteProduct(id: string, requestUserId: string) {
    await this.requirePremiumMerchantAccess(requestUserId);
    await this.checkOwnership(id, requestUserId);
    await this.productsRepository.deleteProduct(id);
    return { success: true };
  }

  // Variants
  async getProductVariants(productId: string, page = 1, limit = 20) {
    const data = await this.productsRepository.getProductVariants(
      productId,
      page,
      limit,
    );
    return data as ProductVariant[];
  }

  async createProductVariant(
    productId: string,
    data: CreateProductVariantDto,
    requestUserId: string,
  ) {
    await this.checkOwnership(productId, requestUserId);
    const variant = await this.productsRepository.insertProductVariant({
      size_label: data.size_label,
      price: data.price,
      stock: data.stock,
      sku: data.sku ?? null,
      product_id: productId,
    });
    return variant as ProductVariant;
  }

  async updateProductVariant(
    variantId: string,
    updates: UpdateProductVariantDto,
    requestUserId: string,
  ) {
    const productId =
      await this.productsRepository.getVariantProductId(variantId);
    if (!productId) throw new NotFoundException('Variant not found');

    await this.checkOwnership(productId, requestUserId);

    const safeUpdates: Record<string, unknown> = {};
    if (updates.size_label !== undefined)
      safeUpdates.size_label = updates.size_label;
    if (updates.price !== undefined) safeUpdates.price = updates.price;
    if (updates.stock !== undefined) safeUpdates.stock = updates.stock;
    if (updates.sku !== undefined) safeUpdates.sku = updates.sku;
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

      // Resolve the variant PER ORDER LINE: the same product can appear in
      // one cart under different skus, so pricing/stock must follow the
      // item's own skuId, not "any sku of this product".
      const requestedSkuId = item.skuId != null ? Number(item.skuId) : null;
      let unitPriceFromDb = dbProduct.price;
      let stockFromDb = dbProduct.stock;
      if (requestedSkuId !== null && !Number.isNaN(requestedSkuId)) {
        const sku = (dbProduct.skus ?? []).find((s) => s.id === requestedSkuId);
        if (!sku) {
          throw new BadRequestException(
            `SKU "${item.skuId}" is not available for product "${dbProduct.name}"`,
          );
        }
        unitPriceFromDb = sku.price;
        stockFromDb = sku.stock;
        item.skuId = sku.id;
      }

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

  // --- Seller (Business Dashboard) ---

  async getMyProducts(sellerId: string) {
    await this.requirePremiumMerchantAccess(sellerId);
    return this.productsRepository.getMyCatalogItems(sellerId);
  }

  async createMyProduct(dto: CreateSellerProductDto, sellerId: string) {
    await this.requirePremiumMerchantAccess(sellerId);
    return this.productsRepository.createCatalogItem(
      {
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        currency: dto.currency || 'EUR',
        stock: dto.stock ?? 0,
        media: dto.media ?? null,
        category_id: dto.category_id ?? null,
      },
      sellerId,
    );
  }

  async updateMyProduct(
    itemId: number,
    dto: UpdateSellerProductDto,
    sellerId: string,
  ) {
    await this.requirePremiumMerchantAccess(sellerId);
    const updates: Record<string, unknown> = {};
    for (const key of [
      'name',
      'description',
      'price',
      'currency',
      'stock',
      'media',
      'category_id',
      'status',
    ] as const) {
      if (dto[key] !== undefined) updates[key] = dto[key];
    }

    const updated = await this.productsRepository.updateCatalogItem(
      itemId,
      updates,
      sellerId,
    );
    // Repository scopes the update by seller_id, so a miss means "not yours".
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async deleteMyProduct(itemId: number, sellerId: string) {
    await this.requirePremiumMerchantAccess(sellerId);
    const deleted = await this.productsRepository.deleteCatalogItem(
      itemId,
      sellerId,
    );
    if (!deleted) throw new NotFoundException('Product not found');
    return { success: true };
  }

  async getSellerOrders(sellerId: string) {
    const role = await this.userRolesRepo.getRole(sellerId);
    if (role === 'admin') {
      return this.productsRepository.getAllOrders();
    }

    const items = await this.productsRepository.getMyCatalogItems(sellerId);
    if (items.length === 0) return [];

    return this.productsRepository.getOrdersContainingCatalogItems(
      items.map((item) => item.id),
    );
  }

  async updateOrderStatus(
    orderId: string | number,
    nextStatus: SellerOrderStatus,
    userId: string,
  ) {
    const order = (await this.productsRepository.getOrderById(orderId)) as {
      id: number;
      status: string;
      items?: Array<{ product_id: string | number }> | null;
    } | null;

    if (!order) throw new NotFoundException('Order not found');

    const allowed =
      ProductsService.ORDER_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change order status from '${order.status}' to '${nextStatus}'`,
      );
    }

    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') {
      const itemIds = [
        ...new Set((order.items ?? []).map((item) => String(item.product_id))),
      ];
      const ownsItem = await this.productsRepository.sellerOwnsAnyCatalogItem(
        itemIds,
        userId,
      );
      if (!ownsItem) {
        throw new UnauthorizedException('Not authorized to update this order');
      }
    }

    // The UPDATE is guarded on the status validated above; a concurrent
    // transition makes it match 0 rows and surfaces as a conflict.
    const updated = (await this.productsRepository.updateOrderStatus(
      order.id,
      nextStatus,
      order.status,
    )) as { id: number; status: string } | null;

    if (!updated) {
      throw new ConflictException(
        `Order ${order.id} was already modified — current status differs from '${order.status}'`,
      );
    }
    return updated;
  }
}
