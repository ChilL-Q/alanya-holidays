import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { Search, Edit2, Trash2, ShoppingBag, Plus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useCurrency } from '../../context/CurrencyContext';

export const ProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { formatPrice, convertPrice } = useCurrency();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
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

            // Refresh
            loadProducts();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: any) {
            console.error(e);
            alert(`Failed to delete product: ${e.message || 'Unknown error'}`);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ['all', 'souvenir', 'textile', 'food', 'jewelry', 'art'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto max-w-full">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/admin/products/new')}
                        className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white px-4 py-2 rounded-xl transition-colors font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Add Product</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 pl-6 w-20">Image</th>
                                <th className="p-4">Product</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4">Artisan</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading products...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">No products found.</td>
                                </tr>
                            ) : (
                                filteredProducts.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden">
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <ShoppingBag size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{p.title}</div>
                                            <div className="text-xs text-slate-500 max-w-[200px] truncate">{p.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs capitalize">
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            {formatPrice(convertPrice(p.price, 'EUR'))}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {p.stock}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {p.seller?.full_name || 'Unknown'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/products/${p.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openActionModal('delete', p.id, p.title)}
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
