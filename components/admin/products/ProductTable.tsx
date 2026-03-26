import React from 'react';
import { Edit2, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../../context/CurrencyContext';

interface ProductTableProps {
    loading: boolean;
    products: any[];
    onDelete: (id: string, title: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
    loading, products, onDelete
}) => {
    const navigate = useNavigate();
    const { formatPrice, convertPrice } = useCurrency();

    return (
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
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">No products found.</td>
                            </tr>
                        ) : (
                            products.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800/50 overflow-hidden">
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
                                                onClick={() => onDelete(p.id, p.title)}
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
