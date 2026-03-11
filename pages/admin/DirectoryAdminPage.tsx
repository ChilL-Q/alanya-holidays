import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { Search, Edit2, Trash2, MapPin, Plus, List, Image as ImageIcon, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DirectoryListingDB } from '../../types/models';
import { MOCK_DIRECTORY_DATA } from '../../data/directoryData';

export const DirectoryAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'delete' | null;
        itemId: string | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: null,
        itemId: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        setLoading(true);
        try {
            const data = await db.getDirectoryListings();
            setListings(data || []);
        } catch (e) {
            console.error('Failed to load listings', e);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (action: 'delete', id: string, title: string) => {
        setModalConfig({
            isOpen: true,
            type: action,
            itemId: id,
            title: 'Delete Directory Listing',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`
        });
    };

    const handleConfirmAction = async () => {
        const { type, itemId } = modalConfig;
        if (!type || !itemId) return;

        try {
            if (type === 'delete') {
                await db.deleteDirectoryListing(itemId);
            }
            loadListings();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: any) {
            console.error(e);
            alert(`Failed to delete listing: ${e.message || 'Unknown error'}`);
        }
    };

    const handleMigrateMockData = async () => {
        if (!window.confirm("Are you sure? This will insert all local mock data into Supabase (useful for initial setup).")) return;
        
        setLoading(true);
        try {
            let count = 0;
            for (const item of MOCK_DIRECTORY_DATA) {
                await db.createDirectoryListing({
                    name: item.name,
                    category_id: item.categoryId,
                    short_description: item.shortDescription,
                    location: item.location,
                    is_featured: item.isFeatured || false,
                    is_verified: item.isVerified || false,
                    website: item.website || undefined,
                    whatsapp: item.whatsapp || undefined,
                    gallery: item.gallery || [],
                    reviews_average: item.reviews?.average || 0,
                    reviews_count: item.reviews?.count || 0,
                    price_level: item.priceLevel || 2,
                    languages_spoken: item.languagesSpoken || [],
                    certifications: item.certifications || []
                });
                count++;
            }
            alert(`Successfully migrated ${count} listings to Supabase!`);
            loadListings();
        } catch (error: any) {
            console.error(error);
            alert('Migration failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = listings.filter(l => {
        const matchesCategory = filterCategory === 'all' || l.category_id === filterCategory;
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              l.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ['all', 'medical', 'accommodations', 'tours', 'transport', 'restaurants', 'real-estate', 'visa', 'shopping', 'nature', 'spa-hamam', 'hair-beauty'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Directory Management</h1>
                    <p className="text-slate-500 mt-1">Manage all listings, categories, and business entries</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto max-w-full md:max-w-xl scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterCategory === cat
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {cat === 'all' ? 'All' : cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search directory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                        />
                    </div>

                    {listings.length === 0 && (
                        <button
                            onClick={handleMigrateMockData}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap"
                        >
                            <Database size={18} />
                            <span className="hidden sm:inline">Migrate Data</span>
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/admin/directory/new')}
                        className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Listing</span>
                    </button>
                </div>
            </div>

            {/* Table */}
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
                            ) : filteredListings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">No listings found.</td>
                                </tr>
                            ) : (
                                filteredListings.map((listing) => (
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
                                                    onClick={() => navigate(`/admin/directory/${listing.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openActionModal('delete', listing.id, listing.name)}
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

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmLabel="Delete"
                isDestructive={true}
            />
        </div>
    );
};
