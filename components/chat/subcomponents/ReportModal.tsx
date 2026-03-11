import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    reportedId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, conversationId, reportedId }) => {
    const { user } = useAuth();
    const { submitReport } = useChat();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            const reason = formData.get('reason') as string;
            const description = formData.get('description') as string;

            if (user) {
                await submitReport({
                    reporter_id: user.id,
                    reported_id: reportedId,
                    conversation_id: conversationId,
                    reason,
                    description
                });
                toast.success('Report submitted successfully. We will investigate shortly.');
                onClose();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Report Issue</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Let us know what's wrong with this conversation.</p>

                <form data-testid="report-form" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
                            <select
                                name="reason"
                                data-testid="report-reason-select"
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                required
                            >
                                <option value="">Select a reason</option>
                                <option value="spam">Spam or unwanted messages</option>
                                <option value="inappropriate">Inappropriate behavior</option>
                                <option value="scam">Suspicious or scam attempt</option>
                                <option value="other">Other issue</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                data-testid="report-description"
                                rows={4}
                                placeholder="Please provide more details..."
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                                required
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-teal-600 dark:bg-cyan-600 text-white font-medium py-3 rounded-xl hover:bg-teal-700 dark:bg-cyan-600 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
