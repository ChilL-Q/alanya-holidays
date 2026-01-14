import React, { useMemo, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

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
        stylers: [{ color: "#d59563" }],
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

import { PropertyData } from '../../services/db';

interface MapProps {
    properties: PropertyData[];
}

export const Map: React.FC<MapProps> = ({ properties }) => {
    const { theme } = useTheme();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);

    // Generate mock coordinates if missing
    const getCoords = useCallback((p: PropertyData) => {
        if (p.latitude && p.longitude) return { lat: p.latitude, lng: p.longitude };

        // Deterministic pseudo-random based on ID (or title if ID missing in strict type, but ID should be there)
        // We'll cast to 'any' for the ID check since PropertyData might not strictly have 'id' optional in interface but usually has it from DB
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

        // Single property or multiple
        if (properties.length === 1) {
            return getCoords(properties[0]);
        }

        const coords = properties.map(getCoords);
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

        return { lat: avgLat, lng: avgLng };
    }, [properties, getCoords]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        // const bounds = new window.google.maps.LatLngBounds(center);
        // map.fitBounds(bounds);
        // We set center via prop, so manual bounds fitting is optional unless we want strict bounds
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        // cleanup
    }, []);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>;

    const mapOptions = {
        styles: theme === 'dark' ? darkMapStyles : undefined,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
    };

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={properties.length === 1 ? 15 : 13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                {properties.map((property) => {
                    const position = getCoords(property);
                    return (
                        <MarkerF
                            key={property.id}
                            position={position}
                            onClick={() => setSelectedProperty(property)}
                        // Custom icon can be added here: icon={{ url: "...", scaledSize: ... }}
                        />
                    );
                })}

                {selectedProperty && (
                    <InfoWindowF
                        position={getCoords(selectedProperty)}
                        onCloseClick={() => setSelectedProperty(null)}
                    >
                        <div className="min-w-[200px] max-w-[250px] p-1 font-sans text-slate-900">
                            <div className="relative mb-2 rounded-lg overflow-hidden h-32 w-full">
                                <img
                                    src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'}
                                    alt={selectedProperty.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                                    ★ {selectedProperty.rating || 5.0}
                                </div>
                            </div>
                            <h3 className="font-bold text-sm mb-1 leading-tight line-clamp-1">{selectedProperty.title}</h3>
                            <p className="text-slate-500 text-xs mb-2 truncate">{selectedProperty.location}</p>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-teal-700 font-bold text-base">€{selectedProperty.price_per_night}<span className="text-xs text-slate-400 font-normal">/night</span></p>
                                <Link
                                    to={`/property/${selectedProperty.id}`}
                                    className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors no-underline block"
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    </InfoWindowF>
                )}
            </GoogleMap>
        </div>
    );
};
