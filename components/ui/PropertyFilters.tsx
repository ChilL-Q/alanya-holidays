import React from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AMENITIES_LIST } from '../../data/constants';
import { Counter } from './Counter';

export interface FilterState {
    priceRange: [number, number];
    types: string[];
    amenities: string[];
    minGuests: number;
    minBedrooms: number;
    minBeds: number;
    minBathrooms: number;
    hasPhotos: boolean;
}

interface PropertyFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    maxPrice?: number;
}

const PROPERTY_TYPES = ['Apartment', 'Villa'];

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    maxPrice = 1000
}) => {
    const { t } = useLanguage();

    // Prevent scrolling when open
    // Prevent scrolling when open & Handle Esc key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const handleTypeToggle = (type: string) => {
        const newTypes = filters.types.includes(type)
            ? filters.types.filter(t => t !== type)
            : [...filters.types, type];
        onFilterChange({ ...filters, types: newTypes });
    };

    const handleAmenityToggle = (amenityLabel: string) => {
        const newAmenities = filters.amenities.includes(amenityLabel)
            ? filters.amenities.filter(a => a !== amenityLabel)
            : [...filters.amenities, amenityLabel];
        onFilterChange({ ...filters, amenities: newAmenities });
    };

    const handlePriceChange = (index: 0 | 1, value: string) => {
        const val = parseInt(value) || 0;
        const newRange = [...filters.priceRange] as [number, number];
        newRange[index] = val;
        onFilterChange({ ...filters, priceRange: newRange });
    };

    return (
        <div className={`fixed inset-0 z-50 flex justify-end transition-visibility duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`
                relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col
                transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-full transition-colors"
                    >
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Price Range */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Price Range (Per Night)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label htmlFor="filter-price-min" className="text-xs text-slate-500 mb-1 block">Min Price (€)</label>
                                <input
                                    type="number"
                                    id="filter-price-min"
                                    name="minPrice"
                                    value={filters.priceRange[0] || ''}
                                    onChange={(e) => handlePriceChange(0, e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800/50 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="filter-price-max" className="text-xs text-slate-500 mb-1 block">Max Price (€)</label>
                                <input
                                    type="number"
                                    id="filter-price-max"
                                    name="maxPrice"
                                    value={filters.priceRange[1] || ''}
                                    onChange={(e) => handlePriceChange(1, e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="Any"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800/50 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-100 dark:border-slate-800/50" />

                    {/* Capacity */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Capacity</h3>
                        <div className="space-y-1">
                            <Counter
                                label="Guests"
                                value={filters.minGuests}
                                onChange={(val) => onFilterChange({ ...filters, minGuests: val })}
                                min={1}
                            />
                            <Counter
                                label="Bedrooms"
                                value={filters.minBedrooms}
                                onChange={(val) => onFilterChange({ ...filters, minBedrooms: val })}
                            />
                            <Counter
                                label="Beds"
                                value={filters.minBeds}
                                onChange={(val) => onFilterChange({ ...filters, minBeds: val })}
                            />
                            <Counter
                                label="Bathrooms"
                                value={filters.minBathrooms}
                                onChange={(val) => onFilterChange({ ...filters, minBathrooms: val })}
                            />
                        </div>
                    </section>

                    <hr className="border-slate-100 dark:border-slate-800/50" />

                    {/* Property Type */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Property Type</h3>
                        <div className="space-y-3">
                            {PROPERTY_TYPES.map(type => (
                                <label key={type} htmlFor={`filter-type-${type}`} className="flex items-center cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3 ${filters.types.includes(type)
                                        ? 'bg-teal-600 dark:bg-cyan-600 border-teal-600'
                                        : 'border-slate-300 dark:border-slate-700/50 group-hover:border-teal-500'
                                        }`}>
                                        {filters.types.includes(type) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        id={`filter-type-${type}`}
                                        name="propertyType"
                                        value={type}
                                        className="hidden"
                                        checked={filters.types.includes(type)}
                                        onChange={() => handleTypeToggle(type)}
                                    />
                                    <span className="text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:text-cyan-400 transition-colors">
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>

                    <hr className="border-slate-100 dark:border-slate-800/50" />

                    {/* Features */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Features</h3>
                        <label htmlFor="filter-has-photos" className="flex items-center cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3 ${filters.hasPhotos
                                ? 'bg-teal-600 dark:bg-cyan-600 border-teal-600'
                                : 'border-slate-300 dark:border-slate-700/50 group-hover:border-teal-500'
                                }`}>
                                {filters.hasPhotos && <Check size={12} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                id="filter-has-photos"
                                name="hasPhotos"
                                className="hidden"
                                checked={filters.hasPhotos}
                                onChange={() => onFilterChange({ ...filters, hasPhotos: !filters.hasPhotos })}
                            />
                            <span className="text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:text-cyan-400 transition-colors">
                                Has Photos
                            </span>
                        </label>
                    </section>

                    <hr className="border-slate-100 dark:border-slate-800/50" />


                    {/* Amenities */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {AMENITIES_LIST.map(amenity => (
                                <label key={amenity.label} htmlFor={`filter-amenity-${amenity.label}`} className="flex items-center cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3 ${filters.amenities.includes(amenity.label)
                                        ? 'bg-teal-600 dark:bg-cyan-600 border-teal-600'
                                        : 'border-slate-300 dark:border-slate-700/50 group-hover:border-teal-500'
                                        }`}>
                                        {filters.amenities.includes(amenity.label) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        id={`filter-amenity-${amenity.label}`}
                                        name="amenity"
                                        value={amenity.label}
                                        className="hidden"
                                        checked={filters.amenities.includes(amenity.label)}
                                        onChange={() => handleAmenityToggle(amenity.label)}
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-teal-600 dark:text-cyan-400 transition-colors">
                                        {t(amenity.label)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex gap-4">
                        <button
                            onClick={() => onFilterChange({
                                priceRange: [0, 0],
                                types: [],
                                amenities: [],
                                minGuests: 1,
                                minBedrooms: 0,
                                minBeds: 1,
                                minBathrooms: 1,
                                hasPhotos: false
                            })}
                            className="px-6 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
