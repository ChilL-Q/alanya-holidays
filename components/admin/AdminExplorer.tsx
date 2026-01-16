import React, { useState } from 'react';
import { ChevronRight, Folder, FileText, Home, Edit2, ArrowLeft, Grid, List, Search } from 'lucide-react';

export interface ExplorerItem {
    id: string;
    label: string;
    type: 'folder' | 'file';
    image?: string;
    count?: number;
    subtext?: string;
    onClick?: () => void;
    color?: string; // e.g., 'bg-blue-500'
}

interface AdminExplorerProps {
    items: ExplorerItem[];
    breadcrumbs: string[];
    onBreadcrumbClick: (index: number) => Promise<void> | void;
    title?: string;
    metadata?: {
        title: string;
        description?: string;
        image?: string;
        onEdit?: () => void;
    };
    children?: React.ReactNode;
    loading?: boolean;
    actions?: React.ReactNode;
}

export const AdminExplorer: React.FC<AdminExplorerProps> = ({
    items,
    breadcrumbs,
    onBreadcrumbClick,
    title,
    metadata,
    children,
    loading,
    actions
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = items?.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-500 overflow-x-auto pb-2 noscroll">
                    <button
                        onClick={() => onBreadcrumbClick(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        <Home size={18} />
                    </button>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <ChevronRight size={16} className="text-slate-300" />
                            <button
                                onClick={() => onBreadcrumbClick(index)}
                                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-medium ${index === breadcrumbs.length - 1
                                    ? 'text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {crumb}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex-1 mr-8">
                        {(title || (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1])) && (
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                                {title || breadcrumbs[breadcrumbs.length - 1]}
                            </h1>
                        )}

                        {/* Search / Filter Bar */}
                        <div className="relative max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {actions}
                    </div>
                </div>
            </div>

            {/* Metadata Hero Card */}
            {metadata && !searchQuery && (
                <div className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 dark:bg-teal-900/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-105" />

                    <div className="relative flex flex-col md:flex-row gap-8 z-10">
                        {metadata.image && (
                            <div className="w-full md:w-80 aspect-video bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-md">
                                <img src={metadata.image} alt={metadata.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-3">{metadata.title}</h2>
                                    <div className="w-12 h-1 bg-teal-500 rounded-full mb-4" />
                                </div>
                                {metadata.onEdit && (
                                    <button
                                        onClick={metadata.onEdit}
                                        className="p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 hover:shadow-lg rounded-xl transition-all"
                                        title="Edit Details"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed max-w-2xl">
                                {metadata.description || 'No description available for this model.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading contents...</p>
                </div>
            ) : (
                <>
                    {/* Items Grid */}
                    {items && items.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {filteredItems.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={item.onClick}
                                    className="group relative flex flex-col p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-left transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1 overflow-hidden"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Card Gradient bg on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative mb-4 w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${item.color || 'bg-slate-100 dark:bg-slate-600 text-slate-400 dark:text-slate-300'} group-hover:scale-110 duration-300`}>
                                                {item.type === 'folder' ? <Folder size={32} /> : <FileText size={32} />}
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors truncate">
                                            {item.label}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {item.count !== undefined ? `${item.count} items` : item.subtext || 'Folder'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Leaf View (Table etc) */}
                    {children && (
                        <div className="mt-8">
                            {children}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
