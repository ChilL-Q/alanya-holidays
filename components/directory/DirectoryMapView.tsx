import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useTheme } from '../../context/ThemeContext';
import { DirectoryListingDB } from '../../types/models';
import { Star, MapPin, Navigation, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import toast from 'react-hot-toast';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1rem'
};

const AlanyaCenter = {
    lat: 36.543750,
    lng: 31.999820
};

// Dark Mode Styles for Google Maps
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

export interface FilterState {
    locationFilter: string;
    verifiedOnly: boolean;
    minRating: number;
    maxPriceLevel: number;
    sortBy: string;
    locationOptions: string[];
}

export interface FilterActions {
    setLocationFilter: (v: string) => void;
    setVerifiedOnly: (v: boolean) => void;
    setMinRating: (v: number) => void;
    setMaxPriceLevel: (v: number) => void;
    setSortBy: (v: string) => void;
    clearFilters: () => void;
}

interface DirectoryMapViewProps {
    listings: DirectoryListingDB[];
    onListingClick: (listing: DirectoryListingDB) => void;
    filters: FilterState;
    filterActions: FilterActions;
    activeFilterCount: number;
}

interface ListingWithCoords extends DirectoryListingDB {
    lat: number;
    lng: number;
}

function extractCoordsFromUrl(url: string | undefined): { lat: number; lng: number } | null {
    if (!url) return null;

    // Pattern: @lat,lng,zoom
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Pattern: ?q=lat,lng or &q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Pattern: query=lat,lng
    const queryMatch = url.match(/[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (queryMatch) {
        return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    }

    return null;
}

function getDeterministicCoords(listing: DirectoryListingDB): { lat: number; lng: number } {
    const fromUrl = extractCoordsFromUrl(listing.google_map_url);
    if (fromUrl) return fromUrl;

    const seed = (listing.id || 'default').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const latOffset = Math.sin(seed) * 0.04;
    const lngOffset = Math.cos(seed) * 0.04;

    return {
        lat: AlanyaCenter.lat + latOffset,
        lng: AlanyaCenter.lng + lngOffset
    };
}

export const DirectoryMapView: React.FC<DirectoryMapViewProps> = ({ listings, onListingClick, filters, filterActions, activeFilterCount }) => {
    const { theme } = useTheme();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);

    const [selectedListing, setSelectedListing] = useState<ListingWithCoords | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);

    const listingsWithCoords = useMemo(() => {
        return listings.map(l => {
            const coords = getDeterministicCoords(l);
            return { ...l, lat: coords.lat, lng: coords.lng };
        });
    }, [listings]);

    const center = useMemo(() => {
        if (userLocation) return userLocation;
        if (listingsWithCoords.length === 0) return AlanyaCenter;
        if (listingsWithCoords.length === 1) {
            return { lat: listingsWithCoords[0].lat, lng: listingsWithCoords[0].lng };
        }
        const avgLat = listingsWithCoords.reduce((sum, l) => sum + l.lat, 0) / listingsWithCoords.length;
        const avgLng = listingsWithCoords.reduce((sum, l) => sum + l.lng, 0) / listingsWithCoords.length;
        return { lat: avgLat, lng: avgLng };
    }, [listingsWithCoords, userLocation]);

    const handleMarkerClick = useCallback((listing: ListingWithCoords) => {
        setSelectedListing(listing);
    }, []);

    const handleMapClick = useCallback(() => {
        setSelectedListing(null);
    }, []);

    const handleNearMe = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(loc);
                setLocating(false);
                if (mapRef.current) {
                    mapRef.current.panTo(loc);
                    mapRef.current.setZoom(14);
                }
            },
            (_err) => {
                setLocating(false);
                toast.error('Unable to retrieve your location');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    // Initialize / update marker clusterer
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;

        // Clear old markers
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        const newMarkers: google.maps.Marker[] = [];
        const map = mapRef.current;

        listingsWithCoords.forEach(listing => {
            const marker = new google.maps.Marker({
                position: { lat: listing.lat, lng: listing.lng },
                map,
                title: listing.name,
                icon: {
                    url: listing.is_featured
                        ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                                <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#f59e0b"/>
                                <circle cx="18" cy="18" r="8" fill="white"/>
                            </svg>`
                        )
                        : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                                <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#0d9488"/>
                                <circle cx="18" cy="18" r="8" fill="white"/>
                            </svg>`
                        ),
                    scaledSize: new google.maps.Size(36, 44),
                    anchor: new google.maps.Point(18, 44)
                }
            });

            marker.addListener('click', () => {
                handleMarkerClick(listing);
            });

            newMarkers.push(marker);
        });

        markersRef.current = newMarkers;

        clustererRef.current = new MarkerClusterer({
            map,
            markers: newMarkers,
            algorithmOptions: {
                maxZoom: 15
            },
            renderer: {
                render: ({ count, position }) => {
                    const size = count < 10 ? 36 : count < 100 ? 44 : 52;
                    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#0d9488" stroke="white" stroke-width="3"/>
                        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="${size < 40 ? 14 : 16}" font-weight="bold">${count}</text>
                    </svg>`;
                    return new google.maps.Marker({
                        position,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
                            scaledSize: new google.maps.Size(size, size),
                            anchor: new google.maps.Point(size / 2, size / 2)
                        },
                        zIndex: 1000 + count
                    });
                }
            }
        });

        return () => {
            clustererRef.current?.clearMarkers();
            markersRef.current.forEach(m => m.setMap(null));
        };
    }, [isLoaded, listingsWithCoords, handleMarkerClick]);

    if (!isLoaded) {
        return (
            <div className="w-full h-[600px] bg-slate-100 dark:bg-slate-800/80 animate-pulse rounded-2xl flex items-center justify-center">
                <span className="text-slate-400 dark:text-slate-500 text-sm">Loading map...</span>
            </div>
        );
    }

    const mapOptions = {
        styles: theme === 'dark' ? darkMapStyles : undefined,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        clickableIcons: false,
    };

    return (
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800/50">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={userLocation ? 14 : 13}
                options={mapOptions}
                onClick={handleMapClick}
                onLoad={(map) => { mapRef.current = map; }}
                onUnmount={() => { mapRef.current = null; }}
            >
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
                                </svg>`
                            ),
                            scaledSize: new google.maps.Size(20, 20),
                            anchor: new google.maps.Point(10, 10)
                        }}
                    />
                )}
            </GoogleMap>

            {/* Near Me Button */}
            <button
                onClick={handleNearMe}
                disabled={locating}
                className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm disabled:opacity-60"
            >
                <Navigation size={16} className={locating ? 'animate-spin' : ''} />
                {locating ? 'Locating...' : 'Near Me'}
            </button>

            {/* Filters Button */}
            <button
                onClick={() => setPanelOpen(prev => !prev)}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
            >
                <SlidersHorizontal size={16} />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>

            {/* Filter Panel */}
            {panelOpen && (
                <div className="absolute top-16 left-4 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-4 w-72 max-w-xs">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filter Listings</h3>
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Location */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Location</label>
                            <div className="relative">
                                <select
                                    name="filter-location"
                                    value={filters.locationFilter}
                                    onChange={(e) => filterActions.setLocationFilter(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="all">All Locations</option>
                                    {filters.locationOptions.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Price Level */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Price Level</label>
                            <div className="relative">
                                <select
                                    name="filter-price-level"
                                    value={filters.maxPriceLevel}
                                    onChange={(e) => filterActions.setMaxPriceLevel(Number(e.target.value))}
                                    className="w-full pl-3 pr-8 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value={4}>Any Price</option>
                                    <option value={1}>$ (Budget)</option>
                                    <option value={2}>$$ (Moderate)</option>
                                    <option value={3}>$$$ (Premium)</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Min Rating */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Min Rating</label>
                            <div className="relative">
                                <select
                                    name="filter-min-rating"
                                    value={filters.minRating}
                                    onChange={(e) => filterActions.setMinRating(Number(e.target.value))}
                                    className="w-full pl-3 pr-8 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value={0}>Any Rating</option>
                                    <option value={4.0}>4.0+ Stars</option>
                                    <option value={4.5}>4.5+ Stars</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Sort By</label>
                            <div className="relative">
                                <select
                                    name="filter-sort"
                                    value={filters.sortBy}
                                    onChange={(e) => filterActions.setSortBy(e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 appearance-none rounded-lg border border-slate-300 dark:border-slate-700/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="recommended">Recommended</option>
                                    <option value="most_upvoted">Most Upvoted</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Verified Only */}
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-sm">
                            <input
                                type="checkbox"
                                checked={filters.verifiedOnly}
                                onChange={(e) => filterActions.setVerifiedOnly(e.target.checked)}
                                className="w-4 h-4 text-teal-600 dark:text-cyan-400 rounded border-slate-300 focus:ring-teal-500"
                            />
                            Verified Only
                        </label>

                        {/* Clear All */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={filterActions.clearFilters}
                                className="w-full text-sm text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 font-medium py-2 border border-teal-200 dark:border-cyan-900/30 rounded-lg hover:bg-teal-50 dark:hover:bg-cyan-900/10 transition-colors"
                            >
                                Clear All ({activeFilterCount})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Listing Card */}
            {selectedListing && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                        {/* Image */}
                        <div className="relative h-40 bg-slate-200 dark:bg-slate-800">
                            <img
                                src={selectedListing.gallery?.[0] || 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb'}
                                alt={selectedListing.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setSelectedListing(null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                            >
                                <X size={14} />
                            </button>
                            {selectedListing.is_featured && (
                                <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Star size={10} className="fill-white" /> Featured
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{selectedListing.name}</h3>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-2">
                                <MapPin size={12} />
                                <span className="truncate">{selectedListing.location}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-3">
                                {selectedListing.short_description}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star size={14} className="fill-amber-500" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {selectedListing.reviews_average?.toFixed(1) || 'New'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        ({selectedListing.reviews_count || 0})
                                    </span>
                                </div>
                                <button
                                    onClick={() => onListingClick(selectedListing)}
                                    className="text-sm font-semibold text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors"
                                >
                                    View Details →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
