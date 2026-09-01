import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminContentLibraryTab from '../components/AdminContentLibraryTab';
import { adminContentService } from '@/api-services/admin-content.service';

vi.mock('@/components/base/RichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="Article body" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

describe('AdminContentLibraryTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminContentService, 'listArticles').mockResolvedValue([
      { id: 'post-1', title: 'Alanya Guide', slug: 'alanya-guide', content: '<p>Guide body</p>' },
    ]);
    vi.spyOn(adminContentService, 'createArticle').mockResolvedValue({
      id: 'post-2', title: 'New Guide', slug: 'new-guide', content: '<p>Long enough guide</p>',
    });
    vi.spyOn(adminContentService, 'deleteArticle').mockResolvedValue(undefined);
    vi.spyOn(adminContentService, 'updateArticle').mockResolvedValue({
      id: 'post-1', title: 'Updated Guide', slug: 'alanya-guide', content: '<p>Guide body</p>',
    });
    vi.spyOn(adminContentService, 'listEvents').mockResolvedValue([
      { id: 'event-1', title: 'Harbour Meetup', event_date: '2026-09-01T18:00:00Z' },
    ]);
    vi.spyOn(adminContentService, 'listListings').mockResolvedValue([
      {
        id: 'listing-1',
        name: 'Castle Cafe',
        category_id: 'restaurants',
        creation_source: 'import',
        gallery: ['https://example.com/castle-1.jpg', 'https://example.com/castle-2.jpg'],
      },
    ]);
    vi.spyOn(adminContentService, 'listProducts').mockResolvedValue({
      items: [{ id: 1, name: 'Copper Lamp', description: 'Handmade', category_id: 7, product_categories: { id: 7, name: 'Decor' }, price: 10, stock: 2, currency: 'EUR', status: 'active', media: [] }],
      page: 1,
      limit: 20,
      total: 21,
    });
    vi.spyOn(adminContentService, 'createEvent').mockResolvedValue({ id: 'event-2', title: 'New Event', event_date: '2026-09-02T18:00:00Z' });
    vi.spyOn(adminContentService, 'createListing').mockResolvedValue({ id: 'listing-2', name: 'New Cafe', category_id: 'restaurants' });
    vi.spyOn(adminContentService, 'updateListing').mockResolvedValue({ id: 'listing-1', name: 'Castle Cafe', category_id: 'restaurants', creation_source: 'admin' });
    vi.spyOn(adminContentService, 'createProduct').mockResolvedValue({ id: 2, name: 'New Lamp', description: 'Handmade', category_id: 7, price: 12, stock: 3, currency: 'EUR', status: 'active', media: [] });
  });

  it('creates and deletes an article with explicit confirmation', async () => {
    render(<AdminContentLibraryTab />);
    expect(await screen.findByText('Alanya Guide')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create articles & guides/i }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Guide' } });
    fireEvent.change(screen.getByLabelText('Article body'), { target: { value: '<p>Long enough guide</p>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(adminContentService.createArticle).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Guide' })));

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(adminContentService.deleteArticle).toHaveBeenCalledWith('post-1'));
  });

  it('opens existing content in edit mode and persists the update', async () => {
    render(<AdminContentLibraryTab />);
    expect(await screen.findByText('Alanya Guide')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Guide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(adminContentService.updateArticle).toHaveBeenCalledWith('post-1', expect.objectContaining({ title: 'Updated Guide' })));
  });

  it('exposes working create forms for events, listings, and products', async () => {
    render(<AdminContentLibraryTab />);
    await screen.findByText('Alanya Guide');

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    expect(await screen.findByText('Harbour Meetup')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create events/i }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Event' } });
    fireEvent.change(screen.getByLabelText('Date and time'), { target: { value: '2026-09-02T18:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(adminContentService.createEvent).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('tab', { name: 'Directory Listings' }));
    expect(await screen.findByText('Castle Cafe')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create directory listings/i }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Cafe' } });
    fireEvent.change(screen.getByLabelText('Category ID'), { target: { value: 'restaurants' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(adminContentService.createListing).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('tab', { name: 'Products' }));
    expect(await screen.findByText('Copper Lamp')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /create products/i }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Lamp' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Handmade lamp' } });
    fireEvent.change(screen.getByLabelText('Category ID'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(adminContentService.createProduct).toHaveBeenCalledWith({
      name: 'New Lamp',
      description: 'Handmade lamp',
      category_id: 7,
      price: 12,
      stock: 3,
      currency: 'EUR',
      status: 'draft',
      media: [],
    }));
  });

  it('searches and pages products beyond the first 20 records', async () => {
    render(<AdminContentLibraryTab />);
    await screen.findByText('Alanya Guide');

    fireEvent.click(screen.getByRole('tab', { name: 'Products' }));
    expect(await screen.findByText('Copper Lamp')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search products' }), {
      target: { value: 'copper' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(adminContentService.listProducts).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        search: 'copper',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(adminContentService.listProducts).toHaveBeenLastCalledWith({
        page: 2,
        limit: 20,
        search: 'copper',
      }),
    );
  });

  it('lets an admin explicitly mark a verified imported listing as admin-curated', async () => {
    render(<AdminContentLibraryTab />);
    await screen.findByText('Alanya Guide');

    fireEvent.click(screen.getByRole('tab', { name: 'Directory Listings' }));
    expect(await screen.findByText('Castle Cafe')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Claim source'), {
      target: { value: 'admin' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(adminContentService.updateListing).toHaveBeenCalledWith(
        'listing-1',
        expect.objectContaining({
          creation_source: 'admin',
          gallery: [
            'https://example.com/castle-1.jpg',
            'https://example.com/castle-2.jpg',
          ],
        }),
      ),
    );
  });
});
