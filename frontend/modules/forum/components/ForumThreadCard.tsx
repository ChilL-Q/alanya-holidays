import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, MessageSquare, Flame, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ForumPost } from '../../../types/models';
import { THREAD_FALLBACK_IMAGE } from '../../../data/forumContent';

interface ForumThreadCardProps {
    post: ForumPost;
}

const stripHtml = (html: string | null): string =>
    (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const fmt = (n: number): string => n.toLocaleString('en-US');

export const ForumThreadCard: React.FC<ForumThreadCardProps> = ({ post }) => {
    const parentName = post.category?.parent?.name || post.category?.name;
    const image = post.category?.image_url || THREAD_FALLBACK_IMAGE;
    const author = post.author?.full_name || 'Anonymous';
    const when = post.created_at
        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
        : '';
    const isHot = post.like_count >= 50 || post.view_count >= 1000;
    const excerpt = stripHtml(post.body);

    return (
        <Link
            to={`/forum/${post.slug}`}
            className="group flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-xl transition-all duration-300"
        >
            <div className="relative h-40 overflow-hidden">
                <img
                    src={image}
                    alt={parentName || 'Discussion'}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {parentName && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-black/40 backdrop-blur-sm">
                        {parentName}
                    </span>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    {post.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-teal-600">
                            <Pin size={12} /> Pinned
                        </span>
                    )}
                    {isHot && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white bg-rose-500">
                            <Flame size={12} /> HOT
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col flex-grow p-5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {post.title}
                </h3>
                {excerpt && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow">
                        {excerpt}
                    </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {author.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{author}</p>
                            <p className="text-[11px] text-slate-400">{when}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        <span className="inline-flex items-center gap-1">
                            <Heart size={13} className={post.liked_by_me ? 'fill-rose-500 text-rose-500' : ''} />
                            {fmt(post.like_count)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Eye size={13} /> {fmt(post.view_count)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <MessageSquare size={13} /> {fmt(post.comment_count)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
