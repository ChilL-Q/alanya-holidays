import React from 'react';
import { MapPin, Star } from 'lucide-react';

interface PropertyHeaderProps {
    title: string;
    location: string;
    rating: number;
    reviewsCount: number;
}

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({ title, location, rating, reviewsCount }) => {
    return (
        <div className="md:hidden px-4 py-5 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/50 rounded-b-3xl shadow-sm mb-2">
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                {title || 'Unknown Property'}
            </h1>
            <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400 text-sm">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-accent dark:text-amber-400 shrink-0" />
                        <span className="truncate">{location || 'No location'}</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Star size={16} className="fill-orange-400 text-orange-400" />
                        {reviewsCount > 0 ? rating.toFixed(1) : 'New'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="underline decoration-slate-300 decoration-1 underline-offset-2">{reviewsCount} reviews</span>
                </div>
            </div>
        </div>
    );
};
