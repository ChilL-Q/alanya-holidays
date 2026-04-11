import React from 'react';
import { Search, Database, Plus } from 'lucide-react';

interface DirectoryToolbarProps {
    categories: string[];
    filterCategory: string;
    onFilterCategory: (cat: string) => void;
    searchQuery: string;
    onSearchQuery: (query: string) => void;
    showMigrateButton: boolean;
    onMigrate: () => void;
    onAddListing: () => void;
    hideCategories?: boolean;
}

export const DirectoryToolbar: React.FC<DirectoryToolbarProps> = ({
    categories, filterCategory, onFilterCategory, searchQuery, onSearchQuery, showMigrateButton, onMigrate, onAddListing, hideCategories = false
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            {!hideCategories && (
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto max-w-full md:max-w-xl scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onFilterCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterCategory === cat
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search directory..."
                        value={searchQuery}
                        onChange={(e) => onSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all dark:text-white"
                    />
                </div>

                {showMigrateButton && (
                    <button
                        onClick={onMigrate}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap"
                    >
                        <Database size={18} />
                        <span className="hidden sm:inline">Migrate Data</span>
                    </button>
                )}

                <button
                    onClick={onAddListing}
                    className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Listing</span>
                </button>
            </div>
        </div>
    );
};
