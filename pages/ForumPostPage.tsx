import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ArrowBigUp, MessageSquare, Trash2, Flag, Loader2, ArrowLeft, Send, Eye } from 'lucide-react';
import { db } from '../api-services';
import { ForumPost, ForumComment, ForumReportTargetType, DirectoryListingDB } from '../types/models';
import { SEOHead } from '../components/seo/SEOHead';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { getRelatedListings } from '../utils/communityLinks';
import { RelatedListings } from '../components/community/RelatedListings';

const relTime = (iso: string | null) =>
    iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : '';

export const ForumPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { openLogin } = useModal();

    const [post, setPost] = useState<ForumPost | null>(null);
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [relatedListings, setRelatedListings] = useState<DirectoryListingDB[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);

    const isAdmin = user?.role === 'admin';
    const canModeratePost = post && (isAdmin || post.author_id === user?.id);

    const load = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        try {
            const p = await db.getForumPost(slug);
            if (!p) {
                setNotFound(true);
                return;
            }
            setPost(p);
            db.incrementPostView(p.id);
            const c = await db.getForumComments(p.id);
            setComments(c);
        } catch (e) {
            console.error('Failed to load post:', e);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!post) return;
        setLoadingListings(true);
        getRelatedListings(post, 5)
            .then(listings => setRelatedListings(listings))
            .catch(err => console.error('Failed to load related listings:', err))
            .finally(() => setLoadingListings(false));
    }, [post]);

    const requireAuth = (): boolean => {
        if (!isAuthenticated) {
            openLogin();
            return false;
        }
        return true;
    };

    const handleTogglePostLike = async () => {
        if (!requireAuth() || !post) return;
        // optimistic
        setPost((prev) =>
            prev
                ? { ...prev, liked_by_me: !prev.liked_by_me, like_count: prev.like_count + (prev.liked_by_me ? -1 : 1) }
                : prev,
        );
        try {
            await db.togglePostLike(post.id);
        } catch (e) {
            setPost((prev) =>
                prev
                    ? { ...prev, liked_by_me: !prev.liked_by_me, like_count: prev.like_count + (prev.liked_by_me ? -1 : 1) }
                    : prev,
            );
            toast.error((e as Error).message || 'Failed to like');
        }
    };

    const handleToggleCommentLike = async (comment: ForumComment) => {
        if (!requireAuth()) return;
        setComments((prev) =>
            prev.map((c) =>
                c.id === comment.id
                    ? { ...c, liked_by_me: !c.liked_by_me, like_count: c.like_count + (c.liked_by_me ? -1 : 1) }
                    : c,
            ),
        );
        try {
            await db.toggleCommentLike(comment.id);
        } catch (e) {
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment.id
                        ? { ...c, liked_by_me: !c.liked_by_me, like_count: c.like_count + (c.liked_by_me ? -1 : 1) }
                        : c,
                ),
            );
            toast.error((e as Error).message || 'Failed to like');
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requireAuth() || !post || !newComment.trim()) return;
        setSubmitting(true);
        try {
            const created = await db.createForumComment(post.id, newComment.trim());
            // enrich author for immediate display
            created.author = { full_name: user?.name ?? null, avatar_url: null };
            setComments((prev) => [...prev, created]);
            setPost((prev) => (prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev));
            setNewComment('');
        } catch (e) {
            toast.error((e as Error).message || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async () => {
        if (!post || !window.confirm('Delete this post?')) return;
        try {
            await db.deleteForumPost(post.id);
            toast.success('Post deleted');
            navigate('/forum');
        } catch (e) {
            toast.error((e as Error).message || 'Failed to delete');
        }
    };

    const handleDeleteComment = async (id: string) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await db.deleteForumComment(id);
            setComments((prev) => prev.filter((c) => c.id !== id));
            setPost((prev) => (prev ? { ...prev, comment_count: Math.max(prev.comment_count - 1, 0) } : prev));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to delete comment');
        }
    };

    const handleReport = async (targetType: ForumReportTargetType, targetId: string) => {
        if (!requireAuth()) return;
        const reason = window.prompt('Why are you reporting this? (min 5 characters)');
        if (!reason) return;
        try {
            await db.reportContent({ target_type: targetType, target_id: targetId, reason });
            toast.success('Reported — thank you');
        } catch (e) {
            toast.error((e as Error).message || 'Failed to report');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-16">
                <Loader2 size={32} className="animate-spin text-teal-500" />
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">This post could not be found.</p>
                <Link to="/forum" className="text-teal-600 dark:text-teal-400 font-medium">Back to forum</Link>
            </div>
        );
    }

    const canDeleteComment = (c: ForumComment) => isAdmin || c.author_id === user?.id;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <SEOHead title={post.title} description={post.body?.slice(0, 160) || undefined} type="article" />

            <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 mb-4">
                <ArrowLeft size={16} /> Forum
            </Link>

            <article className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {post.category?.parent && (
                        <Link
                            to={`/forum/category/${post.category.parent.slug}`}
                            className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 font-medium hover:bg-teal-100 dark:hover:bg-teal-900/50"
                        >
                            {post.category.parent.name}
                        </Link>
                    )}
                    {post.category && (
                        <Link
                            to={`/forum/category/${post.category.slug}`}
                            className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                            {post.category.name}
                        </Link>
                    )}
                    <span>{post.author?.full_name || 'Anonymous'}</span>
                    <span>· {relTime(post.created_at)}</span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{post.title}</h1>

                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-6">
                    {post.body}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={handleTogglePostLike}
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                            post.liked_by_me ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:text-teal-600'
                        }`}
                    >
                        <ArrowBigUp size={20} className={post.liked_by_me ? 'fill-teal-500 text-teal-500' : ''} />
                        {post.like_count}
                    </button>
                    <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <MessageSquare size={16} /> {post.comment_count}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Eye size={16} /> {post.view_count}
                    </span>
                    <button
                        onClick={() => handleReport('post', post.id)}
                        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-amber-600 ml-auto"
                    >
                        <Flag size={15} /> Report
                    </button>
                    {canModeratePost && (
                        <button
                            onClick={handleDeletePost}
                            className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                        >
                            <Trash2 size={15} /> Delete
                        </button>
                    )}
                </div>
            </article>

            {/* Comment composer */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    {post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}
                </h2>

                {isAuthenticated ? (
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <textarea
                            name="comment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            placeholder="Add a comment…"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Comment
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={openLogin}
                        className="mb-6 w-full py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
                    >
                        Log in to join the conversation
                    </button>
                )}

                {/* Comment list (flat) */}
                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{c.author?.full_name || 'Anonymous'}</span>
                                <span>· {relTime(c.created_at)}</span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3">{c.body}</p>
                            <div className="flex items-center gap-4 text-sm">
                                <button
                                    onClick={() => handleToggleCommentLike(c)}
                                    className={`inline-flex items-center gap-1 font-medium ${
                                        c.liked_by_me ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-teal-600'
                                    }`}
                                >
                                    <ArrowBigUp size={16} className={c.liked_by_me ? 'fill-teal-500 text-teal-500' : ''} />
                                    {c.like_count}
                                </button>
                                <button
                                    onClick={() => handleReport('comment', c.id)}
                                    className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-600"
                                >
                                    <Flag size={14} /> Report
                                </button>
                                {canDeleteComment(c) && (
                                    <button
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Related Listings */}
                {(relatedListings.length > 0 || loadingListings) && (
                    <RelatedListings
                        listings={relatedListings}
                        title="Related Listings"
                        loading={loadingListings}
                    />
                )}
            </div>
        </div>
    );
};
