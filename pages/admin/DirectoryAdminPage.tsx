import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DirectoryListingDB } from '../../types/models';
import { MOCK_DIRECTORY_DATA } from '../../data/directoryData';
import { DirectoryToolbar } from '../../components/admin/directory/DirectoryToolbar';
import { DirectoryTable } from '../../components/admin/directory/DirectoryTable';

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

            <DirectoryToolbar
                categories={categories}
                filterCategory={filterCategory}
                onFilterCategory={setFilterCategory}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
                showMigrateButton={listings.length === 0}
                onMigrate={handleMigrateMockData}
                onAddListing={() => navigate('/admin/directory/new')}
            />

            <DirectoryTable
                loading={loading}
                listings={filteredListings}
                onEdit={(id) => navigate(`/admin/directory/${id}`)}
                onDelete={(id, name) => openActionModal('delete', id, name)}
            />

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
