import React from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';

interface DetailsFeaturesFormProps {
    languages: string[];
    certifications: string[];
    onArrayChange: (index: number, value: string, type: 'language' | 'certification') => void;
    onAddArrayItem: (type: 'language' | 'certification') => void;
    onRemoveArrayItem: (index: number, type: 'language' | 'certification') => void;
}

export const DetailsFeaturesForm: React.FC<DetailsFeaturesFormProps> = ({
    languages, certifications, onArrayChange, onAddArrayItem, onRemoveArrayItem
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-teal-500 dark:text-cyan-400" />
                Details & Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages Spoken</label>
                    <div className="space-y-2">
                        {languages.map((lang, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={lang}
                                    onChange={(e) => onArrayChange(idx, e.target.value, 'language')}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white text-sm"
                                    placeholder="e.g. English"
                                />
                                {languages.length > 1 && (
                                    <button type="button" onClick={() => onRemoveArrayItem(idx, 'language')} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => onAddArrayItem('language')} className="text-sm text-teal-600 dark:text-cyan-400 font-medium hover:text-teal-700 dark:text-cyan-400">
                            + Add Language
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Certifications</label>
                    <div className="space-y-2">
                        {certifications.map((cert, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={cert}
                                    onChange={(e) => onArrayChange(idx, e.target.value, 'certification')}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white text-sm"
                                    placeholder="e.g. ISO 9001"
                                />
                                {certifications.length > 1 && (
                                    <button type="button" onClick={() => onRemoveArrayItem(idx, 'certification')} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => onAddArrayItem('certification')} className="text-sm text-teal-600 dark:text-cyan-400 font-medium hover:text-teal-700 dark:text-cyan-400">
                            + Add Certification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
