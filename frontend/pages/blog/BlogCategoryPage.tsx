import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Breadcrumb } from '../../components/seo/Breadcrumb';
import { db } from '../../api-services';
import { BlogPostPreview } from '../../api-services/api/blog';
import { BlogPostCard } from '../../components/home/BlogPostCard';
import { SEOHead } from '../../components/seo/SEOHead';

const POSTS_PER_PAGE = 9;

export const BlogCategoryPage: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const decodedCategory = decodeURIComponent(category || '');

    const [posts, setPosts] = useState<BlogPostPreview[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // Load posts for this category and discover other categories
    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!decodedCategory) return;
            setLoading(true);
            setPosts([]);
            setOffset(0);
            setHasMore(true);

            try {
                const { data, total } = await db.getBlogPosts({
                    status: 'published',
                    category: decodedCategory,
                    limit: POSTS_PER_PAGE,
                    offset: 0,
                });

                if (cancelled) return;
                setPosts(data);
                setOffset(POSTS_PER_PAGE);
                setHasMore(data.length < total);

                // Discover all categories for sidebar
                const { data: allData } = await db.getBlogPosts({
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
        return () => { cancelled = true; };
    }, [decodedCategory]);

    // Load more
    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !decodedCategory) return;
        setLoadingMore(true);
        try {
            const { data, total } = await db.getBlogPosts({
                status: 'published',
                category: decodedCategory,
                limit: POSTS_PER_PAGE,
                offset,
            });
            const newPosts = [...posts, ...data];
            setPosts(newPosts);
            setOffset((prev) => prev + POSTS_PER_PAGE);
            setHasMore(newPosts.length < total);
        } catch (err) {
            console.error('Failed to load more blog posts:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, offset, decodedCategory, posts]);

    const capitalizedCategory = decodedCategory
        ? decodedCategory.charAt(0).toUpperCase() + decodedCategory.slice(1)
        : '';

    const relatedCategories = allCategories.filter(
        (cat) => cat.toLowerCase() !== decodedCategory.toLowerCase()
    );

    return (
        <>
            <SEOHead
                title={`${capitalizedCategory} Articles`}
                description={`Explore our ${capitalizedCategory} articles about Alanya. Travel tips, guides, and local insights.`}
                type="website"
                keywords={[capitalizedCategory, 'Alanya', 'Turkey', 'travel guide', 'blog']}
            />

            {/* Header */}
            <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-900 dark:to-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Blog', href: '/blog' },
                            { label: capitalizedCategory || decodedCategory },
                        ]}
                    />

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-cyan-400 rounded-full text-sm font-semibold mt-4 mb-4">
                        <BookOpen size={16} />
                        Category
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">
                        {decodedCategory}
                    </h1>
                    <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                        Travel tips, guides, and insights about {decodedCategory} in Alanya and beyond.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Main Content */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {Array.from({ length: 4 }).map((_, i) => (
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
                                        No posts in &quot;{decodedCategory}&quot; yet. Check back soon!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                        {/* Sidebar */}
                        {relatedCategories.length > 0 && (
                            <aside className="w-full lg:w-72 shrink-0">
                                <div className="sticky top-24">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                                        Related Categories
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {relatedCategories.map((cat) => (
                                            <Link
                                                key={cat}
                                                to={`/blog/category/${encodeURIComponent(cat)}`}
                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-400 transition-colors capitalize"
                                            >
                                                {cat}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
};
