import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { ProductVariant } from '../../../types/models';
import { productsService } from '../../../api-services/api/products';
import toast from 'react-hot-toast';

interface ProductVariantsFormProps {
    productId: string | undefined;
}

export const ProductVariantsForm: React.FC<ProductVariantsFormProps> = ({ productId }) => {
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ size_label: string; price: string; stock: string; sku: string }>({
        size_label: '',
        price: '',
        stock: '',
        sku: '',
    });
    const [adding, setAdding] = useState(false);
    const [newForm, setNewForm] = useState<{ size_label: string; price: string; stock: string; sku: string }>({
        size_label: '',
        price: '',
        stock: '',
        sku: '',
    });

    // Load variants when productId is available
    useEffect(() => {
        if (!productId) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await productsService.getProductVariants(productId);
                if (!cancelled) setVariants(data);
            } catch {
                // Silently fail
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [productId]);

    const startEdit = (variant: ProductVariant) => {
        setEditingId(variant.id);
        setEditForm({
            size_label: variant.size_label,
            price: String(variant.price),
            stock: String(variant.stock),
            sku: variant.sku ?? '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await productsService.updateProductVariant(editingId, {
                size_label: editForm.size_label,
                price: parseFloat(editForm.price),
                stock: parseInt(editForm.stock),
                sku: editForm.sku || undefined,
            });
            setVariants(prev =>
                prev.map(v =>
                    v.id === editingId
                        ? { ...v, size_label: editForm.size_label, price: parseFloat(editForm.price), stock: parseInt(editForm.stock), sku: editForm.sku || null }
                        : v
                )
            );
            setEditingId(null);
            toast.success('Variant updated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update variant');
        }
    };

    const handleDelete = async (variantId: string) => {
        if (!confirm('Delete this variant?')) return;
        try {
            await productsService.deleteProductVariant(variantId);
            setVariants(prev => prev.filter(v => v.id !== variantId));
            toast.success('Variant deleted');
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete variant');
        }
    };

    const handleAdd = async () => {
        if (!productId || !newForm.size_label || !newForm.price) {
            toast.error('Size and price are required');
            return;
        }
        try {
            const variant = await productsService.createProductVariant(productId, {
                size_label: newForm.size_label,
                price: parseFloat(newForm.price),
                stock: parseInt(newForm.stock) || 0,
                sku: newForm.sku || undefined,
            });
            setVariants(prev => [...prev, variant]);
            setNewForm({ size_label: '', price: '', stock: '', sku: '' });
            setAdding(false);
            toast.success('Variant added');
        } catch (err: any) {
            toast.error(err.message || 'Failed to add variant');
        }
    };

    if (!productId) {
        return (
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Product Variants</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Save the product first, then you can add size variants here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Variants</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage size options and variant-specific pricing
                    </p>
                </div>
                {!adding && (
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-1.5 text-sm bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        <Plus size={16} />
                        Add Variant
                    </button>
                )}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && variants.length === 0 && !adding && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <p className="text-sm">No variants yet. Click "Add Variant" to create one.</p>
                </div>
            )}

            {/* Variant list */}
            {!loading && variants.length > 0 && (
                <div className="space-y-2 mb-4">
                    {variants.map(variant => (
                        <div
                            key={variant.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30"
                        >
                            {editingId === variant.id ? (
                                // Inline edit mode
                                <div className="flex-1 grid grid-cols-4 gap-2">
                                    <input
                                        type="text"
                                        value={editForm.size_label}
                                        onChange={e => setEditForm(prev => ({ ...prev, size_label: e.target.value }))}
                                        placeholder="Size"
                                        className="px-2 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="number"
                                        value={editForm.price}
                                        onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                        placeholder="Price"
                                        step="0.01"
                                        min="0"
                                        className="px-2 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="number"
                                        value={editForm.stock}
                                        onChange={e => setEditForm(prev => ({ ...prev, stock: e.target.value }))}
                                        placeholder="Stock"
                                        min="0"
                                        className="px-2 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.sku}
                                        onChange={e => setEditForm(prev => ({ ...prev, sku: e.target.value }))}
                                        placeholder="SKU (optional)"
                                        className="px-2 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <div className="col-span-4 flex justify-end gap-2 mt-1">
                                        <button
                                            onClick={cancelEdit}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            className="p-1.5 text-teal-600 hover:text-teal-700 transition-colors"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Display mode
                                <>
                                    <div className="flex-1 flex items-center gap-4">
                                        <span className="inline-block w-10 text-center font-bold text-sm bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded py-0.5">
                                            {variant.size_label}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                            €{variant.price.toFixed(2)}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variant.stock > 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                                            {variant.stock} in stock
                                        </span>
                                        {variant.sku && (
                                            <span className="text-xs text-slate-400 font-mono">
                                                {variant.sku}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEdit(variant)}
                                            className="p-1.5 text-slate-400 hover:text-teal-600 transition-colors"
                                            title="Edit variant"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(variant.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete variant"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add new form */}
            {adding && (
                <div className="mb-4 p-4 rounded-lg border-2 border-dashed border-teal-200 dark:border-cyan-700/50 bg-teal-50/50 dark:bg-cyan-900/10">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        <input
                            type="text"
                            value={newForm.size_label}
                            onChange={e => setNewForm(prev => ({ ...prev, size_label: e.target.value }))}
                            placeholder="Size (e.g., S, M, L)"
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                        <input
                            type="number"
                            value={newForm.price}
                            onChange={e => setNewForm(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="Price"
                            step="0.01"
                            min="0"
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                        <input
                            type="number"
                            value={newForm.stock}
                            onChange={e => setNewForm(prev => ({ ...prev, stock: e.target.value }))}
                            placeholder="Stock"
                            min="0"
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                        <input
                            type="text"
                            value={newForm.sku}
                            onChange={e => setNewForm(prev => ({ ...prev, sku: e.target.value }))}
                            placeholder="SKU (optional)"
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setAdding(false); setNewForm({ size_label: '', price: '', stock: '', sku: '' }); }}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-1.5 text-sm bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                            <Check size={14} />
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
