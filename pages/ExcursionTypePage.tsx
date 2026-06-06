import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { DirectoryListingCard } from '../components/directory/DirectoryListingCard';
import { DirectoryListingModal } from '../components/directory/DirectoryListingModal';
import { DirectoryListingDB } from '../types/models';
import { db } from '../api-services';
import { getExcursionType, EXCURSION_TYPES } from '../data/excursionTypes';
import { getAttraction } from '../data/attractionPages';
import { Compass, MapPin, ChevronDown, ChevronUp, Info } from 'lucide-react';

const ExcursionTypePage: React.FC = () => {
    const slug = useLocation().pathname.slice(1); // pathname is "/alanya-boat-tours" → "alanya-boat-tours"
    const excursionType = getExcursionType(slug);

    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<DirectoryListingDB | null>(null);
    const [showFullDescription, setShowFullDescription] = useState(false);

    useEffect(() => {
        if (!excursionType) return;
        const fetchListings = async () => {
            setLoading(true);
            try {
                const primaryQuery = excursionType.searchKeywords[0] || excursionType.title;
                const result = await db.searchDirectoryListings(primaryQuery, 'tours');
                if (result.data.length > 0) {
                    setListings(result.data);
                } else {
                    const fallbackQuery = excursionType.title
                        .replace(' in Alanya', '')
                        .replace(' from Alanya', '');
                    const broader = await db.searchDirectoryListings(fallbackQuery, 'tours');
                    setListings(broader.data);
                }
            } catch (e) {
                console.error('Failed to load excursion listings', e);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [excursionType]);

    const handleListingClick = useCallback((listing: DirectoryListingDB) => {
        setSelectedListing(listing);
        const sessionKey = `listing_view_${listing.id}_${new Date().toISOString().slice(0, 10)}`;
        if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            db.trackListingView(listing.id).catch(console.error);
        }
    }, []);

    if (!excursionType) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <SEOHead title="Excursion Not Found" noIndex />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Excursion Type Not Found</h1>
                    <Link to="/things-to-do-in-alanya" className="text-teal-600 dark:text-cyan-400 hover:underline">
                        Browse all things to do in Alanya
                    </Link>
                </div>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: excursionType.title,
        description: excursionType.metaDescription,
        url: `https://alanya-holidays.com/${excursionType.slug}`,
        touristType: 'Adventure travel',
        tripOrigin: {
            '@type': 'City',
            name: 'Alanya',
        },
    };

    const otherExcursions = EXCURSION_TYPES.filter(et => et.slug !== excursionType.slug);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
            <SEOHead
                title={excursionType.metaTitle}
                description={excursionType.metaDescription}
                keywords={excursionType.keywords}
                jsonLd={jsonLd}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Things to Do', href: '/things-to-do-in-alanya' },
                        { label: excursionType.title },
                    ]}
                />
            </div>

            <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800/50 shadow-sm mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left md:py-16">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                        <Compass className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                            {excursionType.title}
                        </h1>
                    </div>
                    <div className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
                        <p className="mb-4">{excursionType.metaDescription}</p>
                        <div className={`transition-all duration-500 overflow-hidden text-left ${showFullDescription ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                            <p className="mb-4 text-base md:text-lg">{excursionType.longDescription}</p>
                        </div>
                        <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:text-cyan-400 font-semibold text-base mt-2 flex items-center justify-center md:justify-start gap-1 w-full md:w-auto"
                        >
                            {showFullDescription ? 'Read Less' : 'Read More'}
                            {showFullDescription ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">
                    Available Tours & Activities
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-white dark:bg-slate-800/80 rounded-2xl h-80 border border-slate-200 dark:border-slate-800/50" />
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map(listing => (
                            <DirectoryListingCard
                                key={listing.id}
                                listing={listing}
                                onClick={handleListingClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <Info className="w-16 h-16 text-slate-300 dark:text-slate-400 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            No tours available yet
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            We're adding more tours in this category. Check back soon or browse all things to do in Alanya.
                        </p>
                        <Link
                            to="/things-to-do-in-alanya"
                            className="mt-4 text-teal-600 dark:text-cyan-400 hover:underline font-medium"
                        >
                            Browse all things to do
                        </Link>
                    </div>
                )}

                <div className="mt-16 mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                        Other Excursion Types
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {otherExcursions.map(et => (
                            <Link
                                key={et.slug}
                                to={`/${et.slug}`}
                                className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all"
                            >
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">
                                    {et.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                    {et.metaDescription.slice(0, 100)}...
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Related Attractions */}
                {excursionType.relatedAttractions.length > 0 && (
                    <div className="mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                            Nearby Attractions
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {excursionType.relatedAttractions.map(attrSlug => {
                                const attr = getAttraction(attrSlug);
                                if (!attr) return null;
                                return (
                                    <Link
                                        key={attr.slug}
                                        to={`/${attr.slug}`}
                                        className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors text-sm">
                                                {attr.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {attr.metaDescription.slice(0, 100)}...
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <DirectoryListingModal
                listing={selectedListing}
                isOpen={!!selectedListing}
                onClose={() => setSelectedListing(null)}
            />
        </div>
    );
};

export { ExcursionTypePage };