import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { adminContentService } from './admin-content.service';

describe('adminContentService CRUD contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses the current blog content model for article and guide CRUD', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 'post-1' });
    vi.spyOn(apiClient, 'put').mockResolvedValue({ id: 'post-1' });
    vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);
    const input = { title: 'Guide', content: '<p>Useful guide content</p>' };

    await adminContentService.listArticles('guide');
    await adminContentService.createArticle(input);
    await adminContentService.updateArticle('post-1', input);
    await adminContentService.deleteArticle('post-1');

    expect(apiClient.get).toHaveBeenCalledWith('/blog/posts', { params: { limit: 50, content_type: 'guide' } });
    expect(apiClient.post).toHaveBeenCalledWith('/blog', input);
    expect(apiClient.put).toHaveBeenCalledWith('/blog/post-1', input);
    expect(apiClient.delete).toHaveBeenCalledWith('/blog/post-1');
  });

  it('dispatches complete event, listing, and product CRUD through admin-protected routes', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue([]);
    vi.spyOn(apiClient, 'post').mockResolvedValue({});
    vi.spyOn(apiClient, 'put').mockResolvedValue({ success: true });
    vi.spyOn(apiClient, 'patch').mockResolvedValue({});
    vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);

    await adminContentService.createEvent({ title: 'Meetup', event_date: '2026-09-01T18:00:00Z' });
    await adminContentService.updateEvent('event-1', { title: 'Meetup', event_date: '2026-09-01T18:00:00Z' });
    await adminContentService.deleteEvent('event-1');
    await adminContentService.createListing({ name: 'Cafe', category_id: 'restaurants' });
    await adminContentService.updateListing('listing-1', { name: 'Cafe', category_id: 'restaurants' });
    await adminContentService.deleteListing('listing-1');
    const product = {
      name: 'Lamp',
      description: 'Copper lamp',
      category_id: 7,
      price: 10,
      stock: 2,
      currency: 'EUR',
      status: 'active' as const,
      media: [{ url: 'https://example.com/lamp.jpg', type: 'image' }],
    };
    await adminContentService.createProduct(product);
    await adminContentService.updateProduct('product-1', product);
    await adminContentService.deleteProduct('product-1');

    expect(apiClient.post).toHaveBeenCalledWith('/forum/events', expect.any(Object));
    expect(apiClient.put).toHaveBeenCalledWith('/forum/events/event-1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/directory/admin/listings', expect.any(Object));
    expect(apiClient.patch).toHaveBeenCalledWith('/directory/admin/listings/listing-1', expect.any(Object));
    expect(apiClient.post).toHaveBeenCalledWith('/products/admin', product);
    expect(apiClient.put).toHaveBeenCalledWith('/products/admin/product-1', product);
    expect(apiClient.delete).toHaveBeenCalledTimes(3);
  });

  it('requests a counted searchable product page', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      items: [{ id: 21, name: 'Copper Lamp' }],
      page: 2,
      limit: 20,
      total: 21,
    });

    await expect(
      adminContentService.listProducts({ page: 2, limit: 20, search: 'copper' }),
    ).resolves.toMatchObject({ page: 2, total: 21 });
    expect(apiClient.get).toHaveBeenCalledWith('/products/admin', {
      params: { page: 2, limit: 20, search: 'copper' },
    });
  });
});
