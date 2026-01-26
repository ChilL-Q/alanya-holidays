import React, { useState } from 'react';
import { Modal } from './Modal';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    requireReason?: boolean;
    reasonPlaceholder?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    isDestructive = false,
    requireReason = false,
    reasonPlaceholder = 'Please provide a reason...'
}) => {
    const [reason, setReason] = useState('');

    // We don't need manual Esc handling anymore as Modal handles it
    // But we need to keep handleConfirm logic

    // Modal component handles isOpen check if we place it inside
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requireReason && !reason.trim()) {
            return; // Don't submit if reason is required but empty
        }
        onConfirm(reason);
        setReason(''); // Reset
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="md"
            noPadding // We handle padding in our internal layout for header/footer
        // No title passed to Modal, we render custom header
        >
            <div className="flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start shrink-0">
                    <div className="flex gap-4">
                        {isDestructive && (
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                        )}
                        <div className="pr-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Close Button Absolute (retained functionality but inside Modal content) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Body (Scrollable if needed) */}
                <div className="p-6 overflow-y-auto">
                    {requireReason && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Reason
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                onKeyDown={(e) => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                        e.preventDefault();
                                        handleConfirm();
                                    }
                                }}
                                placeholder={reasonPlaceholder}
                                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none text-sm"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={requireReason && !reason.trim()}
                        className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-2
                            ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
                            }
                            ${(requireReason && !reason.trim()) ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
                        `}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
