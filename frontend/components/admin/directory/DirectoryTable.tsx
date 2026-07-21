import React from 'react';
import { Edit2, Trash2, MapPin, Image as ImageIcon } from 'lucide-react';
import { DirectoryListingDB } from '../../../types/models';

interface DirectoryTableProps {
    loading: boolean;
    listings: DirectoryListingDB[];
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
}

export const DirectoryTable: React.FC<DirectoryTableProps> = ({ loading, listings, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto pb-2">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 pl-6 w-20">Image</th>
                            <th className="p-4">Business</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">Loading directory...</td>
                            </tr>
                        ) : listings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">No listings found.</td>
                            </tr>
                        ) : (
                            listings.map((listing) => (
                                <tr key={listing.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800/50 overflow-hidden relative">
                                            {listing.gallery && listing.gallery[0] ? (
                                                <img src={listing.gallery[0]} alt={listing.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                            {listing.gallery && listing.gallery.length > 1 && (
                                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                                                    +{listing.gallery.length - 1}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            {listing.name}
                                            {listing.is_verified && (
                                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Verified</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                            {listing.website && <span className="truncate max-w-[120px]">{listing.website.replace(/^https?:\/\//, '')}</span>}
                                            {listing.whatsapp && <span>{listing.whatsapp}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium">
                                            {listing.category_id}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <MapPin size={14} className="text-slate-400" />
                                            <span className="truncate max-w-[150px]">{listing.location}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {listing.is_featured ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                                                ★ Featured
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                Standard
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(listing.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(listing.id, listing.name)}
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
