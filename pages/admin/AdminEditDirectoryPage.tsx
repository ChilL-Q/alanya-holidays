import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../api-services';
import { ArrowLeft, Save } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import toast from 'react-hot-toast';
import { DirectoryListingDB } from '../../types/models';

import { BasicDetailsForm } from '../../components/admin/directory/BasicDetailsForm';
import { ContactLocationForm } from '../../components/admin/directory/ContactLocationForm';
import { DetailsFeaturesForm } from '../../components/admin/directory/DetailsFeaturesForm';
import { DirectoryGallery } from '../../components/admin/directory/DirectoryGallery';
import { SettingsSidebar } from '../../components/admin/directory/SettingsSidebar';

export const AdminEditDirectoryPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = id && id !== 'new';

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Array inputs
    const [languages, setLanguages] = useState<string[]>(['']);
    const [certifications, setCertifications] = useState<string[]>(['']);

    const [formData, setFormData] = useState({
        name: '',
        short_description: '',
        category_id: 'medical',
        location: '',
        website: '',
        whatsapp: '',
        google_map_url: '',
        price_level: 2,
        reviews_average: 0.0,
        reviews_count: 0,
        is_featured: false,
        is_verified: false
    });

    const loadListing = useCallback(async () => {
        try {
            const listing = await db.getDirectoryListing(id!);
            if (listing) {
                setFormData({
                    name: listing.name,
                    short_description: listing.short_description,
                    category_id: listing.category_id,
                    location: listing.location,
                    website: listing.website || '',
                    whatsapp: listing.whatsapp || '',
                    google_map_url: listing.google_map_url || '',
                    price_level: listing.price_level || 2,
                    reviews_average: listing.reviews_average || 0,
                    reviews_count: listing.reviews_count || 0,
                    is_featured: listing.is_featured || false,
                    is_verified: listing.is_verified || false
                });
                setExistingImages(listing.gallery || []);
                setLanguages(listing.languages_spoken?.length ? listing.languages_spoken : ['']);
                setCertifications(listing.certifications?.length ? listing.certifications : ['']);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load listing');
            navigate('/admin/directory');
        }
    }, [id, navigate]);

    useEffect(() => {
        if (isEditing) {
            loadListing();
        }
    }, [isEditing, loadListing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayChange = (index: number, value: string, type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        const array = type === 'language' ? languages : certifications;
        const newArray = [...array];
        newArray[index] = value;
        setFunc(newArray);
    };

    const handleAddArrayItem = (type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        setFunc(prev => [...prev, '']);
    };

    const handleRemoveArrayItem = (index: number, type: 'language' | 'certification') => {
        const setFunc = type === 'language' ? setLanguages : setCertifications;
        setFunc(prev => prev.filter((_, i) => i !== index));
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
                    files.map(file => db.uploadImage(file, 'directory'))
                );
            }

            const finalImages = [...existingImages, ...uploadedUrls];

            const listingData: Omit<DirectoryListingDB, 'id' | 'created_at' | 'updated_at'> = {
                name: formData.name,
                short_description: formData.short_description,
                category_id: formData.category_id,
                location: formData.location,
                website: formData.website || undefined,
                whatsapp: formData.whatsapp || undefined,
                google_map_url: formData.google_map_url || undefined,
                price_level: Number(formData.price_level) as 1 | 2 | 3 | 4,
                reviews_average: Number(formData.reviews_average),
                reviews_count: Number(formData.reviews_count),
                is_featured: formData.is_featured,
                is_verified: formData.is_verified,
                gallery: finalImages,
                languages_spoken: languages.filter(l => l.trim() !== ''),
                certifications: certifications.filter(c => c.trim() !== '')
            };

            if (isEditing) {
                await db.updateDirectoryListing(id!, listingData);
                toast.success('Listing updated successfully');
            } else {
                await db.createDirectoryListing(listingData);
                toast.success('Listing created successfully');
            }

            navigate('/admin/directory');
        } catch (error: any) {
            console.error('Save Listing Error:', error);
            const message = error.message || 'Failed to save listing';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    useSaveShortcut(handleSubmit);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 overflow-x-hidden">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/directory')}
                            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Listing' : 'New Listing'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSubmit()}
                            disabled={submitting}
                            className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{submitting ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <BasicDetailsForm
                            name={formData.name}
                            description={formData.short_description}
                            onChange={handleChange}
                        />

                        <ContactLocationForm
                            location={formData.location}
                            googleMapUrl={formData.google_map_url}
                            website={formData.website}
                            whatsapp={formData.whatsapp}
                            onChange={handleChange}
                        />

                        <DetailsFeaturesForm
                            languages={languages}
                            certifications={certifications}
                            onArrayChange={handleArrayChange}
                            onAddArrayItem={handleAddArrayItem}
                            onRemoveArrayItem={handleRemoveArrayItem}
                        />

                        <DirectoryGallery
                            existingImages={existingImages}
                            onRemoveExisting={removeExistingImage}
                            files={files}
                            onFilesChange={setFiles}
                        />
                    </div>

                    {/* Right Column - Status & Settings */}
                    <div className="space-y-6">
                        <SettingsSidebar
                            categoryId={formData.category_id}
                            isFeatured={formData.is_featured}
                            isVerified={formData.is_verified}
                            priceLevel={formData.price_level}
                            reviewsAverage={formData.reviews_average}
                            reviewsCount={formData.reviews_count}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
