import React, { useEffect, useState } from 'react';
import { supabase } from '../../api-services/supabase';
import { createPortal } from 'react-dom';
import { Flag, CheckCircle, Clock, XCircle, MessageSquare, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    conversation_id: string;
    reason: string;
    description: string;
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    created_at: string;
    reporter?: { full_name: string; email: string };
    reported?: { full_name: string; email: string };
}

export const ReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<{ id: string; rect: DOMRect; status: string; conversation_id: string } | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_reports')
                .select(`
                    *,
                    reporter:profiles!chat_reports_reporter_id_fkey(full_name, email),
                    reported:profiles!chat_reports_reported_id_fkey(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            // @ts-ignore
            if (error?.message) console.error('Error details:', error.message);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('chat_reports')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast.success('Status updated');
            fetchReports();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'investigating': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'dismissed': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading reports...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flag className="text-teal-600" />
                    Reports & Issues
                </h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4">Reporter</th>
                                <th className="px-6 py-4">Reported User</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 dark:text-white capitalize">{report.reason}</div>
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs truncate" title={report.description}>
                                            {report.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 dark:text-white font-medium">{report.reporter?.full_name || 'Unknown'}</div>
                                        <div className="text-slate-500 text-xs">{report.reporter?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 dark:text-white font-medium">{report.reported?.full_name || 'System/Unknown'}</div>
                                        <div className="text-slate-500 text-xs">{report.reported?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {format(new Date(report.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setActiveMenu({
                                                        id: report.id,
                                                        rect,
                                                        status: report.status,
                                                        conversation_id: report.conversation_id
                                                    });
                                                }}
                                                className={`p-2 rounded-full transition-colors ${activeMenu?.id === report.id ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Flag size={32} className="text-slate-300" />
                                            <p>No reports found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Portal Menu */}
            {activeMenu && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[50]"
                        onClick={() => setActiveMenu(null)}
                    />
                    <div
                        className="fixed w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-[51] animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                        style={{
                            top: `${activeMenu.rect.bottom + 5}px`,
                            left: `${activeMenu.rect.right - 192}px` // Align right edge
                        }}
                    >
                        <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800/50 mb-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Actions</p>
                        </div>

                        {activeMenu.status !== 'resolved' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(activeMenu.id, 'resolved');
                                    setActiveMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                            >
                                <CheckCircle size={16} className="text-green-600" />
                                <span>Mark Resolved</span>
                            </button>
                        )}

                        {activeMenu.status !== 'investigating' && activeMenu.status !== 'resolved' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(activeMenu.id, 'investigating');
                                    setActiveMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                            >
                                <Clock size={16} className="text-blue-600" />
                                <span>Investigate</span>
                            </button>
                        )}

                        {activeMenu.status !== 'dismissed' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(activeMenu.id, 'dismissed');
                                    setActiveMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                            >
                                <XCircle size={16} className="text-slate-400" />
                                <span>Dismiss</span>
                            </button>
                        )}

                        <div className="border-t border-slate-50 dark:border-slate-800/50 my-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (activeMenu.conversation_id) {
                                    navigate(`/inbox?conversationId=${activeMenu.conversation_id}`);
                                } else {
                                    toast.error('No conversation linked to this report');
                                }
                                setActiveMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5"
                        >
                            <MessageSquare size={16} className="text-teal-600" />
                            <span>View Chat Context</span>
                        </button>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
