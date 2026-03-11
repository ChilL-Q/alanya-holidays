import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../api-services';
import { Store, ArrowLeft, Trash2, Save, Tag, MapPin, Link2, Phone, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';
import { DirectoryListingDB } from '../../types/models';

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

    const categories = ['medical', 'accommodations', 'tours', 'transport', 'restaurants', 'real-estate', 'visa', 'shopping', 'nature', 'spa-hamam', 'hair-beauty'];

    useEffect(() => {
        if (isEditing) {
            loadListing();
        }
    }, [id]);

    const loadListing = async () => {
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
    };

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
                // Upload images to "directory" bucket using existing storage mechanism
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
            {/* Header */}
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
                            className="flex items-center gap-2 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50"
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
                        {/* Basic Details */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Store size={20} className="text-teal-500 dark:text-cyan-400 " />
                                Business Details
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="e.g. Alanya Premium Dental"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Description *</label>
                                        <textarea
                                            name="short_description"
                                            required
                                            value={formData.short_description}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="A brief overview of the business..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Location */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contact & Location</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location / Area *</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="location"
                                            required
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="e.g. Alanya Center"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Map URL (Optional)</label>
                                    <input
                                        type="url"
                                        name="google_map_url"
                                        value={formData.google_map_url}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        placeholder="Google Maps link"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website URL (Optional)</label>
                                    <div className="relative">
                                        <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="https://"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone (Optional)</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="whatsapp"
                                            value={formData.whatsapp}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            placeholder="+90 555 123 4567"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lists (Languages & Certifications) */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-teal-500 dark:text-cyan-400 " />
                                Details & Features
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages Spoken</label>
                                    <div className="space-y-2">
                                        {languages.map((lang, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={lang}
                                                    onChange={(e) => handleArrayChange(idx, e.target.value, 'language')}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white text-sm"
                                                    placeholder="e.g. English"
                                                />
                                                {languages.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveArrayItem(idx, 'language')} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddArrayItem('language')} className="text-sm text-teal-600 dark:text-cyan-400 font-medium hover:text-teal-700 dark:text-cyan-400 ">
                                            + Add Language
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Certifications</label>
                                    <div className="space-y-2">
                                        {certifications.map((cert, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={cert}
                                                    onChange={(e) => handleArrayChange(idx, e.target.value, 'certification')}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white text-sm"
                                                    placeholder="e.g. ISO 9001"
                                                />
                                                {certifications.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveArrayItem(idx, 'certification')} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => handleAddArrayItem('certification')} className="text-sm text-teal-600 dark:text-cyan-400 font-medium hover:text-teal-700 dark:text-cyan-400 ">
                                            + Add Certification
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gallery Images</h2>

                            {existingImages.length > 0 && (
                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                                    {existingImages.map((url, idx) => (
                                        <div key={idx} className="relative aspect-[4/3] group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800/50">
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

                            <PhotoUploader files={files} onChange={setFiles} maxFiles={10} />
                        </div>
                    </div>

                    {/* Right Column - Status & Settings */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 lg:sticky top-24">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Listing Settings</h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                    <div className="relative">
                                        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <div className="relative flex items-start mt-0.5">
                                            <input
                                                type="checkbox"
                                                name="is_featured"
                                                checked={formData.is_featured}
                                                onChange={handleChange}
                                                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-current" /> Featured Listing</span>
                                            <span className="text-xs text-slate-500">Highlights this listing in category grids</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <div className="relative flex items-start mt-0.5">
                                            <input
                                                type="checkbox"
                                                name="is_verified"
                                                checked={formData.is_verified}
                                                onChange={handleChange}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-500" /> Verified Partner</span>
                                            <span className="text-xs text-slate-500">Adds a verification badge to the business</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price Level Indicator</label>
                                    <select
                                        name="price_level"
                                        value={formData.price_level}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                                    >
                                        <option value={1}>$ (Budget)</option>
                                        <option value={2}>$$ (Moderate)</option>
                                        <option value={3}>$$$ (Expensive)</option>
                                        <option value={4}>$$$$ (Luxury)</option>
                                    </select>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Google Reviews (Stat Mocking)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Score (0-5)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="5"
                                                name="reviews_average"
                                                value={formData.reviews_average}
                                                onChange={handleChange}
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-sm outline-none dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Total Count</label>
                                            <input
                                                type="number"
                                                name="reviews_count"
                                                min="0"
                                                value={formData.reviews_count}
                                                onChange={handleChange}
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 text-sm outline-none dark:text-white"
                                            />
                                        </div>
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
