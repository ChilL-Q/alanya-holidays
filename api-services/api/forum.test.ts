import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks
// ============================================================
const { mockSupabase, mockGetUserRole } = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn(),
        rpc: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    },
    mockGetUserRole: vi.fn(),
}));

vi.mock('../supabase', () => ({
    supabase: mockSupabase,
}));

vi.mock('../auth', () => ({
    getUserRole: mockGetUserRole,
}));

vi.mock('../../utils/slugify', () => ({
    slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
    generateUniqueSlug: (base: string, existing: string[]) => {
        if (!existing.includes(base)) return base;
        let i = 1;
        while (existing.includes(`${base}-${i}`)) i++;
        return `${base}-${i}`;
    },
}));

vi.mock('dompurify', () => ({
    default: { sanitize: (s: string) => s },
}));

import { forumService } from './forum';

// ============================================================
// Helpers
// ============================================================
const createChain = (data: any = null, error: any = null) => {
    const result = { data, error, count: Array.isArray(data) ? data.length : 0 };
    const chain: any = {};
    const chainableMethods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'or', 'order', 'range', 'limit'];
    for (const method of chainableMethods) {
        chain[method] = vi.fn(() => chain);
    }
    chain.single = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    chain.then = (resolve: (v: any) => void) => resolve(result);
    return chain;
};

function mockFromTable(tableData: Record<string, any>) {
    mockSupabase.from.mockImplementation((table: string) => createChain(tableData[table] ?? null));
}

const asUser = (id = 'user-1') => mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id } } });
const asAnon = () => mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('forumService.getForumCategories', () => {
    it('returns ordered categories', async () => {
        mockFromTable({ forum_categories: [{ id: '1', name: 'General', slug: 'general' }] });
        const result = await forumService.getForumCategories();
        expect(result).toHaveLength(1);
        expect(result[0].slug).toBe('general');
    });
});

describe('forumService.createForumPost', () => {
    it('throws when not authenticated', async () => {
        asAnon();
        await expect(
            forumService.createForumPost({ title: 'Hello world', body: 'Some body text' }),
        ).rejects.toThrow('Not authenticated');
    });

    it('rejects a too-short title', async () => {
        asUser();
        await expect(
            forumService.createForumPost({ title: 'Hi', body: 'Some body text' }),
        ).rejects.toThrow();
    });

    it('creates a post with a generated slug', async () => {
        asUser('author-1');
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'forum_posts') {
                // first call resolves slug (select/or → array), insert returns single
                const chain = createChain([], null);
                chain.single = vi.fn(() => Promise.resolve({
                    data: { id: 'p1', title: 'Hello world', slug: 'hello-world', author_id: 'author-1' },
                    error: null,
                }));
                return chain;
            }
            return createChain(null);
        });

        const post = await forumService.createForumPost({ title: 'Hello world', body: 'Body text here' });
        expect(post.slug).toBe('hello-world');
        expect(post.author_id).toBe('author-1');
    });
});

describe('forumService.togglePostLike', () => {
    it('inserts a like when none exists', async () => {
        asUser('user-1');
        const insert = vi.fn(() => Promise.resolve({ error: null }));
        mockSupabase.from.mockImplementation(() => {
            const chain = createChain(null);
            chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
            chain.insert = vi.fn(() => ({ ...chain, then: (r: any) => r({ error: null }) }));
            // make insert awaitable returning {error:null}
            chain.insert = insert as any;
            return chain;
        });
        const res = await forumService.togglePostLike('p1');
        expect(res.liked).toBe(true);
        expect(insert).toHaveBeenCalled();
    });

    it('removes a like when one exists', async () => {
        asUser('user-1');
        mockSupabase.from.mockImplementation(() => {
            const chain = createChain(null);
            chain.maybeSingle = vi.fn(() => Promise.resolve({ data: { post_id: 'p1' }, error: null }));
            chain.delete = vi.fn(() => chain);
            chain.eq = vi.fn(() => chain);
            chain.then = (r: any) => r({ error: null });
            return chain;
        });
        const res = await forumService.togglePostLike('p1');
        expect(res.liked).toBe(false);
    });
});

describe('forumService.reportContent', () => {
    it('throws when not authenticated', async () => {
        asAnon();
        await expect(
            forumService.reportContent({ target_type: 'post', target_id: '00000000-0000-0000-0000-000000000000', reason: 'spam content' }),
        ).rejects.toThrow('Not authenticated');
    });

    it('rejects an invalid target id', async () => {
        asUser();
        await expect(
            forumService.reportContent({ target_type: 'post', target_id: 'not-a-uuid', reason: 'spam content' }),
        ).rejects.toThrow();
    });
});

describe('admin-only guards', () => {
    it('createForumCategory rejects non-admins', async () => {
        asUser('user-1');
        mockGetUserRole.mockResolvedValue('guest');
        await expect(
            forumService.createForumCategory({ name: 'Travel' }),
        ).rejects.toThrow('Not authorized');
    });

    it('getForumReports rejects non-admins', async () => {
        asUser('user-1');
        mockGetUserRole.mockResolvedValue('host');
        await expect(forumService.getForumReports()).rejects.toThrow('Not authorized');
    });

    it('setRemoved allows admins', async () => {
        asUser('admin-1');
        mockGetUserRole.mockResolvedValue('admin');
        mockFromTable({ forum_posts: null });
        await expect(forumService.setRemoved('post', 'p1', true)).resolves.toBeUndefined();
    });
});
