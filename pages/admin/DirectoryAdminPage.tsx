import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../api-services';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DirectoryListingDB, ListingClaimDB } from '../../types/models';
import { MOCK_DIRECTORY_DATA } from '../../data/directoryData';
import { DirectoryToolbar } from '../../components/admin/directory/DirectoryToolbar';
import { DirectoryTable } from '../../components/admin/directory/DirectoryTable';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { CategoryImagesPanel } from '../../components/admin/directory/CategoryImagesPanel';

type AdminTab = 'approved' | 'pending' | 'rejected' | 'claims' | 'images';

export const DirectoryAdminPage: React.FC<{ defaultCategory?: string }> = ({ defaultCategory }) => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [pendingListings, setPendingListings] = useState<DirectoryListingDB[]>([]);
    const [rejectedListings, setRejectedListings] = useState<DirectoryListingDB[]>([]);
    const [claims, setClaims] = useState<ListingClaimDB[]>([]);
    const [activeTab, setActiveTab] = useState<AdminTab>('approved');
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>(defaultCategory || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [rejectState, setRejectState] = useState<{ id: string; reason: string } | null>(null);
    const [rejectClaimState, setRejectClaimState] = useState<{ id: string; reason: string } | null>(null);

    const isCategoryLocked = !!defaultCategory;

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

    const loadClaims = useCallback(async () => {
        try {
            const claimsList = await db.getListingClaims();
            setClaims(claimsList);
        } catch (e) {
            console.error('Failed to load claims', e);
        }
    }, []);

    const loadListings = useCallback(async () => {
        setLoading(true);
        try {
            const category = isCategoryLocked ? defaultCategory : undefined;
            const [approved, pending, rejected, claimsList] = await Promise.all([
                db.getDirectoryListingsByStatus('approved', category),
                db.getPendingDirectoryListings(),
                db.getDirectoryListingsByStatus('rejected', category),
                db.getListingClaims(),
            ]);
            setListings(approved);
            setPendingListings(pending);
            setRejectedListings(rejected);
            setClaims(claimsList);
        } catch (e) {
            console.error('Failed to load listings', e);
        } finally {
            setLoading(false);
        }
    }, [isCategoryLocked, defaultCategory]);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const handleApprove = async (id: string) => {
        try {
            await db.approveDirectoryListing(id);
            toast.success('Listing approved and published');
            await loadListings();
        } catch (e: unknown) {
            toast.error(`Failed to approve: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleRejectSubmit = async (id: string) => {
        if (!rejectState?.reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        try {
            await db.rejectDirectoryListing(id, rejectState.reason.trim());
            toast.success('Listing rejected');
            setRejectState(null);
            await loadListings();
        } catch (e: unknown) {
            toast.error(`Failed to reject: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleApproveClaim = async (claimId: string) => {
        try {
            await db.approveListingClaim(claimId);
            toast.success('Claim approved');
            await loadClaims();
        } catch (e: unknown) {
            toast.error(`Failed to approve claim: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const handleRejectClaimSubmit = async (claimId: string) => {
        if (!rejectClaimState?.reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        try {
            await db.rejectListingClaim(claimId, rejectClaimState.reason.trim());
            toast.success('Claim rejected');
            setRejectClaimState(null);
            await loadClaims();
        } catch (e: unknown) {
            toast.error(`Failed to reject claim: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
            await loadListings();
        } catch (e: unknown) {
            console.error(e);
            toast.error(`Failed to delete listing: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setModalConfig({ ...modalConfig, isOpen: false });
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
            toast.success(`Successfully migrated ${count} listings to Supabase!`);
            loadListings();
        } catch (error: unknown) {
            console.error(error);
            toast.error('Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = listings.filter(l => {
        const matchesCategory = isCategoryLocked || filterCategory === 'all' || l.category_id === filterCategory;
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ['all', 'medical', 'accommodations', 'villas', 'apartments', 'tours', 'transport', 'restaurants', 'cafes', 'real-estate', 'visa', 'shopping', 'nature', 'spa-hamam', 'hair-beauty'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Directory Management</h1>
                    <p className="text-slate-500 mt-1">Manage all listings, categories, and business entries</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                {([
                    { key: 'approved', label: 'Approved', icon: CheckCircle, count: listings.length },
                    { key: 'pending', label: 'Pending', icon: Clock, count: pendingListings.length },
                    { key: 'rejected', label: 'Rejected', icon: XCircle, count: rejectedListings.length },
                    { key: 'claims', label: 'Claims', icon: CheckCircle, count: claims.length },
                    { key: 'images', label: 'Category Images', icon: ImageIcon, count: 0 },
                ] as const).map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === key
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon size={15} />
                        {label}
                        {count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                key === 'pending'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-slate-500 text-sm">Loading...</p>
                    ) : pendingListings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Clock size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No pending submissions</p>
                        </div>
                    ) : pendingListings.map(listing => (
                        <div key={listing.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{listing.name}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{listing.category_id} · {listing.location}</p>
                                    {listing.short_description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{listing.short_description}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-2">
                                        Submitted {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                                {listing.gallery?.[0] && (
                                    <img src={listing.gallery[0]} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
                                )}
                            </div>

                            {rejectState?.id === listing.id ? (
                                <div className="mt-4 space-y-2">
                                    <textarea
                                        name="rejection-reason"
                                        value={rejectState.reason}
                                        onChange={e => setRejectState({ id: listing.id, reason: e.target.value })}
                                        placeholder="Rejection reason (sent to the owner)..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-red-400 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectSubmit(listing.id)}
                                            className="px-4 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                        >
                                            Confirm Reject
                                        </button>
                                        <button
                                            onClick={() => setRejectState(null)}
                                            className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleApprove(listing.id)}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                    >
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectState({ id: listing.id, reason: '' })}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/directory/${listing.id}`)}
                                        className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        View
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'approved' && (
                <>
                    <DirectoryToolbar
                        categories={categories}
                        filterCategory={filterCategory}
                        onFilterCategory={setFilterCategory}
                        searchQuery={searchQuery}
                        onSearchQuery={setSearchQuery}
                        showMigrateButton={listings.length === 0}
                        onMigrate={handleMigrateMockData}
                        onAddListing={() => navigate('/admin/directory/new')}
                        hideCategories={isCategoryLocked}
                    />
                    <DirectoryTable
                        loading={loading}
                        listings={filteredListings}
                        onEdit={(id) => navigate(`/admin/directory/${id}`)}
                        onDelete={(id, name) => openActionModal('delete', id, name)}
                    />
                </>
            )}

            {activeTab === 'rejected' && (
                <DirectoryTable
                    loading={loading}
                    listings={rejectedListings}
                    onEdit={(id) => navigate(`/admin/directory/${id}`)}
                    onDelete={(id, name) => openActionModal('delete', id, name)}
                />
            )}

            {activeTab === 'claims' && (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-slate-500 text-sm">Loading...</p>
                    ) : claims.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No listing claims</p>
                        </div>
                    ) : claims.map(claim => (
                        <div key={claim.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{claim.business_name}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Claimed by: <span className="font-mono text-xs">{claim.email}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {claim.email_verified ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                ✓ Email Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                ○ Pending Email
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                            {claim.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Submitted {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>

                            {rejectClaimState?.id === claim.id ? (
                                <div className="mt-4 space-y-2">
                                    <textarea
                                        value={rejectClaimState.reason}
                                        onChange={e => setRejectClaimState({ id: claim.id, reason: e.target.value })}
                                        placeholder="Rejection reason (sent to the claimant)..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-red-400 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectClaimSubmit(claim.id)}
                                            className="px-4 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                        >
                                            Confirm Reject
                                        </button>
                                        <button
                                            onClick={() => setRejectClaimState(null)}
                                            className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 mt-4">
                                    {claim.status === 'pending' && claim.email_verified && (
                                        <>
                                            <button
                                                onClick={() => handleApproveClaim(claim.id)}
                                                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                            >
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectClaimState({ id: claim.id, reason: '' })}
                                                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                    {claim.status === 'rejected' && claim.rejection_reason && (
                                        <div className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <p className="font-semibold text-red-600 dark:text-red-400">Rejection reason:</p>
                                            <p>{claim.rejection_reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'images' && <CategoryImagesPanel />}

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
