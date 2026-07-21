import React from 'react';
import { Trash2 } from 'lucide-react';

interface HostServiceFeaturesFormProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    category: 'transportation' | 'adventure' | null;
    itinerary: any[];
    setItinerary: React.Dispatch<React.SetStateAction<any[]>>;
}

export const HostServiceFeaturesForm: React.FC<HostServiceFeaturesFormProps> = ({ 
    formData, setFormData, category, itinerary, setItinerary 
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (category === 'transportation') {
        return (
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Brand</label>
                    <input name="brand" value={formData.brand || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Model</label>
                    <input name="model" value={formData.model || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                    <input name="year" type="number" value={formData.year || ''} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transmission</label>
                    <select name="transmission" value={formData.transmission || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white">
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fuel Type</label>
                    <select name="fuel" value={formData.fuel || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white">
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seats</label>
                    <input name="seats" type="number" value={formData.seats || ''} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" />
                </div>
            </div>
        );
    }

    if (category === 'adventure') {
        const updateItineraryItem = (index: number, field: string, value: string) => {
            const newItinerary = [...itinerary];
            newItinerary[index] = { ...newItinerary[index], [field]: value };
            setItinerary(newItinerary);
        };

        return (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subcategory</label>
                    <select name="subcategory" value={formData.subcategory || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white">
                        <option value="">None</option>
                        <option value="water">Water (Boat, Jet Ski)</option>
                        <option value="safari">Safari & Off-road</option>
                        <option value="atv">ATV & Buggy</option>
                        <option value="air">Air (Paragliding, Balloon)</option>
                        <option value="land">Land Tours</option>
                        <option value="wellness">Wellness</option>
                    </select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                        <input name="duration" type="text" value={formData.duration || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Group Size</label>
                        <input name="groupSize" type="text" value={formData.groupSize || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none dark:text-white" />
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                        <select name="difficulty" value={formData.difficulty || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white">
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages</label>
                        <input name="languages" type="text" value={formData.languages || ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none dark:text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What is Included?</label>
                    <textarea name="included" value={formData.included || ''} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none dark:text-white" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Requirements</label>
                    <textarea name="requirements" value={formData.requirements || ''} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 outline-none dark:text-white" />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Itinerary</label>
                        <button type="button" onClick={() => setItinerary([...itinerary, { time: '', description: '' }])} className="text-sm bg-teal-100 text-teal-700 dark:text-cyan-400 px-3 py-1 rounded-full font-bold">
                            + Add Step
                        </button>
                    </div>
                    {itinerary.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start mb-2">
                            <input name={`itinerary-time-${idx}`} type="text" placeholder="Time" value={item.time || ''} onChange={e => updateItineraryItem(idx, 'time', e.target.value)} className="w-24 p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-700/50 outline-none dark:text-white text-sm" />
                            <input name={`itinerary-desc-${idx}`} type="text" placeholder="Description" value={item.description || ''} onChange={e => updateItineraryItem(idx, 'description', e.target.value)} className="flex-1 p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-700/50 outline-none dark:text-white text-sm" />
                            <button type="button" onClick={() => setItinerary(itinerary.filter((_, i) => i !== idx))} className="p-2 text-red-500 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
