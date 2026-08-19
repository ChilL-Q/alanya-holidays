import { Injectable, UnauthorizedException } from '@nestjs/common';
import { slugify } from '../../utils/slugify';
import { ForumCategoriesRepository } from '../repositories/forum-categories.repository';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from '../dto/forum-categories.dto';
import {
  ForumActionResponse,
  ForumCategory,
  UpdateForumCategoryDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumCategoriesService {
  constructor(
    private readonly forumCategoriesRepository: ForumCategoriesRepository,
  ) {}

  private async requireAdmin(userId: string): Promise<void> {
    const role = await this.forumCategoriesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');
  }

  private async _postCountsByCategory(): Promise<Map<string, number>> {
    const data = await this.forumCategoriesRepository.getPostCategoryCounts();
    const counts = new Map<string, number>();
    for (const row of data || []) {
      if (row.category_id)
        counts.set(
          String(row.category_id),
          (counts.get(String(row.category_id)) || 0) + 1,
        );
    }
    return counts;
  }

  async getForumCategories(): Promise<ForumCategory[]> {
    return this.forumCategoriesRepository.getCategories();
  }

  async getForumCategoryTree(): Promise<ForumCategory[]> {
    const [all, counts] = await Promise.all([
      this.forumCategoriesRepository.getCategories(),
      this._postCountsByCategory(),
    ]);

    const childrenByParent = new Map<string, ForumCategory[]>();
    for (const c of all) {
      if (c.parent_id) {
        const arr = childrenByParent.get(String(c.parent_id)) || [];
        arr.push(c);
        childrenByParent.set(String(c.parent_id), arr);
      }
    }

    return all
      .filter((c) => !c.parent_id)
      .map((parent) => {
        const children: ForumCategory[] = (
          childrenByParent.get(String(parent.id)) || []
        ).map((ch) => ({
          ...ch,
          discussion_count: counts.get(String(ch.id)) || 0,
        }));
        const discussion = children.reduce(
          (sum: number, ch) => sum + (ch.discussion_count || 0),
          counts.get(String(parent.id)) || 0,
        );
        return {
          ...parent,
          children,
          topic_count: children.length,
          discussion_count: discussion,
        };
      });
  }

  async getForumCategory(slug: string): Promise<ForumCategory | null> {
    const category =
      await this.forumCategoriesRepository.getCategoryBySlug(slug);
    if (!category) return null;

    const counts = await this._postCountsByCategory();

    if (category.parent_id) {
      const parent = await this.forumCategoriesRepository.getCategoryById(
        category.parent_id,
      );
      category.parent = parent || null;
    } else {
      const kids = await this.forumCategoriesRepository.getChildCategories(
        category.id,
      );
      const children = (kids || []).map((ch) => ({
        ...ch,
        discussion_count: counts.get(ch.id) || 0,
      }));
      category.children = children;
      category.topic_count = children.length;
      category.discussion_count = children.reduce(
        (sum, ch) => sum + (ch.discussion_count || 0),
        counts.get(category.id) || 0,
      );
    }

    if (category.parent_id) {
      category.discussion_count = counts.get(category.id) || 0;
    }
    return category;
  }

  async createForumCategory(
    input: CreateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    await this.requireAdmin(userId);
    return this.forumCategoriesRepository.insertCategory({
      name: input.name,
      slug: slugify(input.name),
      description: input.description || null,
      sort_order: input.sort_order ?? 0,
      parent_id: input.parent_id || null,
      icon: input.icon || null,
      image_url: input.image_url || null,
      accent: input.accent || null,
    });
  }

  async updateForumCategory(
    id: string,
    updates: UpdateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    await this.requireAdmin(userId);
    const safe: UpdateForumCategoryDbInput = {};
    if (updates.name !== undefined) {
      safe.name = updates.name;
      safe.slug = slugify(updates.name);
    }
    if (updates.description !== undefined)
      safe.description = updates.description || null;
    if (updates.sort_order !== undefined) safe.sort_order = updates.sort_order;
    if (updates.parent_id !== undefined)
      safe.parent_id = updates.parent_id || null;
    if (updates.icon !== undefined) safe.icon = updates.icon || null;
    if (updates.image_url !== undefined)
      safe.image_url = updates.image_url || null;
    if (updates.accent !== undefined) safe.accent = updates.accent || null;

    return this.forumCategoriesRepository.updateCategory(id, safe);
  }

  async deleteForumCategory(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    await this.forumCategoriesRepository.deleteCategory(id);
    return { success: true };
  }
}
