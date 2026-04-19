import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api-services';
import { chatService } from '../../api-services/api/chat';
import { toast } from 'react-hot-toast';
import { Check, X, MessageSquare, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminBlogSubmissionsPage: React.FC = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await db.getBlogSubmissions();
            setSubmissions(data);
        } catch {
            toast.error('Failed to load submissions');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (id: string) => {
        try {
            await db.approveBlogSubmission(id);
            toast.success('Submission approved and published');
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Rejection reason (will be sent to author):');
        if (reason === null) return; // cancelled
        try {
            await db.rejectBlogSubmission(id, reason.trim());
            toast.success('Submission rejected');
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleMessageAuthor = async (authorId: string) => {
        try {
            const conversationId = await chatService.createDirectConversation(authorId);
            navigate(`/messages?conversation=${conversationId}`);
        } catch (e: any) {
            toast.error(e.message || 'Failed to open chat');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog Submissions</h1>

            {submissions.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No submissions yet.</p>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th className="p-4">Title</th>
                                <th className="p-4">Author</th>
                                <th className="p-4">Payment Details</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((sub) => (
                                <React.Fragment key={sub.id}>
                                    <tr className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <button
                                                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                                                className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 text-left"
                                            >
                                                {expandedId === sub.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {sub.title}
                                            </button>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {sub.user?.email ?? '—'}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {sub.payment_details ?? <span className="text-slate-400 italic">not provided</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                sub.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                sub.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {sub.status === 'pending_review' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(sub.id)}
                                                            title="Approve"
                                                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(sub.id)}
                                                            title="Reject"
                                                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {sub.user_id && (
                                                    <button
                                                        onClick={() => handleMessageAuthor(sub.user_id)}
                                                        title="Message author"
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === sub.id && (
                                        <tr className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                            <td colSpan={5} className="p-4">
                                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                                                    {sub.content}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
