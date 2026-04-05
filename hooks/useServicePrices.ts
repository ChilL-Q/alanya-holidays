import { useState, useEffect, useRef } from 'react';
import { db } from '../api-services';

export const useServicePrices = () => {
    const [minPrices, setMinPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const fetchPrices = async () => {
            try {
                const { data } = await db.getServices('tour', 1, 100);
                if (data && isMountedRef.current) {
                    const prices: Record<string, number> = {};
                    const subcategories = ['water', 'safari', 'air', 'land', 'atv'];

                    subcategories.forEach(sub => {
                        const servicesInSub = data.filter(s => s.features?.subcategory === sub && s.type === 'tour');
                        if (servicesInSub.length > 0) {
                            const minPrice = Math.min(...servicesInSub.map(s => s.price));
                            prices[sub] = minPrice;
                        }
                    });
                    setMinPrices(prices);
                }
            } catch (err) {
                console.error('Failed to fetch prices', err);
            } finally {
                if (isMountedRef.current) setIsLoading(false);
            }
        };
        fetchPrices();
        return () => { isMountedRef.current = false; };
    }, []);

    return { minPrices, isLoading };
};
