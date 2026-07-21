import React from 'react';
import { Calendar, Search } from 'lucide-react';

interface BookingToolbarProps {
    filterStatus: string;
    onFilterStatus: (status: string) => void;
    searchQuery: string;
    onSearchQuery: (query: string) => void;
    dateRange: { start: string; end: string };
    onDateRange: (range: { start: string; end: string }) => void;
}

export const BookingToolbar: React.FC<BookingToolbarProps> = ({
    filterStatus, onFilterStatus, searchQuery, onSearchQuery, dateRange, onDateRange
}) => {
    return (
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="flex overflow-x-auto gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full xl:w-auto no-scrollbar">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => onFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl px-3 py-2">
                    <Calendar size={16} className="text-slate-400" />
                    <input
                        id="admin-bookings-date-from"
                        name="admin-bookings-date-from"
                        type="date"
                        autoComplete="off"
                        aria-label="Filter bookings from date"
                        className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-32"
                        value={dateRange.start}
                        onChange={e => onDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        id="admin-bookings-date-to"
                        name="admin-bookings-date-to"
                        type="date"
                        autoComplete="off"
                        aria-label="Filter bookings to date"
                        className="bg-transparent text-sm outline-none text-slate-600 dark:text-slate-300 w-32"
                        value={dateRange.end}
                        onChange={e => onDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        id="admin-bookings-search"
                        name="admin-bookings-search"
                        type="text"
                        autoComplete="off"
                        aria-label="Search bookings by user, item or ID"
                        placeholder="Search user, item, ID..."
                        value={searchQuery}
                        onChange={(e) => onSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
        </div>
    );
};
