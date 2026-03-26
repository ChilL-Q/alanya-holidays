import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { ArrowLeft, Save } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import toast from 'react-hot-toast';

import { ProductBasicDetailsForm } from '../../components/admin/products/ProductBasicDetailsForm';
import { ProductSettingsSidebar } from '../../components/admin/products/ProductSettingsSidebar';
import { ProductMediaForm } from '../../components/admin/products/ProductMediaForm';

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

            if ('artisan_id' in productData) {
                delete productData.artisan_id;
            }

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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
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
                            className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{submitting ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    <div className="md:col-span-2 space-y-6">
                        <ProductBasicDetailsForm formData={formData} handleChange={handleChange} />
                        
                        <ProductMediaForm 
                            existingImages={existingImages} 
                            removeExistingImage={removeExistingImage} 
                            files={files} 
                            setFiles={setFiles} 
                        />
                    </div>

                    <div className="space-y-6">
                        <ProductSettingsSidebar formData={formData} handleChange={handleChange} />
                    </div>
                </div>
            </main>
        </div>
    );
};
