import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    // Handle Escape key
    useEffect(() => {
        if (isOpen) {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requireReason && !reason.trim()) {
            return; // Don't submit if reason is required but empty
        }
        onConfirm(reason);
        setReason(''); // Reset
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start shrink-0">
                    <div className="flex gap-4">
                        {isDestructive && (
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Close Button Absolute (like Car Modal) */}
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
                                placeholder={reasonPlaceholder}
                                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none text-sm"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
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
        </div>,
        document.body
    );
};
