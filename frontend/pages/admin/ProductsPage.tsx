import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { ProductToolbar } from '../../components/admin/products/ProductToolbar';
import { ProductTable } from '../../components/admin/products/ProductTable';

export const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
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
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await db.getProducts();
            setProducts(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (action: 'delete', id: string, title: string) => {
        setModalConfig({
            isOpen: true,
            type: action,
            itemId: id,
            title: 'Delete Product',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`
        });
    };

    const handleConfirmAction = async () => {
        const { type, itemId } = modalConfig;
        if (!type || !itemId) return;

        try {
            if (type === 'delete') {
                await db.deleteProduct(itemId);
            }

            loadProducts();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: unknown) {
            console.error(e);
            toast.error(`Failed to delete product: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ProductToolbar 
                filterCategory={filterCategory} 
                onFilterCategory={setFilterCategory} 
                searchQuery={searchQuery} 
                onSearchQuery={setSearchQuery} 
            />

            <ProductTable 
                loading={loading} 
                products={filteredProducts} 
                onDelete={(id, title) => openActionModal('delete', id, title)} 
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
