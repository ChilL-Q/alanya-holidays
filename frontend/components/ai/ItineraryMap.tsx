import React, { useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import type { ItineraryItem } from '../../types/models';

const ALANYA_CENTER = { lat: 36.54375, lng: 31.99982 };
const DAY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

interface MapItem extends ItineraryItem {
    dayIndex: number;
}

interface Props {
    items: MapItem[];
}

export const ItineraryMap: React.FC<Props> = ({ items }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    const [selected, setSelected] = useState<MapItem | null>(null);

    const center = useMemo(() => {
        if (items.length > 0 && items[0].lat != null && items[0].lng != null) {
            return { lat: items[0].lat, lng: items[0].lng };
        }
        return ALANYA_CENTER;
    }, [items]);

    if (loadError) {
        return (
            <div className="w-full h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                Map unavailable
            </div>
        );
    }

    if (!isLoaded) {
        return <div className="w-full h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
    }

    return (
        <GoogleMap
            mapContainerClassName="w-full h-80 rounded-2xl overflow-hidden"
            center={center}
            zoom={13}
        >
            {items.map((item, i) => (
                item.lat != null && item.lng != null && (
                    <MarkerF
                        key={`${item.dayIndex}-${i}`}
                        position={{ lat: item.lat, lng: item.lng }}
                        label={{
                            text: String(i + 1),
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 'bold',
                        }}
                        icon={{
                            // Circle path centered at origin — labelOrigin defaults to (0,0)
                            path: 'M 0,-13 A 13,13 0 1,0 0,13 A 13,13 0 1,0 0,-13 Z',
                            fillColor: DAY_COLORS[item.dayIndex % DAY_COLORS.length],
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                            scale: 1,
                        }}
                        onClick={() => setSelected(item)}
                    />
                )
            ))}
            {selected && selected.lat != null && selected.lng != null && (
                <InfoWindowF
                    position={{ lat: selected.lat, lng: selected.lng }}
                    onCloseClick={() => setSelected(null)}
                >
                    <div className="max-w-xs p-1">
                        <p className="font-semibold text-sm text-slate-900">{selected.title}</p>
                        {selected.location && (
                            <p className="text-xs text-slate-500">{selected.location}</p>
                        )}
                        <p className="text-xs mt-1 text-slate-600">{selected.description}</p>
                    </div>
                </InfoWindowF>
            )}
        </GoogleMap>
    );
};
