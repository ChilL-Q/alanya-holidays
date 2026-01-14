import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useTheme } from '../../context/ThemeContext';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem'
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

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    onAddressSelect?: (address: string, city?: string) => void;
    initialLocation?: { lat: number, lng: number };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, onAddressSelect, initialLocation }) => {
    const { theme } = useTheme();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
        initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
    );

    const center = useMemo(() => {
        return initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : AlanyaCenter;
    }, [initialLocation]);

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });
            onLocationSelect(lat, lng);

            // Reverse Geocoding
            if (onAddressSelect && window.google) {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const address = results[0].formatted_address;

                        // Try to extract city/district (administrative_area_level_2 or locality)
                        let city = '';
                        const addressComponents = results[0].address_components;
                        const districtComponent = addressComponents.find(c => c.types.includes('sublocality') || c.types.includes('administrative_area_level_2'));
                        const cityComponent = addressComponents.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_1'));

                        // Prefer district (e.g. Mahmutlar) over city (Alanya), or city over province
                        city = districtComponent ? districtComponent.long_name : (cityComponent ? cityComponent.long_name : '');

                        onAddressSelect(address, city);
                    } else {
                        console.warn('Geocoder failed due to: ' + status);
                    }
                });
            }
        }
    }, [onLocationSelect, onAddressSelect]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>;

    const mapOptions = {
        styles: theme === 'dark' ? darkMapStyles : undefined,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        draggableCursor: 'crosshair'
    };

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-600 z-0">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={13}
                onClick={handleMapClick}
                options={mapOptions}
            >
                {markerPosition && (
                    <MarkerF
                        position={markerPosition}
                        animation={google.maps.Animation.DROP}
                    />
                )}
            </GoogleMap>
        </div>
    );
};
