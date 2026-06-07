import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Star, Info, ChevronDown, Map as MapIcon, List } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { Breadcrumb } from '../components/seo/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { DirectoryListingCard } from '../components/directory/DirectoryListingCard';
import { DirectoryListingModal } from '../components/directory/DirectoryListingModal';
import { DirectoryMapView } from '../components/directory/DirectoryMapView';
import { db } from '../api-services';
import { DirectoryListingDB } from '../types/models';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_I18N_KEYS: Record<string, string> = {
    'medical': 'dir.cat.medical',
    'accommodations': 'dir.cat.accommodations',
    'tours': 'dir.cat.tours',
    'transport': 'dir.cat.transport',
    'restaurants': 'dir.cat.restaurants',
    'cafes': 'dir.cat.cafes',
    'nature': 'dir.cat.nature',
    'spa-hamam': 'dir.cat.spa_hamam',
    'hair-beauty': 'dir.cat.hair_beauty',
    'real-estate': 'dir.cat.realestate',
    'visa': 'dir.cat.visa',
    'shopping': 'dir.cat.shopping',
};

export const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const location = searchParams.get('location') || '';
    const { t } = useLanguage();

    const getCategoryName = (categoryId: string) => {
        const key = CATEGORY_I18N_KEYS[categoryId];
        return key ? t(key) : categoryId;
    };

    const totalRef = useRef(0);

    const [locationFilter, setLocationFilter] = useState('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [minRating, setMinRating] = useState<number>(0);
    const [maxPriceLevel, setMaxPriceLevel] = useState<number>(4);
    const [languageFilter, setLanguageFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recommended');
    const [selectedListing, setSelectedListing] = useState<DirectoryListingDB | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // Data State
    const [listings, setListings] = useState<DirectoryListingDB[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Auth & Voting State
    const { isAuthenticated, user } = useAuth();
    const [userVotes, setUserVotes] = useState<Record<string, 1 | -1>>({});
    const [votingId, setVotingId] = useState<string | null>(null);

    // Fetch from Supabase
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [result, locs] = await Promise.all([
                    db.searchDirectoryListings(q, category || undefined, location || undefined),
                    db.getLocations()
                ]);
                setListings(result.data || []);
                totalRef.current = result.total;
                setLocations(locs.map(l => l.name));
            } catch (e) {
                console.error('Failed to load search results', e);
                toast.error('Failed to load search results');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [q, category, location]);

    // Fetch user's votes
    useEffect(() => {
        if (!isAuthenticated || !user || listings.length === 0) return;
        const ids = listings.map(l => l.id);
        db.getUserVotesBatch(ids).then(setUserVotes).catch(e => console.error('Failed to load votes:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user?.id, listings.length]);

    const handleVote = useCallback(async (listingId: string, vote: 1 | -1) => {
        if (!isAuthenticated || votingId) return;
        const currentVote = userVotes[listingId];
        const isToggleOff = currentVote === vote;
        setVotingId(listingId);
        try {
            if (isToggleOff) {
                const result = await db.removeListingVote(listingId);
                setUserVotes(prev => {
                    const next = { ...prev };
                    delete next[listingId];
                    return next;
                });
                setListings(prev => prev.map(l =>
                    l.id === listingId ? { ...l, net_votes: result.netVotes } : l
                ));
            } else {
                const result = await db.voteForListing(listingId, vote);
                setUserVotes(prev => ({ ...prev, [listingId]: result.userVote as 1 | -1 }));
                setListings(prev => prev.map(l =>
                    l.id === listingId ? { ...l, net_votes: result.netVotes } : l
                ));
            }
        } catch (error: unknown) {
            console.error('Failed to vote:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to vote');
        } finally {
            setVotingId(null);
        }
    }, [isAuthenticated, userVotes, votingId]);

    const handleListingClick = useCallback((listing: DirectoryListingDB) => {
        setSelectedListing(listing);
        const sessionKey = `listing_view_${listing.id}_${new Date().toISOString().slice(0, 10)}`;
        if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            db.trackListingView(listing.id).catch(console.error);
        }
    }, []);

    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        listings.forEach(d => {
            if (d.languages_spoken) {
                d.languages_spoken.forEach((l: string) => langs.add(l));
            }
        });
        return Array.from(langs).sort();
    }, [listings]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (locationFilter !== 'all') count++;
        if (verifiedOnly) count++;
        if (minRating > 0) count++;
        if (maxPriceLevel < 4) count++;
        if (languageFilter !== 'all') count++;
        if (sortBy !== 'recommended') count++;
        return count;
    }, [locationFilter, verifiedOnly, minRating, maxPriceLevel, languageFilter, sortBy]);

    const clearFilters = useCallback(() => {
        setLocationFilter('all');
        setVerifiedOnly(false);
        setMinRating(0);
        setMaxPriceLevel(4);
        setLanguageFilter('all');
        setSortBy('recommended');
    }, []);

    const filteredData = useMemo(() => {
        let data = listings;
        if (locationFilter !== 'all') {
            data = data.filter(item => item.location === locationFilter);
        }
        if (verifiedOnly) {
            data = data.filter(item => item.is_verified);
        }
        if (minRating > 0) {
            data = data.filter(item => (item.reviews_average || 0) >= minRating);
        }
        if (maxPriceLevel < 4) {
            data = data.filter(item => (item.price_level || 4) <= maxPriceLevel);
        }
        if (languageFilter !== 'all') {
            data = data.filter(item => item.languages_spoken?.includes(languageFilter));
        }
        if (sortBy === 'most_upvoted') {
            data = [...data].sort((a, b) => (b.net_votes || 0) - (a.net_votes || 0));
        }
        return data;
    }, [listings, locationFilter, verifiedOnly, minRating, maxPriceLevel, languageFilter, sortBy]);

    const title = q
        ? `Search results for "${q}"`
        : category
            ? `Browse ${getCategoryName(category)}`
            : 'Browse All Listings';

    const featuredListings = filteredData.filter(item => item.is_featured);
    const standardListings = filteredData.filter(item => !item.is_featured);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
            <SEOHead
                title={`${title} - Alanya Holidays`}
                description={`Find the best businesses in Alanya${q ? ` matching "${q}"` : ''}. Browse verified listings with reviews and ratings.`}
            />

            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: q ? `Search: "${q}"` : 'Browse' },
                    ]}
                />
            </div>

            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {title}
                </h1>
                {totalRef.current > 0 && (
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        {totalRef.current} {totalRef.current === 1 ? 'result' : 'results'} found
                    </p>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Filter System */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        <Filter size={18} />
                        <h2>Filters ({filteredData.length} Results)</h2>
                    </div>

                    <div className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap items-center gap-4 w-full xl:w-auto scrollbar-hide">
                        <div className="relative shrink-0">
                            <select
                                name="filter-location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="pl-4 pr-10 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="all">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {availableLanguages.length > 0 && (
                            <div className="relative shrink-0">
                                <select
                                    name="filter-language"
                                    value={languageFilter}
                                    onChange={(e) => setLanguageFilter(e.target.value)}
                                    className="pl-4 pr-10 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="all">All Languages</option>
                                    {availableLanguages.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        )}

                        <div className="relative shrink-0">
                            <select
                                name="filter-min-rating"
                                value={minRating}
                                onChange={(e) => setMinRating(Number(e.target.value))}
                                className="pl-4 pr-10 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value={0}>Any Rating</option>
                                <option value={4.0}>4.0+ Stars</option>
                                <option value={4.5}>4.5+ Stars</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative shrink-0">
                            <select
                                name="filter-price-level"
                                value={maxPriceLevel}
                                onChange={(e) => setMaxPriceLevel(Number(e.target.value))}
                                className="pl-4 pr-10 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value={4}>Any Price</option>
                                <option value={1}>$ (Budget)</option>
                                <option value={2}>$$ (Moderate)</option>
                                <option value={3}>$$$ (Premium)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative shrink-0">
                            <select
                                name="filter-sort"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-4 pr-10 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                            >
                                <option value="recommended">Recommended</option>
                                <option value="most_upvoted">Most Upvoted</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700/50 shrink-0">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <List size={16} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    viewMode === 'map'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                <MapIcon size={16} /> Map
                            </button>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={verifiedOnly}
                                onChange={(e) => setVerifiedOnly(e.target.checked)}
                                className="w-4 h-4 text-teal-600 dark:text-cyan-400 rounded border-slate-300 focus:ring-teal-500"
                            />
                            Verified Only
                        </label>

                        {(locationFilter !== 'all' || verifiedOnly || minRating > 0 || maxPriceLevel < 4 || languageFilter !== 'all' || sortBy !== 'recommended') && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:text-cyan-400 font-medium whitespace-nowrap flex-shrink-0"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <Info className="w-16 h-16 text-slate-300 dark:text-slate-400 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {q ? `No results found for "${q}"` : 'No listings found'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <a
                            href="/search"
                            className="text-teal-600 dark:text-cyan-400 hover:text-teal-700 font-semibold"
                        >
                            Clear search
                        </a>
                    </div>
                ) : viewMode === 'list' ? (
                    <>
                        {/* Featured Listings */}
                        {featuredListings.length > 0 && (
                            <div className="mb-12">
                                <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">
                                    <Star className="text-amber-500 fill-amber-500" size={24} />
                                    Featured Providers
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {featuredListings.map(listing => (
                                        <DirectoryListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onClick={handleListingClick}
                                            userVote={userVotes[listing.id] ?? null}
                                            onVote={handleVote}
                                            isAuthenticated={isAuthenticated}
                                            isVoting={votingId === listing.id}
                                            categoryName={getCategoryName(listing.category_id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Standard Listings */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 px-2">
                                All Listings
                            </h2>
                            {standardListings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {standardListings.map(listing => (
                                        <DirectoryListingCard
                                            key={listing.id}
                                            listing={listing}
                                            onClick={handleListingClick}
                                            userVote={userVotes[listing.id] ?? null}
                                            onVote={handleVote}
                                            isAuthenticated={isAuthenticated}
                                            isVoting={votingId === listing.id}
                                            categoryName={getCategoryName(listing.category_id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800/80 border md:col-span-2 border-slate-200 dark:border-slate-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                                    <Info className="w-16 h-16 text-slate-300 dark:text-slate-400 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No standard listings found</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm">Try removing some filters or check our Featured items above.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <DirectoryMapView
                        listings={filteredData}
                        onListingClick={handleListingClick}
                        filters={{
                            locationFilter,
                            verifiedOnly,
                            minRating,
                            maxPriceLevel,
                            sortBy,
                            locationOptions: locations,
                        }}
                        filterActions={{
                            setLocationFilter,
                            setVerifiedOnly,
                            setMinRating,
                            setMaxPriceLevel,
                            setSortBy,
                            clearFilters,
                        }}
                        activeFilterCount={activeFilterCount}
                    />
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