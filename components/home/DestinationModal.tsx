import React from 'react';
import { X, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="grid md:grid-cols-2 h-[80vh] md:h-auto">
                    {/* Image Side */}
                    <div className="relative h-64 md:h-full">
                        <img
                            src={data.image}
                            alt={data.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden"></div>
                        <div className="absolute bottom-4 left-4 text-white md:hidden">
                            <h2 className="text-2xl font-serif font-bold">{data.title}</h2>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="p-8 md:p-10 overflow-y-auto max-h-[calc(80vh-16rem)] md:max-h-[600px]">
                        <div className="hidden md:block mb-6">
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
            </div>
        </div>
    );
};
