import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { Car, Bike, Map, ArrowLeft, CheckCircle2, ChevronRight, Bus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ServiceCategory = 'transportation' | 'adventure' | null;
type ServiceType = 'car' | 'bike' | 'transfer' | 'tour' | 'visa' | 'esim';

// Car Catalog (Brand -> Models)
const CAR_CATALOG: Record<string, string[]> = {
    'Fiat': ['Egea', '500', 'Panda', 'Doblo', 'Fiorino'],
    'Renault': ['Clio', 'Taliant', 'Megane', 'Captur', 'Austral'],
    'Hyundai': ['i10', 'i20', 'Bayon', 'Tucson', 'Elantra'],
    'Toyota': ['Corolla', 'Yaris', 'C-HR', 'Rav4'],
    'Honda': ['City', 'Civic', 'Jazz', 'HR-V'],
    'Ford': ['Focus', 'Fiesta', 'Puma', 'Kuga', 'Tourneo Courier'],
    'Dacia': ['Duster', 'Sandero', 'Jogger'],
    'Citroen': ['C3', 'C3 Aircross', 'C4', 'C5 Aircross'],
    'Peugeot': ['208', '2008', '3008', '5008', 'Rifter'],
    'Opel': ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland'],
    'Volkswagen': ['Polo', 'Golf', 'T-Roc', 'Tiguan', 'Passat'],
    'Skoda': ['Fabia', 'Scala', 'Kamiq', 'Octavia', 'Kodiaq'],
    'Nissan': ['Juke', 'Qashqai', 'X-Trail'],
    'BMW': ['1 Series', '2 Series', '3 Series', '5 Series', 'X1', 'X3'],
    'Mercedes': ['A-Class', 'C-Class', 'E-Class', 'CLA', 'GLA', 'GLB'],
    'Chery': ['Omoda 5', 'Tiggo 7 Pro', 'Tiggo 8 Pro'],
};

// Bike/Scooter Catalog
const BIKE_CATALOG: Record<string, string[]> = {
    'Honda': ['PCX 125', 'Dio', 'Activa', 'Forza 250', 'ADV 350', 'NC 750'],
    'Yamaha': ['NMAX 125', 'NMAX 155', 'XMAX 250', 'Delight', 'MT-25', 'R25'],
    'Vespa': ['Primavera 150', 'GTS 300', 'Sprint'],
    'Arora': ['Cappucino', 'Verano', 'Freedom'],
    'Kuba': ['Blueberry', 'Chia', 'Space'],
    'Sym': ['Fiddle III', 'Jet 14', 'Wolf'],
    'Suzuki': ['Address 125', 'Burgman 200'],
    'Piaggio': ['Liberty 150', 'Medley 150', 'Beverly'],
    'RKS': ['Spontini', 'Wildcat', 'Vieste'],
    'Mondial': ['Drift L', 'Turismo'],
};

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
        imageUrl: ''
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadError(null);
        }
    };

    const YEARS = Array.from({ length: 17 }, (_, i) => (new Date().getFullYear() - i + 1).toString()); // 2026 down to 2010

    const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brand = e.target.value;
        setFormData({
            ...formData,
            brand,
            model: '', // Reset model when brand changes
            title: `${brand} ${new Date().getFullYear()}` // Partial title update
        });
    };

    const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const model = e.target.value;
        setFormData({
            ...formData,
            model,
            title: `${formData.brand} ${model} ${formData.year}`
        });
    };

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = e.target.value;
        setFormData({
            ...formData,
            year,
            title: `${formData.brand} ${formData.model} ${year}`
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setUploadError(null);

        try {
            let uploadedImageUrl = formData.imageUrl;

            if (selectedFile) {
                try {
                    // Try uploading to 'services' bucket, fallback handled in db potentially or via error catch
                    // Note: db.uploadImage defaults to 'properties', let's stick to that if strict typing requires it or pass 'services' if allowed.
                    // Looking at db.ts, second arg is bucket name.
                    uploadedImageUrl = await db.uploadImage(selectedFile, 'services');
                } catch (err) {
                    console.error("Upload failed", err);
                    // Fallback to properties bucket if services fails (common setup issue)
                    uploadedImageUrl = await db.uploadImage(selectedFile, 'properties');
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
                    languages: formData.languages
                };
            }

            await db.createService({
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                type: formData.type,
                provider_id: user.id,
                features: features,
                images: uploadedImageUrl ? [uploadedImageUrl] : []
            });
            setStep(2);
        } catch (error) {
            console.error(error);
            setUploadError('Failed to list service or upload image.');
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Service Listed!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Your service has been successfully added to the marketplace.</p>
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

    // Determine current catalog based on type
    const currentCatalog = formData.type === 'car' ? CAR_CATALOG : (formData.type === 'bike' ? BIKE_CATALOG : null);
    const availableModels = currentCatalog && formData.brand ? currentCatalog[formData.brand] : [];

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
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {category === 'transportation' ? 'Vehicle Details' : 'Activity Details'}
                            </h2>
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold uppercase tracking-wide">
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base Price (€)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Main Photo (Optional)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-teal-50 dark:bg-teal-900/20 rounded-xl border-dashed border-2 border-teal-200 dark:border-teal-800 group-hover:border-teal-400 transition-colors pointer-events-none" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="w-full px-4 py-3 rounded-xl opacity-0 cursor-pointer relative z-10"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {selectedFile ? (
                                                <span className="text-teal-600 dark:text-teal-400 font-medium truncate px-4">
                                                    {selectedFile.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 dark:text-slate-400">
                                                    Click to upload an image
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Specific Fields: Transportation (Catalog) */}
                            {category === 'transportation' && (formData.type === 'car' || formData.type === 'bike') && (
                                <div className="md:col-span-2 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Vehicle Selection</label>
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modelSelection"
                                                value="popular"
                                                checked={formData.modelSelection === 'popular'}
                                                onChange={() => setFormData({ ...formData, modelSelection: 'popular', brand: '', model: '', title: '' })}
                                                className="text-teal-600 focus:ring-teal-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Catalog (Popular)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="modelSelection"
                                                value="custom"
                                                checked={formData.modelSelection === 'custom'}
                                                onChange={() => setFormData({ ...formData, modelSelection: 'custom', brand: '', model: '', title: '' })}
                                                className="text-teal-600 focus:ring-teal-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Other / Custom</span>
                                        </label>
                                    </div>

                                    {formData.modelSelection === 'popular' && currentCatalog && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Brand</label>
                                                <select
                                                    value={formData.brand}
                                                    onChange={handleBrandSelect}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                >
                                                    <option value="">Brand</option>
                                                    {Object.keys(currentCatalog).sort().map(brand => (
                                                        <option key={brand} value={brand}>{brand}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Model</label>
                                                <select
                                                    value={formData.model}
                                                    onChange={handleModelSelect}
                                                    disabled={!formData.brand}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="">Model</option>
                                                    {availableModels.map(model => (
                                                        <option key={model} value={model}>{model}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Year</label>
                                                <select
                                                    value={formData.year}
                                                    onChange={handleYearSelect}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                >
                                                    {Array.from({ length: 17 }, (_, i) => (new Date().getFullYear() - i + 1).toString()).map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Specific Fields: Transportation (Continued) */}
                            {category === 'transportation' && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Custom Brand/Model Input */}
                                    {formData.modelSelection === 'custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Brand</label>
                                                <input
                                                    name="brand"
                                                    value={formData.brand}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Fiat"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                                                <input
                                                    name="model"
                                                    value={formData.model}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Egea"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                                                <input
                                                    name="year"
                                                    type="number"
                                                    value={formData.year}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Additional fields logic remains the same... */}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transmission</label>
                                        <select
                                            name="transmission"
                                            value={formData.transmission}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
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
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
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
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Specific Fields: Adventure */}
                            {category === 'adventure' && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                                        <select
                                            name="subcategory"
                                            value={formData.subcategory}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        >
                                            <option value="water">Water Activity (Boat, Jet Ski, Diving)</option>
                                            <option value="safari">Safari & Off-road</option>
                                            <option value="air">Air Activity (Paragliding, Balloon)</option>
                                            <option value="land">Land Tours (City, Historical)</option>
                                            <option value="wellness">Wellness (Hamam, Spa)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Hours)</label>
                                        <input
                                            name="duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            placeholder="e.g. 6"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                        <select
                                            name="difficulty"
                                            value={formData.difficulty}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                            <option value="extreme">Extreme</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Group Size</label>
                                        <input
                                            name="groupSize"
                                            type="number"
                                            value={formData.groupSize}
                                            onChange={handleChange}
                                            placeholder="e.g. 12"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages</label>
                                        <input
                                            name="languages"
                                            value={formData.languages}
                                            onChange={handleChange}
                                            placeholder="e.g. EN, RU, TR"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What's Included</label>
                                        <textarea
                                            name="included"
                                            value={formData.included}
                                            onChange={handleChange}
                                            placeholder="e.g. Lunch, Hotel Pickup, Equipment"
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white resize-none"
                                        />
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
