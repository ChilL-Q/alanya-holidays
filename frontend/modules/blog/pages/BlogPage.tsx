import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Search, PenLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogService } from '../../../api-services';
import { BlogPostPreview } from '../api';
import { BlogPostCard } from '../../../components/home/BlogPostCard';
import { SEOHead } from '../../../components/seo/SEOHead';
import { useAuth } from '../../../context/AuthContext';

const POSTS_PER_PAGE = 9;

export const BlogPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<BlogPostPreview[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // Initial load — fetch posts and discover categories
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                // Fetch first batch
                const { data, total } = await blogService.getBlogPosts({
                    status: 'published',
                    limit: POSTS_PER_PAGE,
                    offset: 0,
                });

                if (cancelled) return;
                setPosts(data);
                setOffset(POSTS_PER_PAGE);
                setHasMore(data.length < total);

                // Discover unique categories from all posts
                const { data: allData } = await blogService.getBlogPosts({
                    status: 'published',
                    limit: 200,
                });
                if (cancelled) return;
                const categories = Array.from(
                    new Set(
                        allData
                            .map((p) => p.category)
                            .filter((c): c is string => Boolean(c))
                    )
                ).sort();
                setAllCategories(categories);
            } catch (err) {
                console.error('Failed to load blog posts:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // Fresh filtered query (resets pagination) — shared by category clicks and search.
    const loadFiltered = useCallback(async (category: string, search: string) => {
        setOffset(0);
        setPosts([]);
        setHasMore(true);
        setLoading(true);
        try {
            const { data, total } = await blogService.getBlogPosts({
                status: 'published',
                category: category === 'all' ? undefined : category,
                search: search.trim() || undefined,
                limit: POSTS_PER_PAGE,
                offset: 0,
            });
            setPosts(data);
            setOffset(POSTS_PER_PAGE);
            setHasMore(data.length < total);
        } catch (err) {
            console.error('Failed to filter blog posts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Category filter — applies immediately, keeping any active search.
    const handleCategoryChange = useCallback((category: string) => {
        setSelectedCategory(category);
        loadFiltered(category, searchQuery);
    }, [loadFiltered, searchQuery]);

    // Debounced text search — refetches with the current category. Skips the
    // initial mount (handled by the load effect above).
    const isFirstSearch = useRef(true);
    useEffect(() => {
        if (isFirstSearch.current) {
            isFirstSearch.current = false;
            return;
        }
        const t = setTimeout(() => loadFiltered(selectedCategory, searchQuery), 300);
        return () => clearTimeout(t);
        // selectedCategory intentionally omitted — category changes refetch via handleCategoryChange
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, loadFiltered]);

    // Load more
    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const { data, total } = await blogService.getBlogPosts({
                status: 'published',
                category: selectedCategory === 'all' ? undefined : selectedCategory,
                search: searchQuery.trim() || undefined,
                limit: POSTS_PER_PAGE,
                offset,
            });
            setPosts((prev) => [...prev, ...data]);
            setOffset((prev) => prev + POSTS_PER_PAGE);
            setHasMore(posts.length + data.length < total);
        } catch (err) {
            console.error('Failed to load more blog posts:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, offset, selectedCategory, searchQuery, posts.length]);

    return (
        <>
            <SEOHead
                title="Alanya Travel Blog — Local Tips, Guides & Insights"
                description="Expert travel guides and local tips for Alanya: hidden gems, restaurant recommendations, beach guides, and insider advice to make your trip unforgettable."
            />

            {/* Hero */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-900 overflow-hidden">
                {/* Decorative background */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-cyan-400 rounded-full text-sm font-semibold mb-6">
                        <BookOpen size={16} />
                        Travel Blog
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Alanya Travel Blog
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Expert tips, hidden gems, and insider guides from locals.
                        Discover the real Alanya beyond the tourist trail.
                    </p>
                    {isAuthenticated && (
                        <div className="mt-8">
                            <Link
                                to="/blog/submit"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                <PenLine size={16} />
                                Submit an Article
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Search + Category Filter Bar */}
            <div className="sticky top-16 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
                    {/* Text search */}
                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles…"
                            aria-label="Search articles"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                    {/* Category pills */}
                    {allCategories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
                                Filter
                            </span>
                            <button
                                onClick={() => handleCategoryChange('all')}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium shrink-0 transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                All
                            </button>
                            {allCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium shrink-0 transition-all capitalize ${
                                        selectedCategory === cat
                                            ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Posts Grid */}
            <section className="py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                No articles found
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                {selectedCategory !== 'all'
                                    ? `No posts in "${selectedCategory}" yet. Check back soon!`
                                    : 'No blog posts available yet. Check back soon!'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post, index) => (
                                    <BlogPostCard key={post.id} post={post} index={index} />
                                ))}
                            </div>

                            {/* Load More */}
                            {hasMore && (
                                <div className="flex justify-center mt-12">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Loading...
                                            </span>
                                        ) : (
                                            'Load More Articles'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
};
