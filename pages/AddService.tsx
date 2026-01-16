import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { Car, Bike, Map, ArrowLeft, CheckCircle2, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhotoUploader } from '../components/ui/PhotoUploader';
import toast from 'react-hot-toast';
import { CAR_CATALOG, BIKE_CATALOG, CAR_DESCRIPTIONS, DEFAULT_DESCRIPTION } from '../data/cars';

type ServiceCategory = 'transportation' | 'adventure' | null;
type ServiceType = 'car' | 'bike' | 'transfer' | 'tour' | 'visa' | 'esim';

interface ItineraryItem {
    time: string;
    description: string;
}

export const AddService: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Steps: 0 = Category, 1 = Details, 2 = Success
    const [step, setStep] = useState(0);
    const [category, setCategory] = useState<ServiceCategory>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    });

    const [files, setFiles] = useState<File[]>([]);
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([{ time: '09:00', description: 'Start' }]);

    // Auto-fill description when popular model changes
    useEffect(() => {
        if (formData.modelSelection === 'popular' && formData.brand && formData.model) {
            const key = `${formData.brand} ${formData.model}`;
            const desc = CAR_DESCRIPTIONS[key] || DEFAULT_DESCRIPTION;
            setFormData(prev => ({ ...prev, description: desc }));
        }
    }, [formData.brand, formData.model, formData.modelSelection]);

    const handleCategorySelect = (cat: ServiceCategory) => {
        setCategory(cat);
        setFormData(prev => ({
            ...prev,
            type: cat === 'transportation' ? 'car' : 'tour'
        }));
        setStep(1);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Catalog Logic
    const currentCatalog = formData.type === 'car' ? CAR_CATALOG : (formData.type === 'bike' ? BIKE_CATALOG : null);
    const availableModels = currentCatalog && formData.brand ? currentCatalog[formData.brand] : [];

    const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brand = e.target.value;
        setFormData(prev => ({
            ...prev,
            brand,
            model: '',
            title: `${brand} ${new Date().getFullYear()}`
        }));
    };

    const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const model = e.target.value;
        setFormData(prev => ({
            ...prev,
            model,
            title: `${prev.brand} ${model} ${prev.year}`
        }));
    };

    // Itinerary Handlers
    const addItineraryItem = () => {
        setItinerary([...itinerary, { time: '', description: '' }]);
    };

    const removeItineraryItem = (index: number) => {
        setItinerary(itinerary.filter((_, i) => i !== index));
    };

    const updateItineraryItem = (index: number, field: keyof ItineraryItem, value: string) => {
        const newItinerary = [...itinerary];
        newItinerary[index] = { ...newItinerary[index], [field]: value };
        setItinerary(newItinerary);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            // Upload images
            const uploadedUrls = [];
            for (const file of files) {
                // Fallback catch handled inside db function if set up, or here
                try {
                    const url = await db.uploadImage(file, 'services');
                    uploadedUrls.push(url);
                } catch (err) {
                    // console.log("Service bucket failed, trying property bucket");
                    const url = await db.uploadImage(file, 'properties'); // Fallback
                    uploadedUrls.push(url);
                }
            }

            // Construct features object based on category
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
            } else if (category === 'adventure') {
                features = {
                    subcategory: formData.subcategory,
                    duration: formData.duration,
                    difficulty: formData.difficulty,
                    groupSize: formData.groupSize,
                    included: formData.included,
                    languages: formData.languages,
                    requirements: formData.requirements,
                    itinerary: itinerary.filter(i => i.description) // Only save items with description
                };
            }



            await db.createService({
                title: formData.title,
                description: formData.description || DEFAULT_DESCRIPTION,
                price: Number(formData.price),
                type: formData.type,
                provider_id: user.id,
                features: features,
                images: uploadedUrls
            });
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error('Failed to list service');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 2) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submission Received!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Your service has been submitted for approval. You will be notified once it is live.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate('/services')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-3 rounded-xl transition-colors">
                            View All Services
                        </button>
                        <button onClick={() => { setStep(0); setCategory(null); }} className="w-full text-slate-500 hover:text-slate-900 font-medium py-2 transition-colors">
                            Add Another Service
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {step > 0 && (
                        <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all duration-300 active:scale-90">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">List Your Service</h1>
                        <p className="text-slate-500 dark:text-slate-400">Reach thousands of travelers in Alanya</p>
                    </div>
                </div>

                {/* Step 0: Category Selection */}
                {step === 0 && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => handleCategorySelect('transportation')}
                            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:ring-2 hover:ring-teal-500/20 hover:shadow-md transition-all duration-300 ease-out active:scale-[0.98] text-left group"
                        >
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Car size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Transportation</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Rent out cars, scooters, bikes, or offer transfer services.</p>
                        </button>

                        <button
                            onClick={() => handleCategorySelect('adventure')}
                            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:ring-2 hover:ring-orange-500/20 hover:shadow-md transition-all duration-300 ease-out active:scale-[0.98] text-left group"
                        >
                            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Map size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Adventure & Activities</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">List tours, excursions, experiences, and guided trips.</p>
                        </button>
                    </div>
                )}

                {/* Step 1: Details Form */}
                {step === 1 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {category === 'transportation' ? 'Vehicle Details' : 'Activity Details'}
                            </h2>
                            <span className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold uppercase tracking-wide border border-slate-200 dark:border-slate-600">
                                {category}
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {/* Service Helper Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Service Type</label>
                                <div className="flex flex-wrap gap-3">
                                    {category === 'transportation' ? (
                                        <>
                                            {['car', 'bike', 'transfer'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        type: t as any,
                                                        brand: '',
                                                        model: ''
                                                    })}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${formData.type === t
                                                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <button type="button" className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">Tour / Activity</button>
                                    )}
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder={category === 'transportation' ? "e.g. Fiat Egea 2023" : "e.g. Alanya Jeep Safari"}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                    {category === 'transportation' && formData.modelSelection === 'popular' && (
                                        <div className="text-xs text-slate-500 mt-1">Title is auto-generated but can be customized.</div>
                                    )}
                                </div>

                                {/* Description Field - Conditional */}
                                {(category !== 'transportation' || formData.modelSelection === 'custom') ? (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white resize-none"
                                        />
                                    </div>
                                ) : (
                                    <div className="md:col-span-2 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
                                        <p className="text-sm text-teal-700 dark:text-teal-300">
                                            <span className="font-bold">Description Auto-Generated:</span> We've automatically added a professional description for the {formData.brand} {formData.model} to help your listing stand out.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base Price (€)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        required
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photos</h3>
                                    <p className="text-xs text-slate-500 mb-3">Add at least one photo. First photo will be the cover.</p>
                                    <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Specific Fields: Transportation */}
                            {category === 'transportation' && (formData.type === 'car' || formData.type === 'bike') && (
                                <div className="md:col-span-2 mb-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex gap-4 mb-6">
                                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                                            <input type="radio" name="modelSelection" value="popular" checked={formData.modelSelection === 'popular'} onChange={() => setFormData({ ...formData, modelSelection: 'popular', brand: '', model: '', title: '' })} className="text-teal-600" />
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">Catalog (Popular)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                                            <input type="radio" name="modelSelection" value="custom" checked={formData.modelSelection === 'custom'} onChange={() => setFormData({ ...formData, modelSelection: 'custom', brand: '', model: '', title: '' })} className="text-teal-600" />
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">Other / Custom</span>
                                        </label>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Brand</label>
                                            {formData.modelSelection === 'popular' ? (
                                                <select
                                                    value={formData.brand}
                                                    onChange={handleBrandSelect}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                >
                                                    <option value="">Select Brand</option>
                                                    {currentCatalog && Object.keys(currentCatalog).sort().map(brand => (
                                                        <option key={brand} value={brand}>{brand}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Fiat" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                                            {formData.modelSelection === 'popular' ? (
                                                <select
                                                    value={formData.model}
                                                    onChange={handleModelSelect}
                                                    disabled={!formData.brand}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="">Select Model</option>
                                                    {availableModels.map(model => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input name="model" value={formData.model} onChange={handleChange} placeholder="e.g. Egea" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                                        {/* Additional Transportation Fields */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                                            <select
                                                name="year"
                                                value={formData.year}
                                                onChange={(e) => {
                                                    const newYear = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        year: newYear,
                                                        // Update title if it looks like a standard auto-generated title (Brand Model Year)
                                                        title: (prev.brand && prev.modelSelection === 'popular')
                                                            ? `${prev.brand} ${prev.model} ${newYear}`
                                                            : prev.title
                                                    }));
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            >
                                                {Array.from({ length: 17 }, (_, i) => (new Date().getFullYear() - i + 1).toString()).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transmission</label>
                                            <select
                                                name="transmission"
                                                value={formData.transmission}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            >
                                                <option value="automatic">Automatic</option>
                                                <option value="manual">Manual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fuel</label>
                                            <select
                                                name="fuel"
                                                value={formData.fuel}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            >
                                                <option value="petrol">Petrol</option>
                                                <option value="diesel">Diesel</option>
                                                <option value="electric">Electric</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seats</label>
                                            <input
                                                name="seats"
                                                type="number"
                                                value={formData.seats}
                                                onChange={handleChange}
                                                onWheel={(e) => e.currentTarget.blur()}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Specific Fields: Adventure */}
                            {category === 'adventure' && (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                                            <select
                                                name="subcategory"
                                                value={formData.subcategory}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500"
                                            >
                                                <option value="water">Water (Boat, Jet Ski, Diving)</option>
                                                <option value="safari">Safari & Off-road</option>
                                                <option value="air">Air (Paragliding, Balloon)</option>
                                                <option value="land">Land Tours (City, Historical)</option>
                                                <option value="wellness">Wellness (Hamam, Spa)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                            <select
                                                name="difficulty"
                                                value={formData.difficulty}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                                <option value="extreme">Extreme</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Hours)</label>
                                            <input name="duration" type="number" value={formData.duration} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Size</label>
                                            <input name="groupSize" type="number" value={formData.groupSize} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                                        </div>
                                    </div>

                                    {/* Itinerary Builder */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trip Schedule / Itinerary</h3>
                                            <button type="button" onClick={addItineraryItem} className="text-sm text-teal-600 font-bold hover:underline flex items-center gap-1">
                                                <Plus size={16} /> Add Stop
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {itinerary.map((item, index) => (
                                                <div key={index} className="flex gap-3 items-start">
                                                    <div className="w-24">
                                                        <input
                                                            placeholder="09:00"
                                                            value={item.time}
                                                            onChange={(e) => updateItineraryItem(index, 'time', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <input
                                                            placeholder="Activity description (e.g. Hotel Pickup)"
                                                            value={item.description}
                                                            onChange={(e) => updateItineraryItem(index, 'description', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                                                        />
                                                    </div>
                                                    <button type="button" onClick={() => removeItineraryItem(index)} className="p-2 text-slate-400 hover:text-rose-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What is Included?</label>
                                        <textarea name="included" value={formData.included} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" placeholder="e.g. Lunch, Transfer, Guide" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Requirements</label>
                                        <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" placeholder="e.g. Driving License, Comfortable shoes" />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Listing Service...' : 'List Service'}
                                <ChevronRight />
                            </button>
                        </form>
                    </div>
                )
                }
            </div >
        </div >
    );
};
