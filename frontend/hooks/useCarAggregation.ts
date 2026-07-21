import { useMemo } from 'react';
import { ServiceData } from '../api-services';
import { getCarImage } from '../utils/carImages';

export interface CarGroup {
    id: string; // generated slug
    title: string;
    brand: string;
    model: string;
    year: string;
    minPrice: number;
    maxPrice: number;
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
            
            const image = getCarImage(brand, model, service.type, service.images?.[0]);

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    title: title,
                    brand: brand,
                    model: model,
                    year: String(features.year || ''),
                    minPrice: price,
                    maxPrice: price,
                    image: image,
                    count: 1,
                    features: [features.transmission, features.fuel].filter(Boolean) as string[]
                };
            } else {
                groups[key].count += 1;
                if (price < groups[key].minPrice) {
                    groups[key].minPrice = price;
                }
                if (price > groups[key].maxPrice) {
                    groups[key].maxPrice = price;
                }
                // Update image logic...
                groups[key].image = image;
            }
        });

        return Object.values(groups);
    }, [services]);
};
