import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Eye, ArrowRight } from 'lucide-react';
import { ForumPost } from '../../types/models';

interface RelatedDiscussionsProps {
    discussions: ForumPost[];
    title?: string;
    loading?: boolean;
}

export const RelatedDiscussions: React.FC<RelatedDiscussionsProps> = ({
    discussions,
    title = 'Related Discussions',
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                    {title}
                </h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg h-20 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (discussions.length === 0) {
        return (
            <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                    {title}
                </h2>
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700/50">
                    <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No related discussions yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/50">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                {title}
            </h2>
            <div className="space-y-3">
                {discussions.map((discussion) => (
                    <Link
                        key={discussion.id}
                        to={`/forum/post/${discussion.slug}`}
                        className="group block p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md dark:hover:shadow-lg transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200 line-clamp-2">
                                    {discussion.title}
                                </h3>
                                {discussion.category && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        in <span className="font-medium">{discussion.category.name}</span>
                                    </p>
                                )}
                            </div>
                            <ArrowRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex-shrink-0 mt-1 transition-colors duration-200" />
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                <MessageSquare size={14} />
                                {discussion.comment_count}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Eye size={14} />
                                {discussion.view_count.toLocaleString()}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};
