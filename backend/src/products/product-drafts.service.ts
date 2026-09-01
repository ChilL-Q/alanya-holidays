import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import {
  PublishProductDraftDto,
  SaveProductDraftDto,
  UpdateProductDto,
} from './dto/product-write.dto';

@Injectable()
export class ProductDraftsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

  async saveProductDraft(
    data: SaveProductDraftDto,
    userId: string,
  ): Promise<{ id: string }> {
    const { draftId } = data;
    const safeData = this.mapProductFields(data);
    if (typeof safeData.title !== 'string' || safeData.title.trim() === '') {
      safeData.title = 'Untitled Draft';
    }

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
    updates: PublishProductDraftDto,
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

    const safeUpdates = this.mapProductFields(updates);
    safeUpdates.status = 'active';

    await this.productsRepository.updateProduct(id, safeUpdates);
    return { success: true };
  }

  private mapProductFields(data: UpdateProductDto) {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.category !== undefined) payload.category = data.category;
    if (data.images !== undefined) payload.images = data.images;
    return payload;
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
