import { useQuery } from '@tanstack/react-query';
import { ServiceData, servicesService } from '../api-services';
import { qk } from '../lib/queryKeys';

export const useServicePrices = () => {
    const SUBCATEGORIES = ['water', 'safari', 'air', 'land', 'atv'];

    const { data: minPrices = {}, isLoading } = useQuery({
        queryKey: qk.services.byType('tour', 1, 100),
        queryFn: async () => {
            const { data } = await servicesService.getServices('tour', 1, 100) as { data: ServiceData[] | null };
            if (!data) return {} as Record<string, number>;
            const prices: Record<string, number> = {};
            SUBCATEGORIES.forEach(sub => {
                const matches = data.filter(s => s.features?.subcategory === sub && s.type === 'tour');
                if (matches.length > 0) prices[sub] = Math.min(...matches.map(s => s.price));
            });
            return prices;
        },
        staleTime: 15 * 60_000,
    });

    return { minPrices, isLoading };
};
