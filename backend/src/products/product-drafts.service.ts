import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { Product } from './products.service';

const IMMUTABLE_PRODUCT_FIELDS = new Set([
  'id',
  'seller_id',
  'artisan_id',
  'created_at',
  'updated_at',
]);

@Injectable()
export class ProductDraftsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

  async saveProductDraft(
    data: Partial<Product> & { draftId?: string },
    userId: string,
  ): Promise<{ id: string }> {
    const { draftId, ...raw } = data;
    const safeData: Record<string, unknown> = { ...raw };
    for (const field of IMMUTABLE_PRODUCT_FIELDS) {
      delete safeData[field];
    }
    if (
      (typeof safeData.title !== 'string' || safeData.title.trim() === '') &&
      typeof safeData.name !== 'string'
    ) {
      safeData.title = 'Untitled Draft';
    }
    delete safeData.name;

    let productId: string;
    if (draftId) {
      await this.assertOwner(draftId, userId);
      await this.productsRepository.updateProduct(draftId, {
        ...safeData,
        status: 'draft',
      });
      productId = draftId;
    } else {
      const inserted = await this.productsRepository.insertProduct({
        ...safeData,
        seller_id: userId,
        status: 'draft',
      });
      productId =
        typeof inserted.id === 'string' ? inserted.id : String(inserted.id);
    }

    return { id: productId };
  }

  async publishProductDraft(
    id: string,
    updates: Partial<Product>,
    userId: string,
  ): Promise<{ success: boolean }> {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new BadRequestException('Invalid product id');
    }

    await this.assertOwner(id, userId);

    const safeUpdates: Record<string, unknown> = { ...updates };
    for (const field of IMMUTABLE_PRODUCT_FIELDS) {
      delete safeUpdates[field];
    }
    safeUpdates.status = 'active';

    await this.productsRepository.updateProduct(id, safeUpdates);
    return { success: true };
  }

  private async assertOwner(productId: string, userId: string) {
    const role = await this.userRolesRepo.getRole(userId);
    const existing =
      await this.productsRepository.getProductOwnership(productId);
    if (!existing) throw new BadRequestException('Product not found');
    if (
      existing.seller_id !== userId &&
      existing.artisan_id !== userId &&
      role !== 'admin'
    ) {
      throw new UnauthorizedException('Not authorized');
    }
  }
}
