import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BlogPostPreview } from '../../api-services/api/blog';

interface BlogPostCardProps {
    post: BlogPostPreview;
    index?: number;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, index = 0 }) => {
    const publishedDate = post.published_at
        ? format(new Date(post.published_at), 'MMM d, yyyy')
        : null;

    return (
        <Link
            to={`/blog/${post.slug}`}
            className="group flex flex-col bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-800/50 transition-all duration-500 hover:-translate-y-1 animate-stagger-enter"
            style={{ animationDelay: `${0.1 * index}s` }}
        >
            {/* Cover Image */}
            <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                {post.cover_image_url ? (
                    <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 dark:from-teal-600 dark:to-cyan-700 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-30">A</span>
                    </div>
                )}

                {/* Category Badge */}
                {post.category && (
                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-teal-700 dark:text-teal-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                            {post.category}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">
                    {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 flex-grow">
                        {post.excerpt}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/50">
                    {publishedDate && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Calendar size={12} />
                            {publishedDate}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-teal-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Read More
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
};
