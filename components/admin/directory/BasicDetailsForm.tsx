import React from 'react';
import { Store } from 'lucide-react';

interface BasicDetailsFormProps {
    name: string;
    description: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const BasicDetailsForm: React.FC<BasicDetailsFormProps> = ({ name, description, onChange }) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Store size={20} className="text-teal-500 dark:text-cyan-400" />
                Business Details
            </h2>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="directory-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
                        <input
                            id="directory-name"
                            type="text"
                            name="name"
                            required
                            value={name}
                            onChange={onChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                            placeholder="e.g. Alanya Premium Dental"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="directory-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Description *</label>
                        <textarea
                            id="directory-description"
                            name="short_description"
                            required
                            value={description}
                            onChange={onChange}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                            placeholder="A brief overview of the business..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
