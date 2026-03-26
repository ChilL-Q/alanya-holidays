import React from 'react';
import { Search } from 'lucide-react';

interface HostBookingToolbarProps {
    filterStatus: string;
    onFilterStatus: (status: string) => void;
    searchTerm: string;
    onSearchTerm: (term: string) => void;
}

export const HostBookingToolbar: React.FC<HostBookingToolbarProps> = ({
    filterStatus, onFilterStatus, searchTerm, onSearchTerm
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm w-full md:w-auto">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => onFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filterStatus === status
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search guests, properties, or ID..."
                    value={searchTerm}
                    onChange={(e) => onSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm outline-none dark:text-white"
                />
            </div>
        </div>
    );
};
