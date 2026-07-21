import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ChevronRight, PlusCircle, Layers, MessagesSquare } from 'lucide-react';
import { db } from '../api-services';
import { ForumPost, ForumCategory } from '../types/models';
import { ForumSort } from '../api-services/api/forum';
import { ForumThreadCard } from '../components/forum/ForumThreadCard';
import { SEOHead } from '../components/seo/SEOHead';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { getCategoryIcon, getAccent, THREAD_FALLBACK_IMAGE } from '../data/forumContent';

const POSTS_PER_PAGE = 18;

export const ForumCategoryPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { isAuthenticated } = useAuth();
    const { openLogin } = useModal();

    const [category, setCategory] = useState<ForumCategory | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [activeSub, setActiveSub] = useState<string>('all');
    const [sort, setSort] = useState<ForumSort>('new');
    const [loadingCat, setLoadingCat] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    // Reset when the route slug changes
    useEffect(() => {
        setActiveSub('all');
        setLoadingCat(true);
        setNotFound(false);
        db.getForumCategory(slug || '')
            .then((c) => {
                if (!c) { setNotFound(true); return; }
                setCategory(c);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoadingCat(false));
    }, [slug]);

    const filterSlug = activeSub === 'all' ? slug : activeSub;

    const load = useCallback(async () => {
        if (!slug) return;
        setLoadingPosts(true);
        try {
            const { data, total } = await db.getForumPosts({
                categorySlug: filterSlug,
                sort,
                limit: POSTS_PER_PAGE,
                offset: 0,
            });
            setPosts(data);
            setHasMore(data.length < total);
        } catch (e) {
            console.error('Failed to load category posts:', e);
        } finally {
            setLoadingPosts(false);
        }
    }, [slug, filterSlug, sort]);

    useEffect(() => { load(); }, [load]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const { data, total } = await db.getForumPosts({
                categorySlug: filterSlug,
                sort,
                limit: POSTS_PER_PAGE,
                offset: posts.length,
            });
            const next = [...posts, ...data];
            setPosts(next);
            setHasMore(next.length < total);
        } catch (e) {
            console.error('Failed to load more posts:', e);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loadingCat) {
        return <div className="flex justify-center p-20"><Loader2 size={32} className="animate-spin text-teal-500" /></div>;
    }

    if (notFound || !category) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">This category could not be found.</p>
                <Link to="/forum" className="text-teal-600 dark:text-teal-400 font-medium">Back to the forum</Link>
            </div>
        );
    }

    const Icon = getCategoryIcon(category.icon);
    const accent = getAccent(category.accent);
    const heroImage = category.image_url || null;
    const children = category.children || [];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            <SEOHead
                title={`${category.name} — Community Forum`}
                description={category.description || `Discussions about ${category.name} in the Alanya community forum.`}
            />

            {/* ===== Category hero ===== */}
            <section className={`relative overflow-hidden bg-gradient-to-br ${accent.gradient}`}>
                {heroImage && (
                    <>
                        <img src={heroImage} alt={category.name} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/55" />
                    </>
                )}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <nav className="flex items-center gap-1.5 text-sm text-white/80 mb-5">
                        <Link to="/forum" className="hover:text-white">Forum</Link>
                        {category.parent && (
                            <>
                                <ChevronRight size={14} />
                                <Link to={`/forum/category/${category.parent.slug}`} className="hover:text-white">{category.parent.name}</Link>
                            </>
                        )}
                        <ChevronRight size={14} />
                        <span className="text-white font-medium">{category.name}</span>
                    </nav>

                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <Icon size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">{category.name}</h1>
                            {category.description && (
                                <p className="text-white/85 max-w-2xl mb-3">{category.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-white/80">
                                <span className="inline-flex items-center gap-1.5"><MessagesSquare size={15} /> {(category.discussion_count || 0).toLocaleString('en-US')} discussions</span>
                                {children.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5"><Layers size={15} /> {children.length} topics</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* ===== Subcategory list ("topics") ===== */}
                {children.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Topics in {category.name}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {children.map((sub) => (
                                <Link
                                    key={sub.id}
                                    to={`/forum/category/${sub.slug}`}
                                    className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all"
                                >
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{sub.name}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.chipBg} ${accent.chipText}`}>
                                        {(sub.discussion_count || 0).toLocaleString('en-US')}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== Threads toolbar ===== */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Discussions</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                            {(['new', 'top'] as ForumSort[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSort(s)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                                        sort === s
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {isAuthenticated ? (
                            <Link to="/forum/new" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <PlusCircle size={16} /> New Post
                            </Link>
                        ) : (
                            <button onClick={openLogin} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <PlusCircle size={16} /> New Post
                            </button>
                        )}
                    </div>
                </div>

                {/* Subcategory filter chips */}
                {children.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <button
                            onClick={() => setActiveSub('all')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeSub === 'all'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            All
                        </button>
                        {children.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSub(sub.slug)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    activeSub === sub.slug
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Threads */}
                {loadingPosts ? (
                    <div className="flex justify-center p-12"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <img src={THREAD_FALLBACK_IMAGE} alt="" className="hidden" />
                        <MessagesSquare size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 mb-4">No discussions here yet. Start the conversation!</p>
                        {isAuthenticated ? (
                            <Link to="/forum/new" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                                <PlusCircle size={18} /> New Post
                            </Link>
                        ) : (
                            <button onClick={openLogin} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                                <PlusCircle size={18} /> New Post
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {posts.map((post) => <ForumThreadCard key={post.id} post={post} />)}
                    </div>
                )}

                {hasMore && !loadingPosts && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading…' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
