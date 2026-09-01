import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import RichTextEditor from '@/components/base/RichTextEditor';
import {
  adminContentService,
  type AdminArticleInput,
  type AdminListingInput,
  type AdminProductInput,
} from '@/api-services/admin-content.service';

type Resource = 'articles' | 'events' | 'listings' | 'products';
type ManagedItem = Record<string, unknown> & { id: string | number };

const resourceLabels: Record<Resource, string> = {
  articles: 'admin.resourceArticles',
  events: 'admin.resourceEvents',
  listings: 'admin.resourceListings',
  products: 'admin.resourceProducts',
};

const PRODUCT_PAGE_SIZE = 20;

const emptyForm = (): Record<string, string | boolean> => ({
  title: '',
  name: '',
  description: '',
  content: '',
  excerpt: '',
  category: '',
  category_id: '',
  status: 'draft',
  content_type: 'blog',
  creation_source: 'import',
  cover_image_url: '',
  image_url: '',
  event_date: '',
  location: '',
  phone: '',
  email: '',
  website: '',
  price: '0',
  stock: '0',
  currency: 'EUR',
  images: '',
  is_published: true,
  is_featured: false,
});

function itemTitle(item: ManagedItem, fallback: string): string {
  return String(item.title || item.name || fallback);
}

function itemMeta(resource: Resource, item: ManagedItem, noDate: string, draft: string): string {
  if (resource === 'events') return String(item.event_date || noDate);
  if (resource === 'products') return `${item.stock ?? 0} in stock · ${item.price ?? 0}`;
  return String(item.status || item.category || draft);
}

export default function AdminContentLibraryTab() {
  const { t } = useTranslation();
  const [resource, setResource] = useState<Resource>('articles');
  const [items, setItems] = useState<ManagedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ManagedItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyForm);
  const [embedValue, setEmbedValue] = useState('');
  const [insertContent, setInsertContent] = useState<{ id: number; html: string } | null>(null);
  const [articleType, setArticleType] = useState<'all' | 'blog' | 'guide'>('all');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchDraft, setProductSearchDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (resource === 'products') {
        const result = await adminContentService.listProducts({
          page: productPage,
          limit: PRODUCT_PAGE_SIZE,
          search: productSearch,
        });
        setItems(result.items as unknown as ManagedItem[]);
        setProductTotal(result.total);
        return;
      }
      const data =
        resource === 'articles'
          ? await adminContentService.listArticles(articleType === 'all' ? undefined : articleType)
          : resource === 'events'
            ? await adminContentService.listEvents()
            : await adminContentService.listListings();
      setItems(data as ManagedItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('admin.contentLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [articleType, productPage, productSearch, resource, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) setIsFormOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen, saving]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (item: ManagedItem) => {
    setEditing(item);
    const listingOverrides: Record<string, string | boolean> = resource === 'listings'
      ? {
          images: Array.isArray(item.gallery)
            ? item.gallery.map((entry) => String(entry)).join('\n')
            : '',
        }
      : {};
    const productOverrides: Record<string, string | boolean> = resource === 'products'
      ? {
          name: String(item.name ?? ''),
          category_id: String(item.category_id ?? ''),
          currency: String(item.currency ?? 'EUR'),
          status: String(item.status ?? 'active'),
          images: Array.isArray(item.media)
            ? item.media
                .filter((entry): entry is { url: string } => typeof entry === 'object' && entry !== null && 'url' in entry)
                .map((entry) => String(entry.url))
                .join('\n')
            : '',
        }
      : {};
    setForm({
      ...emptyForm(),
      ...Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join('\n') : typeof value === 'boolean' ? value : String(value ?? ''),
        ]),
      ),
      ...listingOverrides,
      ...productOverrides,
    });
    setIsFormOpen(true);
  };

  const field = (name: string) => String(form[name] ?? '');
  const setField = (name: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [name]: value }));

  const insertEmbed = (kind: 'cta' | 'listing' | 'image' | 'video') => {
    const value = embedValue.trim();
    if (!value) return;
    const shortcode =
      kind === 'cta'
        ? `[cta category="${value}" label="${t('admin.exploreEmbed', { value })}"]`
        : kind === 'listing'
          ? `[venue id="${value}" layout="card"]`
          : kind === 'image'
            ? `[figure src="${value}" alt="${t('admin.articleImage')}"]`
            : `[video src="${value}"]`;
    setInsertContent({ id: Date.now(), html: `<p>${shortcode}</p>` });
    setEmbedValue('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const id = editing ? String(editing.id) : null;
      if (resource === 'articles') {
        const input: AdminArticleInput = {
          title: field('title').trim(),
          content: field('content'),
          excerpt: field('excerpt').trim() || undefined,
          category: field('category').trim() || undefined,
          cover_image_url: field('cover_image_url').trim() || undefined,
          status: field('status') as AdminArticleInput['status'],
          is_featured: form.is_featured === true,
          content_type: field('content_type') as 'blog' | 'guide',
        };
        if (id) await adminContentService.updateArticle(id, input);
        else await adminContentService.createArticle(input);
      } else if (resource === 'events') {
        const input = {
          title: field('title').trim(),
          description: field('description').trim(),
          location: field('location').trim(),
          event_date: new Date(field('event_date')).toISOString(),
          image_url: field('image_url').trim() || undefined,
          is_published: form.is_published === true,
        };
        if (id) await adminContentService.updateEvent(id, input);
        else await adminContentService.createEvent(input);
      } else if (resource === 'listings') {
        const input: AdminListingInput = {
          name: field('name').trim(),
          description: field('description').trim(),
          short_description: field('description').trim().slice(0, 500),
          category_id: field('category_id').trim(),
          location: field('location').trim(),
          phone: field('phone').trim(),
          email: field('email').trim(),
          website: field('website').trim(),
          gallery: field('images').split('\n').map((value) => value.trim()).filter(Boolean),
          status: field('status') as AdminListingInput['status'],
        };
        if (id) {
          input.creation_source = field(
            'creation_source',
          ) as AdminListingInput['creation_source'];
        }
        if (id) await adminContentService.updateListing(id, input);
        else await adminContentService.createListing(input);
      } else {
        const input: AdminProductInput = {
          name: field('name').trim(),
          description: field('description').trim() || null,
          category_id: field('category_id').trim() ? Number(field('category_id')) : null,
          price: Number(field('price')),
          stock: Number(field('stock')),
          currency: field('currency').trim().toUpperCase() || 'EUR',
          status: field('status') as AdminProductInput['status'],
          media: field('images').split('\n').map((value) => value.trim()).filter(Boolean).map((url) => ({ url, type: 'image' })),
        };
        if (id) await adminContentService.updateProduct(id, input);
        else await adminContentService.createProduct(input);
      }
      setIsFormOpen(false);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ManagedItem) => {
    if (!window.confirm(t('admin.confirmDeleteResource', { title: itemTitle(item, t('admin.untitled')) }))) return;
    setError(null);
    try {
      const id = String(item.id);
      if (resource === 'articles') await adminContentService.deleteArticle(id);
      else if (resource === 'events') await adminContentService.deleteEvent(id);
      else if (resource === 'listings') await adminContentService.deleteListing(id);
      else await adminContentService.deleteProduct(id);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete item');
    }
  };

  const formTitle = useMemo(
    () => `${editing ? t('admin.edit') : t('admin.create')} ${t(resourceLabels[resource])}`,
    [editing, resource, t],
  );

  return (
    <section className="space-y-6" aria-labelledby="content-library-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="content-library-heading" className="text-2xl font-bold">{t('admin.contentLibrary')}</h2>
          <p className="text-sm text-secondary-500 dark:text-slate-400">{t('admin.contentLibraryDescription')}</p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600">
          {t('admin.createResource', { resource: t(resourceLabels[resource]) })}
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('admin.managedContentType')}>
        {(Object.keys(resourceLabels) as Resource[]).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={resource === value} onClick={() => { setResource(value); if (value === 'products') setProductPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${resource === value ? 'bg-secondary-900 text-white dark:bg-white dark:text-slate-950' : 'bg-white text-secondary-700 dark:bg-slate-900 dark:text-slate-200'}`}>
            {t(resourceLabels[value])}
          </button>
        ))}
      </div>
      {resource === 'articles' && (
        <div className="flex gap-2" aria-label={t('admin.articleTypeFilter')}>
          {(['all', 'blog', 'guide'] as const).map((value) => (
            <button key={value} type="button" onClick={() => setArticleType(value)} aria-pressed={articleType === value} className="rounded-lg border border-secondary-200 px-3 py-1.5 text-xs font-semibold capitalize">
              {value === 'all' ? t('admin.allContent') : t(`admin.contentType.${value}`)}
            </button>
          ))}
        </div>
      )}
      {resource === 'products' && (
        <form
          className="flex max-w-xl gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setProductPage(1);
            setProductSearch(productSearchDraft.trim());
          }}
        >
          <input
            type="search"
            aria-label={t('admin.searchProducts')}
            value={productSearchDraft}
            onChange={(event) => setProductSearchDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-secondary-300 bg-transparent px-3 py-2"
          />
          <button type="submit" className="rounded-xl bg-secondary-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">{t('admin.search')}</button>
        </form>
      )}

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <p className="py-10 text-center text-sm text-secondary-500">{t('admin.loading')}</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-secondary-300 p-10 text-center text-sm text-secondary-500">{t('admin.noResourceYet', { resource: t(resourceLabels[resource]).toLowerCase() })}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-secondary-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-xs uppercase text-secondary-500 dark:border-slate-800"><tr><th className="px-4 py-3">{t('admin.name')}</th><th className="px-4 py-3">{t('admin.state')}</th><th className="px-4 py-3 text-right">{t('admin.actions')}</th></tr></thead>
            <tbody>{items.map((item) => <tr key={String(item.id)} className="border-b border-secondary-100 last:border-0 dark:border-slate-800"><td className="px-4 py-3 font-semibold">{itemTitle(item, t('admin.untitled'))}</td><td className="px-4 py-3 text-secondary-500">{itemMeta(resource, item, t('admin.noDate'), t('admin.draft'))}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(item)} className="mr-2 rounded-lg px-3 py-1.5 font-semibold hover:bg-secondary-100 dark:hover:bg-slate-800">{t('admin.edit')}</button><button type="button" onClick={() => void remove(item)} className="rounded-lg px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">{t('admin.delete')}</button></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {resource === 'products' && !loading && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button type="button" aria-label={t('admin.previousPage')} disabled={productPage <= 1} onClick={() => setProductPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-secondary-200 px-3 py-1.5 disabled:opacity-50">{t('admin.previous')}</button>
          <span>{t('admin.pageOf', { page: productPage, total: Math.max(1, Math.ceil(productTotal / PRODUCT_PAGE_SIZE)) })}</span>
          <button type="button" aria-label={t('admin.nextPage')} disabled={productPage * PRODUCT_PAGE_SIZE >= productTotal} onClick={() => setProductPage((page) => page + 1)} className="rounded-lg border border-secondary-200 px-3 py-1.5 disabled:opacity-50">{t('admin.next')}</button>
        </div>
      )}

      {isFormOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="admin-content-form-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setIsFormOpen(false); }}>
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between"><h3 id="admin-content-form-title" className="text-xl font-bold">{formTitle}</h3><button type="button" aria-label={t('admin.closeEditor')} onClick={() => setIsFormOpen(false)} disabled={saving} className="rounded-lg p-2 hover:bg-secondary-100 dark:hover:bg-slate-800">✕</button></div>

            {(resource === 'articles' || resource === 'events') && <label className="block text-sm font-semibold">{t('admin.title')}<input autoFocus required value={field('title')} onChange={(event) => setField('title', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>}
            {(resource === 'listings' || resource === 'products') && <label className="block text-sm font-semibold">{t('admin.name')}<input autoFocus required value={field('name')} onChange={(event) => setField('name', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>}

            {resource === 'articles' ? <>
              <div className="grid gap-3 sm:grid-cols-4"><label className="text-sm font-semibold">{t('admin.type')}<select value={field('content_type')} onChange={(event) => setField('content_type', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2"><option value="blog">{t('admin.blog')}</option><option value="guide">{t('admin.guide')}</option></select></label><label className="text-sm font-semibold">{t('admin.category')}<input value={field('category')} onChange={(event) => setField('category', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.statusField')}<select value={field('status')} onChange={(event) => setField('status', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2"><option value="draft">{t('admin.draft')}</option><option value="published">{t('admin.published')}</option><option value="archived">{t('admin.archived')}</option></select></label><label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={form.is_featured === true} onChange={(event) => setField('is_featured', event.target.checked)} /> {t('admin.featured')}</label></div>
              <label className="block text-sm font-semibold">{t('admin.excerpt')}<textarea value={field('excerpt')} onChange={(event) => setField('excerpt', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>
              <label className="block text-sm font-semibold">{t('admin.coverImageUrl')}<input type="url" value={field('cover_image_url')} onChange={(event) => setField('cover_image_url', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>
              <div className="rounded-xl border border-secondary-200 p-3"><label className="text-sm font-semibold">{t('admin.embedValue')}<input value={embedValue} onChange={(event) => setEmbedValue(event.target.value)} className="mt-1 w-full rounded-lg border border-secondary-300 bg-transparent px-3 py-2" /></label><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => insertEmbed('cta')} className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-semibold">{t('admin.insertCta')}</button><button type="button" onClick={() => insertEmbed('listing')} className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-semibold">{t('admin.insertListingCard')}</button><button type="button" onClick={() => insertEmbed('image')} className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-semibold">{t('admin.insertImage')}</button><button type="button" onClick={() => insertEmbed('video')} className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-semibold">{t('admin.insertVideo')}</button></div></div>
              <label className="block text-sm font-semibold">{t('admin.body')}<RichTextEditor value={field('content')} onChange={(value) => setField('content', value)} insertContent={insertContent} ariaLabel={t('admin.articleBody')} maxLength={100000} /></label>
            </> : <>
              <label className="block text-sm font-semibold">{t('admin.description')}<textarea required={resource === 'products'} value={field('description')} onChange={(event) => setField('description', event.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>
              {resource === 'events' && <><label className="block text-sm font-semibold">{t('admin.dateTime')}<input required type="datetime-local" value={field('event_date').slice(0, 16)} onChange={(event) => setField('event_date', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="block text-sm font-semibold">{t('admin.location')}<input value={field('location')} onChange={(event) => setField('location', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="flex gap-2 text-sm font-semibold"><input type="checkbox" checked={form.is_published === true} onChange={(event) => setField('is_published', event.target.checked)} /> {t('admin.published')}</label></>}
              {resource === 'listings' && <><label className="block text-sm font-semibold">{t('admin.categoryId')}<input required value={field('category_id')} onChange={(event) => setField('category_id', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="block text-sm font-semibold">{t('admin.location')}<input value={field('location')} onChange={(event) => setField('location', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">{t('admin.emailField')}<input type="email" value={field('email')} onChange={(event) => setField('email', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.phoneField')}<input value={field('phone')} onChange={(event) => setField('phone', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label></div>{editing && <label className="block text-sm font-semibold">{t('admin.claimSource')}<select value={field('creation_source')} onChange={(event) => setField('creation_source', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2"><option value="import">{t('admin.importNotClaimable')}</option><option value="merchant">{t('admin.merchantNotClaimable')}</option><option value="admin">{t('admin.adminCuratedClaimable')}</option></select></label>}</>}
              {resource === 'products' && <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-semibold">{t('admin.categoryId')}<input min="1" step="1" type="number" value={field('category_id')} onChange={(event) => setField('category_id', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.price')}<input required min="0" step="0.01" type="number" value={field('price')} onChange={(event) => setField('price', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.stock')}<input required min="0" step="1" type="number" value={field('stock')} onChange={(event) => setField('stock', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.currency')}<input required minLength={3} maxLength={3} value={field('currency')} onChange={(event) => setField('currency', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label><label className="text-sm font-semibold">{t('admin.statusField')}<select value={field('status')} onChange={(event) => setField('status', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2"><option value="active">{t('admin.active')}</option><option value="inactive">{t('admin.inactive')}</option><option value="draft">{t('admin.draft')}</option></select></label></div>}
              {(resource === 'listings' || resource === 'products') && <label className="block text-sm font-semibold">{t('admin.imageUrls')}<textarea value={field('images')} onChange={(event) => setField('images', event.target.value)} className="mt-1 w-full rounded-xl border border-secondary-300 bg-transparent px-3 py-2" /></label>}
            </>}
            <div className="flex justify-end gap-3 border-t border-secondary-200 pt-4"><button type="button" onClick={() => setIsFormOpen(false)} disabled={saving} className="rounded-xl px-4 py-2 font-semibold">{t('admin.cancel')}</button><button type="submit" disabled={saving} className="rounded-xl bg-accent-600 px-5 py-2 font-semibold text-white disabled:opacity-60">{saving ? t('admin.saving') : t('admin.save')}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
