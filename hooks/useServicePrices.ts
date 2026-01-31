import { useState, useEffect } from 'react';
import { db } from '../services';

export const useServicePrices = () => {
    const [minPrices, setMinPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Fetch tours to calculate min prices for experiences
                // We fetch a reasonable amount to get a good sample. 
                // Ideally backend provides aggregate data.
                const { data } = await db.getServices('tour', 1, 100);
                if (data) {
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
                setIsLoading(false);
            }
        };
        fetchPrices();
    }, []);

    return { minPrices, isLoading };
};
