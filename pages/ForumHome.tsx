import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessagesSquare, PlusCircle, Loader2 } from 'lucide-react';
import { db } from '../api-services';
import { ForumPost, ForumCategory } from '../types/models';
import { ForumSort } from '../api-services/api/forum';
import { ForumPostCard } from '../components/forum/ForumPostCard';
import { SEOHead } from '../components/seo/SEOHead';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const POSTS_PER_PAGE = 20;

export const ForumHome: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useModal();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [sort, setSort] = useState<ForumSort>('new');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        db.getForumCategories().then(setCategories).catch((e) => console.error('Failed to load categories:', e));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data, total } = await db.getForumPosts({
                categorySlug: activeCategory === 'all' ? undefined : activeCategory,
                sort,
                limit: POSTS_PER_PAGE,
                offset: 0,
            });
            setPosts(data);
            setHasMore(data.length < total);
        } catch (e) {
            console.error('Failed to load forum posts:', e);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, sort]);

    useEffect(() => {
        load();
    }, [load]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const { data, total } = await db.getForumPosts({
                categorySlug: activeCategory === 'all' ? undefined : activeCategory,
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

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <SEOHead
                title="Community Forum"
                description="Join the Alanya Holidays community forum — ask questions, share tips, and connect with others."
            />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <MessagesSquare className="text-teal-600 dark:text-teal-400" size={28} />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Community Forum</h1>
                </div>
                {isAuthenticated ? (
                    <Link
                        to="/forum/new"
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <PlusCircle size={18} /> New Post
                    </Link>
                ) : (
                    <button
                        onClick={openLogin}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <PlusCircle size={18} /> New Post
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === 'all'
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                    All
                </button>
                {categories.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCategory(c.slug)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            activeCategory === c.slug
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {c.name}
                    </button>
                ))}

                <div className="ml-auto flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
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
            </div>

            {/* Posts */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 size={32} className="animate-spin text-teal-500" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <MessagesSquare size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No posts yet. Be the first to start a conversation!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <ForumPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
};
