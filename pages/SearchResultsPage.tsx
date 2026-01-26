import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Filter, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PropertyCard } from '../components/ui/PropertyCard';
import { Map } from '../components/ui/Map';
import { PropertyFilters } from '../components/ui/PropertyFilters';
import { usePropertyFilters } from '../hooks/usePropertyFilters';

export const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const location = searchParams.get('location');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const { t } = useLanguage();

    const [showMap, setShowMap] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const {
        filteredProperties,
        isLoading,
        filters,
        setFilters,
        activeFilterCount
    } = usePropertyFilters({ checkIn, checkOut, location, guests });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-16 transition-colors relative">
            <PropertyFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFilterChange={setFilters}
            />

            {/* Main Layout Container */}
            <div className={showMap ? "h-[calc(100vh-130px)] overflow-hidden flex flex-col lg:flex-row" : "min-h-screen pb-16"}>

                {/* List Column */}
                <div className={`${showMap ? 'w-full lg:w-[58%] h-full flex flex-col' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>

                    {/* Header & Filters (Fixed in Split View) */}
                    <div className={`flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${showMap ? 'px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-10' : 'mb-8 pt-8'}`}>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                                {location ? `Stays in "${location}"` : 'All Stays in Alanya'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
                                {filteredProperties.length} properties found • {checkIn && checkOut ? `${checkIn} - ${checkOut}` : 'Any dates'} • {guests || 1} guests
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowMap(!showMap)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:shadow-sm transition-all font-medium text-sm ${showMap ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'}`}
                            >
                                <MapPin size={16} />
                                {showMap ? t('search.show_list') : t('search.show_map')}
                            </button>
                            <button
                                onClick={() => setShowFilters(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:shadow-sm transition-all font-medium text-slate-700 dark:text-slate-200 text-sm"
                            >
                                <Filter size={16} />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500">Loading stays...</div>
                    ) : (
                        <div className={`flex-1 ${showMap ? 'overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''}`}>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${!showMap ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'} gap-8 pb-20`}>
                                {filteredProperties.map((property, index) => (
                                    <div
                                        key={property.id}
                                        className="animate-fade-up opacity-0 fill-mode-forwards"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <PropertyCard property={property} />
                                    </div>
                                ))}
                            </div>

                            {!filteredProperties.length && (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Filter size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No properties match your filters</h3>
                                    <button
                                        onClick={() => setFilters({
                                            priceRange: [0, 0],
                                            types: [],
                                            amenities: [],
                                            minGuests: 1,
                                            minBedrooms: 0,
                                            minBeds: 1,
                                            minBathrooms: 1,
                                            hasPhotos: false
                                        })}
                                        className="text-teal-600 hover:text-teal-700 font-bold hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Map Column (Fixed height, no scroll) */}
                {showMap && (
                    <>
                        {/* Desktop Side Map */}
                        <div className="hidden lg:block w-[42%] h-full border-l border-slate-200 dark:border-slate-800 relative z-0">
                            <Map properties={filteredProperties} />
                        </div>

                        {/* Mobile Overlay Map */}
                        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm z-10">
                                <h3 className="font-bold text-lg">Map View</h3>
                                <button
                                    onClick={() => setShowMap(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 relative">
                                <Map properties={filteredProperties} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};
