import { useMemo } from 'react';
import { ServiceData } from '../services';
import { getCarImage } from '../utils/carImages';

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
            
            const image = getCarImage(brand, model, service.type, service.images?.[0]);

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
                // Update image if we have a better one (e.g. from utility vs fallback)
                // But getCarImage already handles priority.
                // We just want to ensure we don't overwrite a good image with a bad one if logic changes,
                // but since key is same, image should be same.
                groups[key].image = image;
            }
        });

        return Object.values(groups);
    }, [services]);
};
