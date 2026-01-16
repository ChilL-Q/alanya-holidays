import React from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';

interface PropertyHospitalityProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const PropertyHospitality: React.FC<PropertyHospitalityProps> = ({ formData, handleChange }) => {
    return (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="text-accent" size={20} />
                Hospitality & Guest Guide
                <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full ml-auto">Visible only after booking</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-in Time</label>
                    <input
                        type="text"
                        name="checkInTime"
                        placeholder="e.g. 3:00 PM"
                        value={formData.checkInTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checkout Time</label>
                    <input
                        type="text"
                        name="checkOutTime"
                        placeholder="e.g. 11:00 AM"
                        value={formData.checkOutTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Check-in Method</label>
                    <input
                        type="text"
                        name="checkInMethod"
                        placeholder="e.g. Lockbox, Keypad, In-person..."
                        value={formData.checkInMethod}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wifi Details</label>
                    <textarea
                        name="wifiDetails"
                        placeholder="Network Name and Password"
                        rows={2}
                        value={formData.wifiDetails}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Arrival Guide</label>
                    <textarea
                        name="arrivalGuide"
                        placeholder="Instructions for when guests arrive"
                        rows={3}
                        value={formData.arrivalGuide}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Directions</label>
                    <textarea
                        name="directions"
                        placeholder="How to get to the property"
                        rows={2}
                        value={formData.directions}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Manual</label>
                    <textarea
                        name="houseManual"
                        placeholder="How to use appliances, AC, pool etc."
                        rows={3}
                        value={formData.houseManual}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Rules</label>
                    <textarea
                        name="houseRules"
                        placeholder="No smoking, no parties, etc."
                        rows={3}
                        value={formData.houseRules}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Checkout Instructions</label>
                    <textarea
                        name="checkoutInstructions"
                        placeholder="What to do before leaving (trash, keys, etc.)"
                        rows={2}
                        value={formData.checkoutInstructions}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Guidebooks</label>
                    <textarea
                        name="guidebooks"
                        placeholder="Local recommendations (restaurants, sights)"
                        rows={2}
                        value={formData.guidebooks}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interaction Preferences</label>
                    <textarea
                        name="interactionPreferences"
                        placeholder="How you prefer to interact with guests"
                        rows={2}
                        value={formData.interactionPreferences}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-teal-600" />
                        Sync Calendar (iCal)
                    </label>
                    <input
                        type="url"
                        name="icalUrl"
                        placeholder="e.g. https://www.airbnb.com/calendar/ical/..."
                        value={formData.icalUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Paste your Airbnb or Booking.com iCal export link to sync availability.</p>
                </div>
            </div>
        </div>
    );
};
