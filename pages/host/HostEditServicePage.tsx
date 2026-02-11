import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db, ServiceData } from '../../api-services';
import { Car, Map, ArrowLeft, CheckCircle2, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';
import { CAR_CATALOG, BIKE_CATALOG, CAR_DESCRIPTIONS, DEFAULT_DESCRIPTION } from '../../data/cars';

type ServiceCategory = 'transportation' | 'adventure' | null;
type ServiceType = 'car' | 'bike' | 'transfer' | 'tour' | 'visa' | 'esim' | 'wellness' | 'creative';

interface ItineraryItem {
    time: string;
    description: string;
}

export const HostEditServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [category, setCategory] = useState<ServiceCategory>(null);
    const [originalService, setOriginalService] = useState<ServiceData | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        type: 'car' as ServiceType,
        // Transportation Specific
        vehicleType: 'sedan',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        transmission: 'automatic',
        fuel: 'petrol',
        seats: '4',
        modelSelection: 'popular', // 'popular' | 'custom'
        // Adventure Specific
        subcategory: 'water',
        duration: '',
        difficulty: 'medium',
        groupSize: '',
        included: '',
        languages: '',
        requirements: '',
        // Availability
        availableFrom: '',
        availableTo: '',
    });

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const data = await db.getService(id);
                setOriginalService(data);

                // Populate Form
                const features = data.features || {};
                const isTransport = ['car', 'bike', 'transfer'].includes(data.type);
                const cat: ServiceCategory = isTransport ? 'transportation' : 'adventure';

                setCategory(cat);
                setExistingImages(data.images || []);

                setFormData({
                    title: data.title,
                    description: data.description,
                    price: data.price.toString(),
                    type: data.type,
                    // Transport
                    vehicleType: features.vehicleType || 'sedan',
                    brand: features.brand || '',
                    model: features.model || '',
                    year: features.year || new Date().getFullYear().toString(),
                    transmission: features.transmission || 'automatic',
                    fuel: features.fuel || 'petrol',
                    seats: features.seats?.toString() || '4',
                    modelSelection: 'custom', // Default to custom when editing existing to avoid overwriting logic
                    // Adventure
                    subcategory: features.subcategory || 'water',
                    duration: features.duration || '',
                    difficulty: features.difficulty || 'medium',
                    groupSize: features.groupSize || '',
                    included: features.included || '',
                    languages: features.languages || '',
                    requirements: features.requirements || '',
                    availableFrom: features.availableFrom || '',
                    availableTo: features.availableTo || '',
                });

                if (features.itinerary) {
                    setItinerary(features.itinerary);
                } else {
                    setItinerary([{ time: '09:00', description: 'Start' }]);
                }

            } catch (err) {
                console.error("Failed to load service", err);
                toast.error("Failed to load service details");
                navigate('/host/services');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id, navigate]);

    // Catalog Logic
    const currentCatalog = formData.type === 'car' ? CAR_CATALOG : (formData.type === 'bike' ? BIKE_CATALOG : null);
    const availableModels = currentCatalog && formData.brand ? currentCatalog[formData.brand] : [];

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brand = e.target.value;
        setFormData(prev => ({ ...prev, brand, model: '' }));
    };

    // Itinerary Handlers
    const addItineraryItem = () => setItinerary([...itinerary, { time: '', description: '' }]);
    const removeItineraryItem = (index: number) => setItinerary(itinerary.filter((_, i) => i !== index));
    const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
        const newItinerary = [...itinerary];
        newItinerary[index] = { ...newItinerary[index], [field]: value };
        setItinerary(newItinerary);
    };

    const handleRemoveExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !id) return;

        setSubmitting(true);

        try {
            // Upload new images
            const uploadedUrls = [];
            for (const file of files) {
                try {
                    const url = await db.uploadImage(file, 'services');
                    uploadedUrls.push(url);
                } catch (err) {
                    const url = await db.uploadImage(file, 'properties'); // Fallback
                    uploadedUrls.push(url);
                }
            }

            const finalImages = [...existingImages, ...uploadedUrls];

            // Construct features
            let features: any = {};
            if (category === 'transportation') {
                features = {
                    vehicleType: formData.vehicleType,
                    brand: formData.brand,
                    model: formData.model,
                    year: formData.year,
                    transmission: formData.transmission,
                    fuel: formData.fuel,
                    seats: formData.seats
                };
            } else {
                features = {
                    subcategory: formData.subcategory,
                    duration: formData.duration,
                    difficulty: formData.difficulty,
                    groupSize: formData.groupSize,
                    included: formData.included,
                    languages: formData.languages,
                    requirements: formData.requirements,
                    itinerary: itinerary.filter(i => i.description)
                };
            }

            // Availability
            if (formData.availableFrom) features.availableFrom = formData.availableFrom;
            if (formData.availableTo) features.availableTo = formData.availableTo;

            const updates: Partial<ServiceData> = {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                type: formData.type,
                features: features,
                images: finalImages
            };

            // Auto-Approval Logic
            const isMinorUpdate = () => {
                if (!originalService) return false;

                // Fields that trigger approval
                const criticalFields = ['title', 'type', 'images'];
                // Description? Maybe allow minor edits, but easier to just flag it as critical for now.
                // Let's allow Description edits to be auto-approved too if avoiding "Every edit"
                // Actually, let's include 'description' in critical for now to be safe, or safe?
                // The task says "not every edit needs admin approval".
                // Let's say: Title, Type, Images, Intinerary -> Critical.
                // Price, Description, Availability, Features (minor) -> Safe.

                // Check basics
                if (formData.title !== originalService.title) return false;
                if (formData.type !== originalService.type) return false;

                // Check images (length or content)
                if (finalImages.length !== (originalService.images?.length || 0)) return false;
                // Deep check images? simple length check + order usually enough for "change"
                // If user added/removed images, it's critical.

                return true;
            };

            // Simplified Check: If only Price or Availability changed, it's minor.
            // But we are sending the WHOLE object to requestServiceUpdate usually.
            // We need to construct a partial update for updateService if minor.

            // Let's refine the logic:
            // If the user changed Title, Type, or Images -> Approval Needed.
            // Else -> Direct Update.

            const needsApproval =
                formData.title !== originalService?.title ||
                formData.type !== originalService?.type ||
                // Check if images changed (naive check: count or different urls)
                finalImages.length !== (originalService?.images?.length || 0) ||
                !finalImages.every((img, i) => img === originalService?.images?.[i]);

            if (needsApproval) {
                await db.requestServiceUpdate(id, updates);
                setSuccess(true);
            } else {
                // Direct specific update to avoid overriding other pending things?
                // Or just update content.
                await db.updateService(id, updates);
                toast.success('Service updated successfully');
                navigate('/host/services');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit changes');
        } finally {
            setSubmitting(false);
        }
    };

    useSaveShortcut(handleSubmit);

    if (loading) return <div className="min-h-screen pt-32 text-center">Loading...</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Changes Submitted</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Your changes have been sent for approval. The live version of your service will remain unchanged until an administrator approves your edits.
                    </p>
                    <button onClick={() => navigate('/host/services')} className="w-full bg-slate-900 text-white hover:bg-slate-800 font-semibold py-3 rounded-xl transition-colors">
                        Back to My Services
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/host/services')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all duration-300">
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Service</h1>
                        <p className="text-slate-500 dark:text-slate-400">{originalService?.title}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Common Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price (€)</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photos</h3>

                                {/* Existing Images */}
                                {existingImages.length > 0 && (
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        {existingImages.map((img, idx) => (
                                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExistingImage(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-xs text-slate-500 mb-3">Upload new photos to append.</p>
                                <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Availability (Optional)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Available From</label>
                                        <input
                                            type="date"
                                            name="availableFrom"
                                            value={formData.availableFrom}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Available To</label>
                                        <input
                                            type="date"
                                            name="availableTo"
                                            value={formData.availableTo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-700" />

                        {/* Transport Fields */}
                        {category === 'transportation' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Brand</label>
                                    <input name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                                    <input name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                                    <input name="year" type="number" value={formData.year} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seats</label>
                                    <input name="seats" type="number" value={formData.seats} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                </div>
                            </div>
                        )}

                        {/* Adventure Fields */}
                        {category === 'adventure' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                                    <select
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    >
                                        <option value="">None</option>
                                        <option value="water">Water (Boat, Jet Ski, Diving)</option>
                                        <option value="safari">Safari & Off-road</option>
                                        <option value="atv">ATV & Buggy</option>
                                        <option value="air">Air (Paragliding, Balloon)</option>
                                        <option value="land">Land Tours (City, Historical)</option>
                                        <option value="wellness">Wellness (Hamam, Spa)</option>
                                    </select>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Hours)</label>
                                        <input name="duration" type="number" value={formData.duration} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Size</label>
                                        <input name="groupSize" type="number" value={formData.groupSize} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What is Included?</label>
                                    <textarea name="included" value={formData.included} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold py-4 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-lg uppercase tracking-wide ring-4 ring-teal-500/20 flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Saving...' : 'Submit Changes'}
                            <Save />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
