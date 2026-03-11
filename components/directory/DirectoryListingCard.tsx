import React from 'react';
import { Star, MapPin, Globe, MessageCircle, BadgeCheck, ShieldCheck } from 'lucide-react';
import { DirectoryListingDB } from '../../types/models';

interface DirectoryListingCardProps {
    listing: DirectoryListingDB;
}

export const DirectoryListingCard: React.FC<DirectoryListingCardProps> = ({ listing }) => {
    return (
        <div className={`group flex flex-col md:flex-row bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${listing.is_featured ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/10 dark:bg-slate-800/30' : 'border-slate-100 dark:border-slate-800/50'}`}>

            {/* Image Gallery */}
            <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                {listing.gallery.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`${listing.name} ${idx + 1}`}
                        className="w-full h-full object-cover flex-shrink-0 snap-center transition-transform duration-500"
                    />
                ))}
                {listing.is_featured && (
                    <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star size={12} className="fill-white" /> Featured
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {listing.name}
                                {listing.is_verified && (
                                    <BadgeCheck className="text-blue-500 w-5 h-5 flex-shrink-0" />
                                )}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-1">
                                <MapPin size={14} className="text-teal-600 dark:text-cyan-400 dark:text-slate-200" /> {listing.location}
                            </div>
                        </div>

                        {/* Price Level & Rating */}
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-100 dark:border-green-800/50 font-bold mb-1">
                                <Star size={14} className="fill-green-600 dark:fill-green-400 text-green-600 dark:text-green-400" />
                                {listing.reviews_average} <span className="text-green-600/60 dark:text-green-400/60 font-medium text-xs">({listing.reviews_count})</span>
                            </div>
                            {listing.price_level && (
                                <div className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <span key={i} className={i < listing.price_level! ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-400'}>$</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
                        {listing.short_description}
                    </p>

                    {/* Tags (Languages & Certifications) */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {listing.certifications?.map(cert => (
                            <span key={cert} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-slate-800/50 text-blue-700 dark:text-slate-200 text-xs font-medium border border-blue-100 dark:border-slate-700/50">
                                <ShieldCheck size={12} /> {cert}
                            </span>
                        ))}
                        {listing.languages_spoken?.map(lang => (
                            <span key={lang} className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/50">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions CTA */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button
                        onClick={() => window.open(`https://wa.me/${listing.whatsapp?.replace('+', '')}`, '_blank')}
                        className={`col-span-2 sm:col-span-1 w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-lg font-medium transition-colors shadow-sm shadow-[#25D366]/20 font-sans ${!listing.whatsapp ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!listing.whatsapp}
                    >
                        <MessageCircle size={18} />
                        Contact via WhatsApp
                    </button>

                    <button
                        onClick={() => listing.website && window.open(listing.website, '_blank')}
                        className={`w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors ${!listing.website ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!listing.website}
                    >
                        <Globe size={18} />
                        Website
                    </button>

                    <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                        onClick={() => {
                            if (listing.google_map_url) {
                                window.open(listing.google_map_url, '_blank');
                            } else {
                                // Fallback: search Google Maps by name and location
                                const query = encodeURIComponent(`${listing.name} ${listing.location}`);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }
                        }}
                    >
                        <MapPin size={18} />
                        Map
                    </button>
                </div>
            </div>
        </div>
    );
};
