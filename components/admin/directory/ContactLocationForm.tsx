import React from 'react';
import { MapPin, Link2, Phone } from 'lucide-react';

interface ContactLocationFormProps {
    location: string;
    googleMapUrl: string;
    website: string;
    whatsapp: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ContactLocationForm: React.FC<ContactLocationFormProps> = ({
    location, googleMapUrl, website, whatsapp, onChange
}) => {
    return (
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
                            value={location}
                            onChange={onChange}
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
                        value={googleMapUrl}
                        onChange={onChange}
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
                            value={website}
                            onChange={onChange}
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
