import React, { useState } from 'react';
import { MapPin, Star, Camera } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useLightbox } from '../../../context/LightboxContext';

interface PropertyGalleryProps {
    images: string[];
    title: string;
    location: string;
    rating: number;
    reviewsCount: number;
}

const MAIN_FALLBACK = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop';

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, title, location, rating, reviewsCount }) => {
    const { t } = useLanguage();
    const { openLightbox } = useLightbox();
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    const hasImages = images && images.length > 0;
    const isSingleImage = images.length === 1;

    return (
        <div className={`grid gap-2 h-[250px] md:h-[500px] relative animate-fade-in text-white overflow-hidden ${isSingleImage ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Left: Main Image */}
            <div
                className="relative h-full w-full overflow-hidden group cursor-zoom-in"
                onClick={() => openLightbox(images || [], 0)}
            >
                <img
                    src={(hasImages && !imageErrors[0]) ? images[0] : MAIN_FALLBACK}
                    className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                    alt="Main"
                    onError={() => setImageErrors(prev => ({ ...prev, 0: true }))}
                />
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                {/* Desktop Title Card */}
                <div
                    className="hidden md:block absolute bottom-6 left-6 max-w-lg cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {title || 'Unknown Property'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 dark:text-slate-300 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <MapPin size={16} className="text-teal-500 dark:text-cyan-400" />
                                {location || 'No location'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Star size={16} className="fill-orange-400 text-orange-400" />
                                {reviewsCount > 0 ? `${rating.toFixed(1)} (${reviewsCount} reviews)` : <span className="text-sm font-bold bg-teal-600 dark:bg-cyan-600 text-white px-2 py-0.5 rounded-md">New</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Grid of Extra Images */}
            {images.length > 1 && (
                <div className={`hidden md:grid gap-2 h-full overflow-hidden ${images.length === 2 ? 'grid-cols-1' :
                    images.length === 3 ? 'grid-cols-1 grid-rows-2' :
                        'grid-cols-2 grid-rows-2'
                    }`}>
                    {images.slice(1, 5).map((img, i) => {
                        const imgIndex = i + 1;
                        const isLast = i === (Math.min(4, images.length - 1) - 1);
                        const remainingCount = Math.max(0, images.length - 5);

                        return (
                            <div
                                key={i}
                                className="relative overflow-hidden group h-full w-full cursor-zoom-in bg-slate-200 dark:bg-slate-800/80"
                                onClick={() => openLightbox(images, imgIndex)}
                            >
                                <img
                                    src={img}
                                    className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                                    alt={`Gallery ${i}`}
                                    onError={() => setImageErrors(prev => ({ ...prev, [imgIndex]: true }))}
                                />
                                {isLast && remainingCount > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center transition-colors z-10 text-white font-medium cursor-pointer">
                                        <div className="w-full h-full bg-black/50 hover:bg-black/60 flex items-center justify-center text-lg">
                                            +{remainingCount} more
                                        </div>
                                    </div>
                                )}
                                {isLast && remainingCount === 0 && i === 3 && (
                                    <div className="absolute inset-0 flex items-center justify-center transition-colors z-10 text-white font-medium cursor-pointer opacity-0 group-hover:opacity-100">
                                        <div className="w-full h-full bg-black/20 flex items-center justify-center gap-2">
                                            <Camera size={20} />
                                            {t('prop.view_photos')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Mobile "View Photos" button */}
            <div className="md:hidden absolute bottom-4 right-4 z-10">
                <button
                    onClick={() => openLightbox(images, 0)}
                    className="bg-black/70 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                    <Camera size={16} />
                    {images.length} Photos
                </button>
            </div>
        </div>
    );
};
