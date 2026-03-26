import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PropertyHospitalityGuide: React.FC = () => {
    return (
        <div className="bg-teal-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-teal-100 dark:border-slate-700/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-slate-800/50 flex items-center justify-center text-teal-600 dark:text-cyan-400 shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hospitality Guide</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Detailed guide containing check-in instructions, Wi-Fi passwords, and house rules.
                    </p>
                </div>
            </div>
        </div>
    );
};
