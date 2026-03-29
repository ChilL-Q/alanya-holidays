import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ComponentProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    itinerary?: any[];
    setItinerary?: (itinerary: any[]) => void;
}

export const TransportationFields: React.FC<ComponentProps> = ({ formData, handleChange, setFormData }) => {
    const CAR_CATALOG: any = {
        'Fiat': ['Egea', '500', 'Panda', 'Doblo'],
        'Renault': ['Clio', 'Megane', 'Taliant', 'Fluence'],
        'Volkswagen': ['Polo', 'Golf', 'Passat', 'Tiguan'],
        'Hyundai': ['i10', 'i20', 'Bayon', 'Tucson'],
        'Peugeot': ['208', '308', '2008', '3008', '5008'],
        'Dacia': ['Sandero', 'Duster', 'Jogger'],
        'Honda': ['Civic', 'City', 'HR-V'],
        'Toyota': ['Corolla', 'Yaris', 'C-HR']
    };

    const BIKE_CATALOG: any = {
        'Honda': ['Forza 250', 'PCX 125', 'CB500X', 'NC750X'],
        'Yamaha': ['NMAX 125', 'XMAX 250', 'Tracer 7', 'MT-07'],
        'BMW': ['R 1250 GS', 'F 850 GS', 'G 310 GS'],
        'Vespa': ['Primavera 50', 'GTS 300', 'Sprint 150']
    };

    const currentCatalog = formData.type === 'car' ? CAR_CATALOG : (formData.type === 'bike' ? BIKE_CATALOG : null);
    const availableModels = currentCatalog && formData.brand ? currentCatalog[formData.brand] : [];

    const handleBrandSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const brand = e.target.value;
        setFormData((prev: any) => ({
            ...prev,
            brand,
            model: '',
            title: `${brand} ${new Date().getFullYear()}`
        }));
    };

    const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const model = e.target.value;
        setFormData((prev: any) => ({
            ...prev,
            model,
            title: `${prev.brand} ${model} ${prev.year}`
        }));
    };

    return (
        <div className="md:col-span-2 mb-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="flex gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <input type="radio" name="modelSelection" value="popular" checked={formData.modelSelection === 'popular'} onChange={() => setFormData({ ...formData, modelSelection: 'popular', brand: '', model: '', title: '' })} className="text-teal-600 dark:text-cyan-400 " />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Catalog (Popular)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <input type="radio" name="modelSelection" value="custom" checked={formData.modelSelection === 'custom'} onChange={() => setFormData({ ...formData, modelSelection: 'custom', brand: '', model: '', title: '' })} className="text-teal-600 dark:text-cyan-400 " />
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
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        >
                            <option value="">Select Brand</option>
                            {currentCatalog && Object.keys(currentCatalog).sort().map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    ) : (
                        <input name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Fiat" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                    {formData.modelSelection === 'popular' ? (
                        <select
                            value={formData.model}
                            onChange={handleModelSelect}
                            disabled={!formData.brand}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white disabled:opacity-50"
                        >
                            <option value="">Select Model</option>
                            {availableModels.map((model: string) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    ) : (
                        <input name="model" value={formData.model} onChange={handleChange} placeholder="e.g. Egea" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                    <select
                        name="year"
                        value={formData.year}
                        onChange={(e) => {
                            const newYear = e.target.value;
                            setFormData((prev: any) => ({
                                ...prev,
                                year: newYear,
                                title: (prev.brand && prev.modelSelection === 'popular')
                                    ? `${prev.brand} ${prev.model} ${newYear}`
                                    : prev.title
                            }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                    />
                </div>
            </div>
        </div>
    );
};

export const AdventureFields: React.FC<ComponentProps> = ({ formData, handleChange, itinerary, setItinerary }) => {
    const addItineraryItem = () => {
        if (setItinerary && itinerary) {
            setItinerary([...itinerary, { time: '', description: '' }]);
        }
    };

    const removeItineraryItem = (index: number) => {
        if (setItinerary && itinerary) {
            setItinerary(itinerary.filter((_, i) => i !== index));
        }
    };

    const updateItineraryItem = (index: number, field: string, value: string) => {
        if (setItinerary && itinerary) {
            const newItinerary = [...itinerary];
            newItinerary[index] = { ...newItinerary[index], [field]: value };
            setItinerary(newItinerary);
        }
    };

    return (
        <div className="space-y-6 md:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                    <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">None</option>
                        <option value="water">Water (Boat, Jet Ski, Diving)</option>
                        <option value="safari">Safari & Off-road</option>
                        <option value="atv">ATV & Buggy</option>
                        <option value="ebike">Bikes & E-bikes</option>
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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="extreme">Extreme</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Hours)</label>
                    <input name="duration" type="number" value={formData.duration} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Size</label>
                    <input name="groupSize" type="number" value={formData.groupSize} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80" />
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trip Schedule / Itinerary</h3>
                    <button type="button" onClick={addItineraryItem} className="text-sm text-teal-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1">
                        <Plus size={16} /> Add Stop
                    </button>
                </div>
                <div className="space-y-3">
                    {itinerary?.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <div className="w-24">
                                <input
                                    placeholder="09:00"
                                    value={item.time}
                                    onChange={(e) => updateItineraryItem(index, 'time', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 text-sm"
                                />
                            </div>
                            <div className="flex-grow">
                                <input
                                    placeholder="Activity description (e.g. Hotel Pickup)"
                                    value={item.description}
                                    onChange={(e) => updateItineraryItem(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 text-sm"
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
                <textarea name="included" value={formData.included} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80" placeholder="e.g. Lunch, Transfer, Guide" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Requirements</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80" placeholder="e.g. Driving License, Comfortable shoes" />
            </div>
        </div>
    );
};

export const HealthCreativeFields: React.FC<ComponentProps & { category: string; t: any }> = ({ formData, handleChange, category, t }) => {
    return (
        <div className="space-y-6 md:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 ${category === 'health' ? 'focus:ring-rose-500' : 'focus:ring-purple-500'}`}
                    >
                        <option value="">None</option>
                        {category === 'health' ? (
                            <>
                                <option value="hair">Hair Transplant</option>
                                <option value="dental">Dental</option>
                                <option value="spa">Spa & Massage</option>
                                <option value="cosmetic">Cosmetic Surgery</option>
                            </>
                        ) : (
                            <>
                                <option value="photographer">{t('add_service.creative.photographer')}</option>
                                <option value="videographer">{t('add_service.creative.videographer')}</option>
                                <option value="content_creator">{t('add_service.creative.content_creator')}</option>
                                <option value="other">{t('add_service.creative.other')}</option>
                            </>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">WhatsApp Number</label>
                    <input
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="+90 555 123 45 67"
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 ${category === 'health' ? 'focus:ring-rose-500' : 'focus:ring-purple-500'}`}
                    />
                    <p className="text-xs text-slate-500 mt-1">Clients will contact you directly via WhatsApp.</p>
                </div>
            </div>
        </div>
    );
};
