import React from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        image: string;
        description: string;
    } | null;
}

export const DestinationModal: React.FC<ModalProps> = ({ isOpen, onClose, data }) => {
    // Modal component handles null checks for isOpen/data inside usually, 
    // but Modal.tsx checks isOpen. We should check data here.
    if (!data) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="4xl"
            noPadding
            hideCloseButton // We implement our own visible one
            lockBodyScroll={false}
        >
            <div className="grid md:grid-cols-2">
                {/* Image Side */}
                <div className="relative h-64 md:h-auto min-h-[300px]">
                    <img
                        src={data.image}
                        alt={data.title}
                        className="absolute inset-0 w-full h-full object-cover text-slate-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden"></div>
                    <div className="absolute bottom-4 left-4 text-white md:hidden">
                        <h2 className="text-2xl font-serif font-bold">{data.title}</h2>
                    </div>
                </div>

                {/* Content Side */}
                <div className="p-8 md:p-10 relative">
                    {/* Manual Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-20"
                    >
                        {/* Use X icon from lucide-react (make sure it's imported if not already) */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-x"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>

                    <div className="hidden md:block mb-6 pr-8">
                        <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">{data.title}</h2>
                        <div className="h-1 w-20 bg-accent rounded-full"></div>
                    </div>

                    <div className="prose dark:prose-invert prose-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="whitespace-pre-line">{data.description}</p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-accent font-medium">
                            <MapPin size={20} />
                            <span>Alanya, Turkey</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
