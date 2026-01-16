import { useMemo } from 'react';
import { ServiceData } from '../services/db';

export interface CarGroup {
    id: string; // generated slug
    title: string;
    brand: string;
    model: string;
    year: string;
    minPrice: number;
    image: string;
    count: number;
    features: string[];
}

export const useCarAggregation = (services: ServiceData[]) => {
    return useMemo(() => {
        const groups: Record<string, CarGroup> = {};

        services.forEach((service) => {
            const features = service.features || {};
            const brand = features.brand || 'Unknown';
            const model = features.model || 'Model';
            const key = `${brand}-${model}`.toLowerCase();
            const title = `${brand} ${model}`;
            const price = service.price;
            const image = service.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2940&auto=format&fit=crop'; // Fallback

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    title: title,
                    brand: brand,
                    model: model,
                    year: features.year || '',
                    minPrice: price,
                    image: image,
                    count: 1,
                    features: [features.transmission, features.fuel].filter(Boolean) as string[]
                };
            } else {
                groups[key].count += 1;
                if (price < groups[key].minPrice) {
                    groups[key].minPrice = price;
                }
                // Update image to current (older) service to eventually show the oldest one
                groups[key].image = image;
            }
        });

        return Object.values(groups);
    }, [services]);
};
