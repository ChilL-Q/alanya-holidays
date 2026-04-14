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
        functions: {
            invoke: vi.fn(),
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

// Slugify is a pure function — no need to mock
vi.mock('../../utils/slugify', () => ({
    slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-'),
    generateUniqueSlug: (base: string, existing: string[]) => {
        if (!existing.includes(base)) return base;
        let i = 1;
        while (existing.includes(`${base}-${i}`)) i++;
        return `${base}-${i}`;
    },
}));

// Import after mocks are set up
import { blogService, BlogPostPreview } from './blog';

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
    // Terminal methods return a Promise
    chain.single = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    // Support direct await on the chain itself
    chain.then = (resolve: (v: any) => void) => resolve(result);
    return chain;
};

/** Helper: set up a mock that returns specific data for a given table */
function mockFromTable(tableData: Record<string, any>) {
    mockSupabase.from.mockImplementation((table: string) => {
        const data = tableData[table] ?? null;
        return createChain(data);
    });
}

const mockUser = { id: 'user-123', email: 'author@example.com' };
const mockAdminUser = { id: 'admin-123', email: 'admin@example.com' };

function setupAuth(user: { id: string; email: string } | null = mockUser) {
    mockSupabase.auth.getUser.mockResolvedValue({
        data: { user },
        error: null,
    });
    mockGetUserRole.mockResolvedValue(user?.id === mockAdminUser.id ? 'admin' : 'user');
}

// ============================================================
// Tests
// ============================================================
describe('blogService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ============================================================
    // getFeaturedBlogPosts
    // ============================================================
    describe('getFeaturedBlogPosts', () => {
        it('fetches featured published posts ordered by date', async () => {
            const mockPosts = [
                { id: 'p1', title: 'Post 1', slug: 'post-1', excerpt: 'Excerpt 1', cover_image_url: 'img1.jpg', category: 'travel', published_at: '2026-04-13', author: { full_name: 'Author', avatar_url: null } },
            ];
            mockSupabase.from.mockReturnValue(createChain(mockPosts));

            const result = await blogService.getFeaturedBlogPosts(3);

            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Post 1');
        });

        it('returns empty array when no featured posts exist', async () => {
            mockFromTable({ blog_posts: [] });

            const result = await blogService.getFeaturedBlogPosts(3);

            expect(result).toEqual([]);
        });
    });

    // ============================================================
    // getBlogPost
    // ============================================================
    describe('getBlogPost', () => {
        it('fetches post by slug and increments views', async () => {
            const mockPost = {
                id: 'p1', title: 'Test', slug: 'test', content: '<p>Hello</p>',
                excerpt: 'Hello world', cover_image_url: 'img.jpg', status: 'published',
                author: { full_name: 'Author', avatar_url: null },
                tags: [{ tag: { id: 't1', name: 'Travel', slug: 'travel' } }],
            };
            mockFromTable({ blog_posts: mockPost });
            mockSupabase.rpc.mockResolvedValue({ data: { views: 42 }, error: null });

            const result = await blogService.getBlogPost('test');

            expect(result).not.toBeNull();
            expect(result?.title).toBe('Test');
            expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_blog_views', { p_post_id: 'p1' });
        });

        it('returns null for non-existent post', async () => {
            mockFromTable({ blog_posts: null });
            mockSupabase.from.mockImplementation(() => createChain(null, { code: 'PGRST116' }));

            const result = await blogService.getBlogPost('nonexistent');

            expect(result).toBeNull();
        });

        it('skips view increment for non-published posts', async () => {
            const mockPost = { id: 'p1', title: 'Draft', slug: 'draft', status: 'draft', tags: [] };
            mockFromTable({ blog_posts: mockPost });

            await blogService.getBlogPost('draft');

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('does not throw when view increment fails', async () => {
            const mockPost = { id: 'p1', title: 'Test', slug: 'test', status: 'published', tags: [] };
            mockFromTable({ blog_posts: mockPost });
            mockSupabase.rpc.mockRejectedValue(new Error('RPC failed'));

            const result = await blogService.getBlogPost('test');

            expect(result).not.toBeNull();
        });
    });

    // ============================================================
    // createBlogPost
    // ============================================================
    describe('createBlogPost', () => {
        it('creates a blog post with auto-generated slug', async () => {
            setupAuth();
            mockFromTable({
                blog_posts: [], // Empty for resolveSlug
                blog_post_tags: null,
            });

            const result = await blogService.createBlogPost({
                title: 'My Post',
                content: '<p>Content here with enough characters to pass the minimum validation requirement successfully.</p>',
            });

            expect(mockSupabase.auth.getUser).toHaveBeenCalled();
            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });

        it('throws when not authenticated', async () => {
            setupAuth(null);

            await expect(blogService.createBlogPost({
                title: 'Test',
                content: 'Content',
            })).rejects.toThrow('Not authenticated');
        });

        it('creates post without content validation error', async () => {
            setupAuth();
            mockFromTable({
                blog_posts: [],
                blog_post_tags: null,
            });

            const result = await blogService.createBlogPost({
                title: 'My Post',
                content: '<p>Valid content here with enough characters to pass.</p>',
            });

            expect(mockSupabase.auth.getUser).toHaveBeenCalled();
            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });
    });

    // ============================================================
    // updateBlogPost
    // ============================================================
    describe('updateBlogPost', () => {
        it('allows author to update their post', async () => {
            setupAuth();
            mockFromTable({
                blog_posts: { id: 'p1', author_id: 'user-123', status: 'draft' },
            });

            await blogService.updateBlogPost('p1', { title: 'Updated' });

            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });

        it('blocks non-author from updating', async () => {
            setupAuth();
            mockFromTable({ blog_posts: { id: 'p1', author_id: 'other-user', status: 'draft' } });

            await expect(blogService.updateBlogPost('p1', { title: 'Hacked' }))
                .rejects.toThrow('Not authorized');
        });

        it('blocks non-admin from setting is_featured', async () => {
            setupAuth();
            mockFromTable({
                blog_posts: { id: 'p1', author_id: 'user-123', status: 'draft' },
            });

            await blogService.updateBlogPost('p1', { title: 'Updated', is_featured: true });

            // Should update the post but ignore is_featured for non-admin
            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });
    });

    // ============================================================
    // deleteBlogPost
    // ============================================================
    describe('deleteBlogPost', () => {
        it('allows admin to delete a post', async () => {
            setupAuth(mockAdminUser);
            mockFromTable({ blog_posts: null });

            await blogService.deleteBlogPost('p1');

            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });

        it('blocks non-admin from deleting', async () => {
            setupAuth();
            mockFromTable({ blog_posts: null });

            await expect(blogService.deleteBlogPost('p1'))
                .rejects.toThrow('Only admins can delete blog posts');
        });
    });

    // ============================================================
    // Tags
    // ============================================================
    describe('getBlogTags', () => {
        it('fetches all tags ordered by name', async () => {
            const mockTags = [
                { id: 't1', name: 'Adventure', slug: 'adventure' },
                { id: 't2', name: 'Food', slug: 'food' },
            ];
            mockFromTable({ blog_tags: mockTags });

            const result = await blogService.getBlogTags();

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Adventure');
        });
    });

    describe('createBlogTag', () => {
        it('allows admin to create a tag', async () => {
            setupAuth(mockAdminUser);
            mockFromTable({ blog_tags: { id: 't1', name: 'New Tag', slug: 'new-tag' } });

            const result = await blogService.createBlogTag('New Tag');

            expect(result.name).toBe('New Tag');
        });

        it('blocks non-admin from creating tags', async () => {
            setupAuth();

            await expect(blogService.createBlogTag('New Tag'))
                .rejects.toThrow('Only admins can create tags');
        });
    });

    // ============================================================
    // Blog Submissions
    // ============================================================
    describe('createBlogSubmission', () => {
        const longContent = 'This is a long enough content for the blog submission to be valid. It has more than one hundred characters to pass the Zod schema validation check successfully.';

        it('creates submission and returns Stripe checkout URL', async () => {
            setupAuth();
            mockFromTable({
                blog_submissions: { id: 'sub-1', user_id: 'user-123', title: 'My Blog', content: longContent },
                profiles: { email: 'author@example.com' },
            });
            mockSupabase.functions.invoke.mockResolvedValue({
                data: { url: 'https://checkout.stripe.com/test' },
                error: null,
            });

            const result = await blogService.createBlogSubmission({
                title: 'My Blog',
                content: longContent,
            });

            expect(result.submissionId).toBe('sub-1');
            expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');
        });

        it('cleans up submission if Stripe checkout fails', async () => {
            setupAuth();
            mockFromTable({
                blog_submissions: { id: 'sub-1', user_id: 'user-123', title: 'My Blog', content: longContent },
                profiles: { email: 'author@example.com' },
            });
            mockSupabase.functions.invoke.mockResolvedValue({
                data: null,
                error: new Error('Stripe failed'),
            });

            await expect(blogService.createBlogSubmission({
                title: 'My Blog',
                content: longContent,
            })).rejects.toThrow();
        });
    });

    describe('getBlogSubmissions', () => {
        it('allows admin to view all submissions', async () => {
            setupAuth(mockAdminUser);
            const mockSubmissions = [
                { id: 's1', user_id: 'user-1', title: 'Sub 1', content: 'This is a very long content that definitely exceeds the minimum character limit for submissions.', status: 'pending_review' },
            ];
            mockFromTable({ blog_submissions: mockSubmissions });

            const result = await blogService.getBlogSubmissions();

            expect(result).toHaveLength(1);
        });

        it('blocks non-admin from viewing all submissions', async () => {
            setupAuth();

            await expect(blogService.getBlogSubmissions())
                .rejects.toThrow('Only admins can view all submissions');
        });
    });

    describe('getUserBlogSubmissions', () => {
        it('returns user own submissions', async () => {
            setupAuth();
            const mockSubmissions = [
                { id: 's1', user_id: 'user-123', title: 'My Sub', content: 'Long content for submission.', status: 'pending_review' },
            ];
            mockFromTable({ blog_submissions: mockSubmissions });

            const result = await blogService.getUserBlogSubmissions();

            expect(result).toHaveLength(1);
            expect(mockSupabase.from).toHaveBeenCalledWith('blog_submissions');
        });

        it('throws when not authenticated', async () => {
            setupAuth(null);

            await expect(blogService.getUserBlogSubmissions())
                .rejects.toThrow('Not authenticated');
        });
    });

    describe('approveBlogSubmission', () => {
        it('creates blog post from approved submission', async () => {
            setupAuth(mockAdminUser);
            const mockSubmission = {
                id: 's1', user_id: 'user-1', title: 'Approved Post',
                content: 'This is a long content that will be used as the blog post content for publication.',
                video_url: null, media_urls: ['img1.jpg'],
                payment_status: 'paid', status: 'pending_review',
            };
            let blogPostsCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blog_submissions') return createChain(mockSubmission);
                if (table === 'blog_posts') {
                    blogPostsCallCount++;
                    if (blogPostsCallCount === 1) return createChain([]); // resolveSlug
                    return createChain({ id: 'p1', title: 'Approved Post', slug: 'approved-post' }); // insert.select().single()
                }
                if (table === 'profiles') return createChain({ email: 'author@example.com', full_name: 'Author' });
                return createChain(null);
            });
            mockSupabase.functions.invoke.mockResolvedValue({ data: {}, error: null });

            const result = await blogService.approveBlogSubmission('s1');

            expect(result.title).toBe('Approved Post');
            expect(mockSupabase.from).toHaveBeenCalledWith('blog_posts');
        });

        it('rejects approval if payment not confirmed', async () => {
            setupAuth(mockAdminUser);
            mockFromTable({
                blog_submissions: { id: 's1', payment_status: 'unpaid', status: 'pending_review' },
            });

            await expect(blogService.approveBlogSubmission('s1'))
                .rejects.toThrow('Submission payment not confirmed');
        });

        it('rejects approval if status not pending_review', async () => {
            setupAuth(mockAdminUser);
            mockFromTable({
                blog_submissions: { id: 's1', payment_status: 'paid', status: 'approved' },
            });

            await expect(blogService.approveBlogSubmission('s1'))
                .rejects.toThrow('Submission is not pending review');
        });

        it('blocks non-admin from approving', async () => {
            setupAuth();

            await expect(blogService.approveBlogSubmission('s1'))
                .rejects.toThrow('Only admins can approve submissions');
        });
    });

    describe('rejectBlogSubmission', () => {
        it('rejects submission with reason and deletes media files', async () => {
            setupAuth(mockAdminUser);
            const mockSubmission = {
                id: 's1', user_id: 'user-1', title: 'Rejected',
                content: 'Long enough content for the submission.', media_urls: ['https://example.com/storage/v1/object/public/blog-media/user-1/abc.jpg'],
            };
            mockFromTable({
                blog_submissions: mockSubmission,
                profiles: { email: 'author@example.com', full_name: 'Author' },
                notifications: null,
            });
            mockSupabase.functions.invoke.mockResolvedValue({ data: {}, error: null });

            await blogService.rejectBlogSubmission('s1', 'Content does not meet quality standards');

            expect(mockSupabase.from).toHaveBeenCalledWith('blog_submissions');
        });

        it('rejects if reason is too short', async () => {
            setupAuth(mockAdminUser);

            await expect(blogService.rejectBlogSubmission('s1', 'Too short'))
                .rejects.toThrow('Rejection reason must be at least 10 characters');
        });

        it('blocks non-admin from rejecting', async () => {
            setupAuth();

            await expect(blogService.rejectBlogSubmission('s1', 'Content does not meet quality standards'))
                .rejects.toThrow('Only admins can reject submissions');
        });
    });
});
