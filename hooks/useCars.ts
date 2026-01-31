import { useState, useEffect } from 'react';
import { db, ServiceData } from '../services';
import { useCarAggregation } from './useCarAggregation';

export const useCars = () => {
    const [loading, setLoading] = useState(true);
    const [rawServices, setRawServices] = useState<ServiceData[]>([]);

    useEffect(() => {
        const fetchCars = async () => {
            try {
                // @ts-ignore
                const { data: services } = await db.getServices('car', 1, 100);
                if (services) setRawServices(services);
            } catch (err) {
                console.error('Failed to fetch cars', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, []);

    const carGroups = useCarAggregation(rawServices);

    return { carGroups, loading };
};
