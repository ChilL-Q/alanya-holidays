import { useQuery } from '@tanstack/react-query';
import { db, ServiceData } from '../api-services';
import { useCarAggregation } from './useCarAggregation';
import { qk } from '../lib/queryKeys';

export const useCars = () => {
    const { data: rawServices = [], isLoading: loading } = useQuery({
        queryKey: qk.services.byType('car', 1, 100),
        queryFn: async () => {
            const { data } = await db.getServices('car', 1, 100) as { data: ServiceData[] | null };
            return data ?? [];
        },
        staleTime: 15 * 60_000,
    });

    const carGroups = useCarAggregation(rawServices);

    return { carGroups, loading };
};
