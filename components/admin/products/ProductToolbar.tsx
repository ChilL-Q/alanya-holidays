import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductToolbarProps {
    filterCategory: string;
    onFilterCategory: (category: string) => void;
    searchQuery: string;
    onSearchQuery: (query: string) => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
    filterCategory, onFilterCategory, searchQuery, onSearchQuery
}) => {
    const navigate = useNavigate();
    const categories = ['all', 'souvenir', 'textile', 'food', 'jewelry', 'art'];

    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto max-w-full">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => onFilterCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterCategory === cat
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => onSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all dark:text-white"
                    />
                </div>

                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap shadow-sm"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add Product</span>
                </button>
            </div>
        </div>
    );
};
