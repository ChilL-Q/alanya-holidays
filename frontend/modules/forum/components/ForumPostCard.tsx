import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowBigUp, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ForumPost } from '../../../types/models';

interface ForumPostCardProps {
    post: ForumPost;
}

export const ForumPostCard: React.FC<ForumPostCardProps> = ({ post }) => {
    const authorName = post.author?.full_name || 'Anonymous';
    const when = post.created_at
        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
        : '';

    return (
        <Link
            to={`/forum/${post.slug}`}
            className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
        >
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                {post.is_pinned && (
                    <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                        <Pin size={12} /> Pinned
                    </span>
                )}
                {post.category && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-medium">
                        {post.category.name}
                    </span>
                )}
                <span>{authorName}</span>
                {when && <span>· {when}</span>}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2">
                {post.title}
            </h3>

            <div className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                    <ArrowBigUp size={18} className={post.liked_by_me ? 'fill-teal-500 text-teal-500' : ''} />
                    {post.like_count}
                </span>
                <span className="inline-flex items-center gap-1">
                    <MessageSquare size={16} /> {post.comment_count}
                </span>
            </div>
        </Link>
    );
};
