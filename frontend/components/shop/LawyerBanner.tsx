import React from 'react';
import { Scale } from 'lucide-react';

interface LawyerBannerProps {
    onOpen: () => void;
}

export const LawyerBanner: React.FC<LawyerBannerProps> = ({ onOpen }) => {
    return (
        <div className="w-full my-8 p-8 bg-gradient-to-r from-slate-50 to-amber-50 dark:from-slate-900/80 dark:to-slate-800/80 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Scale size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            Need Legal Help in Turkey?
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg">
                            Buying property, resolving disputes, or starting a business? Connect with a trusted English-speaking lawyer specializing in Turkish law.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onOpen}
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    Connect with a Lawyer
                </button>
            </div>
        </div>
    );
};
