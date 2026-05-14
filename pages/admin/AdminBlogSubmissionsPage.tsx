import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api-services';
import { chatService } from '../../api-services/api/chat';
import { toast } from 'react-hot-toast';
import { Check, X, MessageSquare, Loader2, ChevronDown, ChevronUp, PenLine, Trash2, Eye, EyeOff, Star } from 'lucide-react';

export const AdminBlogSubmissionsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'submissions' | 'posts'>('submissions');
    
    // Submissions state
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
    
    // Posts state
    const [posts, setPosts] = useState<any[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'submissions') {
                const data = await db.getBlogSubmissions();
                setSubmissions(data);
            } else {
                const { data } = await db.getBlogPosts({ limit: 100 });
                setPosts(data);
            }
        } catch {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Submissions Actions
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
        if (reason === null) return;
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

    // Posts Actions
    const handleDeletePost = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
        try {
            await db.deleteBlogPost(id);
            toast.success('Post deleted');
            fetchData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete post');
        }
    };

    const handleTogglePostVisibility = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await db.updateBlogPost(id, { status: newStatus as any });
            toast.success(`Post marked as ${newStatus}`);
            fetchData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update post status');
        }
    };

    const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
        try {
            await db.updateBlogPost(id, { is_featured: !isFeatured });
            toast.success(!isFeatured ? 'Post featured on homepage' : 'Post unfeatured');
            fetchData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update featured status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog Management</h1>
                <button
                    onClick={() => navigate('/admin/blog-submissions/new')}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold"
                >
                    <PenLine size={18} />
                    Add Blog Post
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'submissions'
                            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setActiveTab('submissions')}
                >
                    Submissions
                </button>
                <button
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'posts'
                            ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                    onClick={() => setActiveTab('posts')}
                >
                    All Posts
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="animate-spin text-teal-500" size={32} />
                </div>
            ) : activeTab === 'submissions' ? (
                submissions.length === 0 ? (
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
                                                    onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}
                                                    className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 text-left"
                                                >
                                                    {expandedSubId === sub.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                                        {expandedSubId === sub.id && (
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
                )
            ) : (
                posts.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No blog posts yet.</p>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                <tr>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Author</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Featured</th>
                                    <th className="p-4">Views</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            {post.title}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {post.author?.full_name ?? '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                post.status === 'archived' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                                            }`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {post.is_featured ? (
                                                <span className="text-amber-500 text-xs font-semibold">★ Featured</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">
                                            {post.views}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                                                    title={post.is_featured ? 'Remove from homepage' : 'Feature on homepage'}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        post.is_featured 
                                                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                                                            : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <Star size={16} fill={post.is_featured ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    onClick={() => handleTogglePostVisibility(post.id, post.status)}
                                                    title={post.status === 'published' ? 'Hide post (Draft)' : 'Publish post'}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    {post.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    title="Delete"
                                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};
