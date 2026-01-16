import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Property } from '../../types/index';

interface PropertyCardProps {
    property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
    const { t } = useLanguage();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { convertPrice, formatPrice } = useCurrency();
    const [isHovered, setIsHovered] = React.useState(false);

    const isLiked = isFavorite(property.id);

    return (
        <Link
            to={`/property/${property.id}`}
            className="group block bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover-lift border border-slate-100 dark:border-slate-800 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rating Badge */}
                <div className="absolute top-3 left-3 glass px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold text-slate-900 shadow-sm z-10 transition-transform duration-300 group-hover:scale-110">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {property.rating}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(property.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 z-10 ${isLiked
                        ? 'bg-white text-rose-500 shadow-md scale-110'
                        : 'glass text-slate-700 hover:bg-white hover:text-rose-500 hover:scale-110'
                        } active:scale-90`}
                >
                    <Heart size={18} className={isLiked ? 'fill-rose-500' : ''} />
                </button>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg line-clamp-1 group-hover:text-primary transition">{property.title}</h3>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
                    <MapPin size={14} />
                    {property.location}
                </div>
                <div className="flex items-end justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-900 dark:text-white">{property.bedrooms}</span> beds • <span className="font-medium text-slate-900 dark:text-white">{property.guests}</span> guests
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white text-lg">
                            {formatPrice(convertPrice(property.pricePerNight, 'EUR'))}
                        </p>
                        <p className="text-xs text-slate-400">{t('featured.night')}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
