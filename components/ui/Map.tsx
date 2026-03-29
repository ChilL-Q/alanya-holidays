import React, { useMemo, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, OverlayViewF } from '@react-google-maps/api';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types/models'; // Explicit import
import { Star, Users, Bed } from 'lucide-react';

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

interface MapProps {
    properties: any[];
}

export const Map: React.FC<MapProps> = ({ properties }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Generate mock coordinates if missing
    const getCoords = useCallback((p: Property) => {
        if (p.latitude && p.longitude) return { lat: p.latitude, lng: p.longitude };

        // Deterministic pseudo-random based on ID
        const seed = ((p as any).id || 'default').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const latOffset = (Math.sin(seed) * 0.04);
        const lngOffset = (Math.cos(seed) * 0.04);

        return {
            lat: AlanyaCenter.lat + latOffset,
            lng: AlanyaCenter.lng + lngOffset
        };
    }, []);

    const center = useMemo(() => {
        if (properties.length === 0) return AlanyaCenter;
        if (properties.length === 1) return getCoords(properties[0]);

        const coords = properties.map(getCoords);
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

        return { lat: avgLat, lng: avgLng };
    }, [properties, getCoords]);

    const onLoad = useCallback(function callback(_map: google.maps.Map) {
        // center logic handled by prop
    }, []);

    const onUnmount = useCallback(function callback(_map: google.maps.Map) {
        // cleanup
    }, []);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 dark:bg-slate-800/80 animate-pulse rounded-2xl"></div>;

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
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800/50">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={properties.length === 1 ? 15 : 13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
                onClick={() => setSelectedId(null)}
            >
                {properties.map((property) => {
                    const position = getCoords(property);
                    const isSelected = selectedId === property.id;

                    return (
                        <OverlayViewF
                            key={property.id}
                            position={position}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div
                                className={`relative transform -translate-x-1/2 -translate-y-full transition-all duration-200 cursor-pointer ${isSelected ? 'z-50 scale-110' : 'z-10 hover:z-50 hover:scale-110'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(isSelected ? null : property.id);
                                }}
                            >
                                {/* Pin Triangle for Pill */}
                                <div className={`
                                    absolute top-full left-1/2 -translate-x-1/2 -mt-2 w-3 h-3 rotate-45 transition-colors duration-200
                                    ${isSelected
                                        ? 'bg-teal-600 dark:bg-cyan-600 '
                                        : 'bg-white dark:bg-slate-800/80 border-r border-b border-slate-200 dark:border-slate-800/50'}
                                `}></div>

                                {/* Price Pill */}
                                <div className={`
                                    relative flex items-center justify-center px-4 py-2 rounded-full shadow-lg font-bold text-sm transition-all duration-200 z-10
                                    ${isSelected
                                        ? 'bg-teal-600 dark:bg-cyan-600 text-white ring-2 ring-white dark:ring-slate-900'
                                        : 'bg-white text-slate-900 dark:bg-slate-800/80 dark:text-white border border-slate-200 dark:border-slate-800/50'}
                                `}>
                                    €{Math.round(property.pricePerNight)}
                                </div>

                                {/* Detail Card (Click Sticky) */}
                                {isSelected && (
                                    <div
                                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/property/${property.id}`);
                                        }}
                                    >
                                        {/* Image */}
                                        <div className="h-40 w-full bg-slate-200 relative group overflow-hidden">
                                            <img
                                                src={property.images?.[0] || 'https://via.placeholder.com/300'}
                                                alt={property.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {/* Rating Badge */}
                                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {(property.rating || 0) > 0 ? (property.rating || 0).toFixed(1) : 'New'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight line-clamp-2">{property.title}</h3>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-3 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-cyan-600 "></span>
                                                {property.location}
                                            </p>

                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-xs font-medium border-t border-slate-100 dark:border-slate-800/50 pt-3">
                                                <div className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    <span>{property.guests} Guests</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bed size={14} />
                                                    <span>{property.bedrooms} Bed</span>
                                                </div>
                                                <div className="ml-auto font-bold text-teal-600 dark:text-cyan-400 dark:text-slate-200">
                                                    View Details →
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>
                        </OverlayViewF>
                    );
                })}
            </GoogleMap>
        </div>
    );
};
