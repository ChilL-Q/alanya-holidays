import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { ShoppingBag, ArrowLeft, Trash2, Save, Tag, Box, DollarSign } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';

export const AdminEditProductPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const isEditing = id && id !== 'new';

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        stock: '1',
        category: 'souvenir'
    });

    useEffect(() => {
        if (isEditing) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        try {
            const product = await db.getProduct(id!);
            if (product) {
                setFormData({
                    title: product.title,
                    description: product.description,
                    price: String(product.price),
                    stock: String(product.stock || 1),
                    category: product.category
                });
                setExistingImages(product.images || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load product');
            navigate('/admin/products');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitting(true);

        try {
            let uploadedUrls: string[] = [];
            if (files.length > 0) {
                // Rely on db.uploadImage's internal fallback logic
                uploadedUrls = await Promise.all(
                    files.map(file => db.uploadImage(file, 'products'))
                );
            }

            const finalImages = [...existingImages, ...uploadedUrls];

            if (!user) {
                toast.error('You must be logged in to save products');
                throw new Error('User not found');
            }

            const productData: any = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                category: formData.category,
                images: finalImages,
                seller_id: user.id
            };

            // Runtime sanity check to prevent schema mismatch leaks
            if ('artisan_id' in productData) {
                console.warn('DEBUG: detected legacy artisan_id in payload, deleting it.');
                delete productData.artisan_id;
            }

            console.log('DEBUG: Final product payload:', productData);

            if (isEditing) {
                await db.updateProduct(id!, productData);
                toast.success('Product updated successfully');
            } else {
                await db.createProduct(productData);
                toast.success('Product created successfully');
            }

            navigate('/admin/products');
        } catch (error: any) {
            console.error('Save Product Error:', error);
            const message = error.message || 'Failed to save product';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    useSaveShortcut(handleSubmit);

    const categories = ['souvenir', 'textile', 'food', 'jewelry', 'art'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Product' : 'New Product'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{submitting ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Basic Details */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <ShoppingBag size={20} className="text-teal-500" />
                                Product Details
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        placeholder="Product Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        placeholder="Describe the product..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Photos</h2>

                            {existingImages.length > 0 && (
                                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-4 mb-6">
                                    {existingImages.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={url} alt="Existing" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(idx)}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 sticky top-24">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <div className="relative">
                                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                                    <div className="relative">
                                        <Box size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
