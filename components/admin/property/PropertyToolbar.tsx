import React from 'react';
import { Search } from 'lucide-react';

interface PropertyToolbarProps {
    filterStatus: string;
    onFilterStatus: (status: string) => void;
    filterType: string;
    onFilterType: (type: string) => void;
    searchQuery: string;
    onSearchQuery: (query: string) => void;
}

export const PropertyToolbar: React.FC<PropertyToolbarProps> = ({
    filterStatus, onFilterStatus, filterType, onFilterType, searchQuery, onSearchQuery
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => onFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    {['all', 'villa', 'apartment'].map(type => (
                        <button
                            key={type}
                            onClick={() => onFilterType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === type
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => onSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all dark:text-white/80"
                />
            </div>
        </div>
    );
};
