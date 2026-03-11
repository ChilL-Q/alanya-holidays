import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
    noPadding?: boolean;
    hideCloseButton?: boolean;
    lockBodyScroll?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    maxWidth = 'md',
    noPadding = false,
    hideCloseButton = false,
    lockBodyScroll = true
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            if (lockBodyScroll) {
                document.body.style.overflow = 'hidden';
            }
            window.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose, lockBodyScroll]);

    if (!isOpen || !mounted || typeof document === 'undefined') return null;

    return createPortal(
        <div className="relative z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Scrollable Container */}
            <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={onClose}>
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                    {/* Modal Panel */}
                    <div
                        className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all w-full max-w-${maxWidth} animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800/50`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Conditional Standard Header */}
                        {title && (
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                                <h3 className="font-serif text-xl font-semibold text-slate-900 dark:text-white" id="modal-title">
                                    {title}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* Floating Close Button for Untitled Modals */}
                        {!title && !hideCloseButton && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors shadow-sm"
                            >
                                <X size={24} />
                            </button>
                        )}

                        {/* Content */}
                        <div className={noPadding ? '' : 'p-6'}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
