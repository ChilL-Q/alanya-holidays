import { useState, useEffect, useRef } from 'react';
import { db, ServiceData } from '../api-services';
import { useCarAggregation } from './useCarAggregation';

export const useCars = () => {
    const [loading, setLoading] = useState(true);
    const [rawServices, setRawServices] = useState<ServiceData[]>([]);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const fetchCars = async () => {
            try {
                // @ts-ignore
                const { data: services } = await db.getServices('car', 1, 100);
                if (services && isMountedRef.current) setRawServices(services);
            } catch (err) {
                console.error('Failed to fetch cars', err);
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };

        fetchCars();
        return () => { isMountedRef.current = false; };
    }, []);

    const carGroups = useCarAggregation(rawServices);

    return { carGroups, loading };
};
