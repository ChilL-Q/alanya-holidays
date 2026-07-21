import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { forumService } from '../api-services';

export function useRemovedItems<T extends { id: string }>(
    targetType: 'post' | 'comment',
    fetchFn: () => Promise<T[]>,
) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchFn();
            setItems(data);
        } catch (e) {
            toast.error((e as Error).message || `Failed to load removed ${targetType}s`);
        } finally {
            setLoading(false);
        }
    }, [fetchFn, targetType]);

    const restoreItem = useCallback(async (id: string) => {
        setRestoringId(id);
        try {
            await forumService.setRemoved(targetType, id, false);
            toast.success(`${targetType === 'post' ? 'Post' : 'Comment'} restored`);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to restore');
        } finally {
            setRestoringId(null);
        }
    }, [targetType]);

    return { items, loading, restoringId, fetchItems, restoreItem };
}