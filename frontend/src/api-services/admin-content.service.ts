import { apiClient } from '@/lib/api-client';
import type { BackendBlogPostItem } from './blog.service';
import type { BackendForumEvent, CreateEventPayload } from './events.service';
import type { DirectoryListingRecord } from '@alanya-holidays/shared';

export interface AdminProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft';
  media: Array<{ url: string; type: string }> | null;
  category_id: number | null;
  seller_id?: string | null;
  product_categories?: { id: number; name: string } | null;
}

export type AdminProductInput = Pick<
  AdminProduct,
  'name' | 'description' | 'price' | 'stock' | 'currency' | 'status' | 'media' | 'category_id'
>;

export interface AdminProductPage {
  items: AdminProduct[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  cover_image_url?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  content_type?: 'blog' | 'guide';
}

export interface AdminListingInput {
  name: string;
  description?: string;
  short_description?: string;
  category_id: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  gallery?: string[];
  tier?: 'explorer' | 'voyager' | 'signature' | 'partner';
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  creation_source?: 'admin' | 'merchant' | 'import';
}

class AdminContentService {
  async listArticles(contentType?: 'blog' | 'guide'): Promise<BackendBlogPostItem[]> {
    const response = await apiClient.get<
      BackendBlogPostItem[] | { data?: BackendBlogPostItem[] }
    >('/blog/posts', { params: { limit: 50, content_type: contentType } });
    return Array.isArray(response) ? response : response.data ?? [];
  }

  createArticle(input: AdminArticleInput): Promise<BackendBlogPostItem> {
    return apiClient.post('/blog', input);
  }

  updateArticle(id: string, input: AdminArticleInput): Promise<BackendBlogPostItem> {
    return apiClient.put(`/blog/${id}`, input);
  }

  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/blog/${id}`);
  }

  listEvents(): Promise<BackendForumEvent[]> {
    return apiClient.get('/forum/events', {
      params: { includeUnpublished: true, limit: 100 },
    });
  }

  createEvent(input: CreateEventPayload): Promise<BackendForumEvent> {
    return apiClient.post('/forum/events', input);
  }

  updateEvent(id: string, input: CreateEventPayload): Promise<BackendForumEvent> {
    return apiClient.put(`/forum/events/${id}`, input);
  }

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/forum/events/${id}`);
  }

  async listListings(): Promise<DirectoryListingRecord[]> {
    const response = await apiClient.get<
      DirectoryListingRecord[] | { data?: DirectoryListingRecord[] }
    >('/directory/admin/listings', { params: { status: 'all', limit: 100 } });
    return Array.isArray(response) ? response : response.data ?? [];
  }

  createListing(input: AdminListingInput): Promise<DirectoryListingRecord> {
    return apiClient.post('/directory/admin/listings', input);
  }

  updateListing(
    id: string,
    input: AdminListingInput,
  ): Promise<DirectoryListingRecord> {
    return apiClient.patch(`/directory/admin/listings/${id}`, input);
  }

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(`/directory/admin/listings/${id}`);
  }

  listProducts(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<AdminProductPage> {
    return apiClient.get('/products/admin', { params: options });
  }

  createProduct(input: AdminProductInput): Promise<AdminProduct> {
    return apiClient.post('/products/admin', input);
  }

  updateProduct(
    id: string,
    input: AdminProductInput,
  ): Promise<AdminProduct> {
    return apiClient.put(`/products/admin/${id}`, input);
  }

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/admin/${id}`);
  }
}

export const adminContentService = new AdminContentService();
