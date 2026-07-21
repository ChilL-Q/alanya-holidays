import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { forumService } from '../../../api-services';
import { ForumPost } from '../../../types/models';

export const AskAlanyaSection: React.FC = () => {
    const [questions, setQuestions] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        forumService.getForumPosts({
            postType: 'question',
            limit: 6,
            sort: 'new',
        })
            .then((result) => {
                setQuestions(result.data);
                setLoading(false);
            })
            .catch((e) => {
                console.error('Failed to load questions:', e);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HelpCircle size={18} className="text-teal-600 dark:text-teal-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Ask Alanya</h3>
                </div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <HelpCircle size={18} className="text-teal-600 dark:text-teal-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Ask Alanya</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">No unanswered questions yet. Be the first!</p>
                <Link
                    to="/forum/ask"
                    className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:underline text-sm font-medium"
                >
                    Ask a Question
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={18} className="text-teal-600 dark:text-teal-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Ask Alanya</h3>
            </div>
            <div className="space-y-3">
                {questions.map((q) => (
                    <Link
                        key={q.id}
                        to={`/forum/${q.slug}`}
                        className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    >
                        <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 line-clamp-2">
                            {q.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <MessageCircle size={14} />
                            {q.comment_count} answer{q.comment_count !== 1 ? 's' : ''}
                        </div>
                    </Link>
                ))}
            </div>
            <Link
                to="/forum/ask"
                className="block mt-4 text-center px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors text-sm font-medium"
            >
                Ask a Question
            </Link>
        </div>
    );
};
