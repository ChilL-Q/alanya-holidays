import React from 'react';
import { MapPin, Edit2, CheckCircle, Trash2, Home, ExternalLink, XCircle } from 'lucide-react';

interface PropertyTableProps {
    loading: boolean;
    properties: any[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onAction: (action: 'approve' | 'delete' | 'reject', id: number, title: string) => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
    loading, properties, onView, onEdit, onAction
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 pl-6 w-20">Image</th>
                            <th className="p-4">Property</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">Loading properties...</td>
                            </tr>
                        ) : properties.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">No properties found.</td>
                            </tr>
                        ) : (
                            properties.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800/50 overflow-hidden">
                                            {p.images && p.images[0] ? (
                                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Home size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{p.title}</div>
                                        <div className="text-xs text-slate-500">{p.type}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            <span className="truncate max-w-[150px]">{p.location}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                                        €{p.price_per_night}/night
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            p.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onView(p.id)}
                                                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg transition-colors"
                                                title="View Public Page"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(p.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {p.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => onAction('approve', p.id, p.title)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onAction('reject', p.id, p.title)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onAction('delete', p.id, p.title)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
