import React from 'react';
import { Trash2 } from 'lucide-react';

interface ServiceFeaturesFormProps {
    service: any;
    setService: React.Dispatch<React.SetStateAction<any>>;
}

export const ServiceFeaturesForm: React.FC<ServiceFeaturesFormProps> = ({ service, setService }) => {
    const updateFeature = (key: string, value: any) => {
        setService((prev: any) => ({
            ...prev,
            features: {
                ...prev.features,
                [key]: value
            }
        }));
    };

    const features = service.features || {};

    if (['car', 'bike', 'transfer'].includes(service.type || '')) {
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700/50">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Brand</label>
                        <input type="text" value={features.brand || ''} onChange={e => updateFeature('brand', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Model</label>
                        <input type="text" value={features.model || ''} onChange={e => updateFeature('model', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Year</label>
                        <input type="text" value={features.year || ''} onChange={e => updateFeature('year', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Transmission</label>
                        <select value={features.transmission || ''} onChange={e => updateFeature('transmission', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white">
                            <option value="">Select...</option>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Fuel Type</label>
                        <select value={features.fuel || ''} onChange={e => updateFeature('fuel', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white">
                            <option value="">Select...</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Seats</label>
                        <input type="number" value={features.seats || ''} onChange={e => updateFeature('seats', Number(e.target.value))} onWheel={(e) => e.currentTarget.blur()} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                </div>
            </div>
        );
    }

    if (service.type === 'tour') {
        const itinerary = features.itinerary || [];

        return (
            <div className="space-y-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700/50">Tour Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</label>
                        <input type="text" placeholder="e.g. 6 hours" value={features.duration || ''} onChange={e => updateFeature('duration', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Group Size</label>
                        <input type="text" placeholder="e.g. Up to 10 people" value={features.groupSize || ''} onChange={e => updateFeature('groupSize', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
                        <select value={features.difficulty || ''} onChange={e => updateFeature('difficulty', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white">
                            <option value="">Select...</option>
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Hard">Hard</option>
                            <option value="Extreme">Extreme</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Languages</label>
                        <input type="text" placeholder="e.g. English, Russian, Turkish" value={features.languages || ''} onChange={e => updateFeature('languages', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Included (comma separated)</label>
                        <textarea rows={2} value={features.included || ''} onChange={e => updateFeature('included', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Requirements / What to bring</label>
                        <textarea rows={2} value={features.requirements || ''} onChange={e => updateFeature('requirements', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white" />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Itinerary Schedule</h4>
                        <button onClick={() => updateFeature('itinerary', [...itinerary, { time: '', description: '' }])} className="text-sm bg-teal-100 text-teal-700 dark:text-cyan-400 px-3 py-1 rounded-full font-bold hover:bg-teal-200 transition-colors">
                            + Add Step
                        </button>
                    </div>
                    <div className="space-y-3">
                        {itinerary.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <input type="text" placeholder="Time" value={item.time || ''} onChange={e => {
                                    const newItinerary = [...itinerary]; newItinerary[idx].time = e.target.value; updateFeature('itinerary', newItinerary);
                                }} className="w-24 p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:border-teal-500" />
                                <input type="text" placeholder="Description" value={item.description || ''} onChange={e => {
                                    const newItinerary = [...itinerary]; newItinerary[idx].description = e.target.value; updateFeature('itinerary', newItinerary);
                                }} className="flex-1 p-2 rounded-lg border dark:bg-slate-800/80 dark:border-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:border-teal-500" />
                                <button onClick={() => updateFeature('itinerary', itinerary.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {itinerary.length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No itinerary steps defined.</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700/50">Service Details</h3>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Key Features (Generic)</label>
                <div className="text-xs text-slate-500 mb-2">Since this is a generic type, you can edit raw JSON features below if needed.</div>
                <textarea
                    value={JSON.stringify(features, null, 2)}
                    onChange={e => { try { setService((prev: any) => ({ ...prev, features: JSON.parse(e.target.value) })); } catch { } }}
                    rows={6}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs outline-none"
                />
            </div>
        </div>
    );
};
