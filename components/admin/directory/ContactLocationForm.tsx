import React from 'react';
import { MapPin, Link2, Phone } from 'lucide-react';
import { LocationDB } from '../../../types/models';

interface ContactLocationFormProps {
    location: string;
    googleMapUrl: string;
    website: string;
    whatsapp: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    availableLocations?: LocationDB[];
    selectedLocationIds?: string[];
    onLocationIdsChange?: (ids: string[]) => void;
    tier?: string;
}

export const ContactLocationForm: React.FC<ContactLocationFormProps> = ({
    location, googleMapUrl, website, whatsapp, onChange,
    availableLocations, selectedLocationIds, onLocationIdsChange, tier
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Contact & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="directory-location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location / Area *</label>
                    <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="directory-location"
                            type="text"
                            name="location"
                            required
                            value={location}
                            onChange={onChange}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                            placeholder="e.g. Alanya Center"
                        />
                    </div>
                </div>
                {tier === 'signature' && availableLocations && availableLocations.length > 0 && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Coverage Areas</label>
                        <div className="flex flex-wrap gap-2">
                            {availableLocations.map(loc => {
                                const selected = selectedLocationIds?.includes(loc.id) ?? false;
                                return (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => {
                                            const next = selected
                                                ? (selectedLocationIds ?? []).filter(id => id !== loc.id)
                                                : [...(selectedLocationIds ?? []), loc.id];
                                            onLocationIdsChange?.(next);
                                        }}
                                        className={[
                                            'text-xs px-3 py-1.5 rounded-full border transition-colors',
                                            selected
                                                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                                        ].join(' ')}
                                    >
                                        {loc.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="directory-map" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Map URL (Optional)</label>
                    <input
                        id="directory-map"
                        type="url"
                        name="google_map_url"
                        value={googleMapUrl}
                        onChange={onChange}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        placeholder="Google Maps link"
                    />
                </div>
                <div>
                    <label htmlFor="directory-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website URL (Optional)</label>
                    <div className="relative">
                        <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="directory-website"
                            type="url"
                            name="website"
                            value={website}
                            onChange={onChange}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                            placeholder="https://"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="directory-whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone (Optional)</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="directory-whatsapp"
                            type="text"
                            name="whatsapp"
                            value={whatsapp}
                            onChange={onChange}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                            placeholder="+90 555 123 4567"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
