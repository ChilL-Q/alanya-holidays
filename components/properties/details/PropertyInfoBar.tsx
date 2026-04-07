import React from 'react';
import { Users, DoorOpen, BedDouble, Bath } from 'lucide-react';

interface PropertyInfoBarProps {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
}

export const PropertyInfoBar: React.FC<PropertyInfoBarProps> = ({ guests, bedrooms, beds, bathrooms }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-2">
                <Users size={24} className="text-teal-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{guests || 1} Guests</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-2">
                <DoorOpen size={24} className="text-teal-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{bedrooms || 1} Bedrooms</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-2">
                <BedDouble size={24} className="text-teal-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{beds || 1} Beds</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center gap-2">
                <Bath size={24} className="text-teal-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{bathrooms || 1} Baths</span>
            </div>
        </div>
    );
};
