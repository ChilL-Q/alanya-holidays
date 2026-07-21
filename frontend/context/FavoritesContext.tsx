import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService } from '../api-services/api/misc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';

interface FavoritesContextType {
    favorites: string[];
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    // Load from localStorage as fallback
    const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // Fetch from DB
    const { data: dbFavorites = [] } = useQuery({
        queryKey: qk.favorites.byUser(userId),
        queryFn: async () => {
            try {
                return await favoritesService.getFavorites();
            } catch (error) {
                console.error('Failed to fetch favorites:', error);
                throw error;
            }
        },
        enabled: isAuthenticated && !!userId,
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
        retry: 1,
    });

    // Merge DB + localStorage favorites
    const favorites = useMemo(() => {
        return Array.from(new Set([...localFavorites, ...dbFavorites]));
    }, [localFavorites, dbFavorites]);

    // Persist merged favorites to localStorage
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    // Add favorite mutation
    const addMutation = useMutation({
        mutationFn: (id: string) => favoritesService.addFavorite({ item_id: id }),
        onError: (error) => {
            console.error('Failed to add favorite:', error);
        },
        onSuccess: () => {
            if (userId) {
                queryClient.invalidateQueries({ queryKey: qk.favorites.byUser(userId) });
            }
        },
    });

    // Remove favorite mutation
    const removeMutation = useMutation({
        mutationFn: (id: string) => favoritesService.removeFavorite({ item_id: id }),
        onError: (error) => {
            console.error('Failed to remove favorite:', error);
        },
        onSuccess: () => {
            if (userId) {
                queryClient.invalidateQueries({ queryKey: qk.favorites.byUser(userId) });
            }
        },
    });

    const addFavorite = useCallback(async (id: string) => {
        // Optimistic update: add to local state immediately
        setLocalFavorites((prev) => {
            if (!prev.includes(id)) return [...prev, id];
            return prev;
        });

        // For unauthenticated users, just update local state
        if (!isAuthenticated || !userId) return;

        // For authenticated users, sync with DB
        try {
            await addMutation.mutateAsync(id);
        } catch (_error) {
            // On error, rollback from local state
            setLocalFavorites((prev) => prev.filter((favId) => favId !== id));
        }
    }, [isAuthenticated, userId, addMutation]);

    const removeFavorite = useCallback(async (id: string) => {
        // Optimistic update: remove from local state immediately
        setLocalFavorites((prev) => prev.filter((favId) => favId !== id));

        // For unauthenticated users, just update local state
        if (!isAuthenticated || !userId) return;

        // For authenticated users, sync with DB
        try {
            await removeMutation.mutateAsync(id);
        } catch (_error) {
            // On error, rollback to local state
            setLocalFavorites((prev) => [...prev, id]);
        }
    }, [isAuthenticated, userId, removeMutation]);

    const toggleFavorite = useCallback((id: string) => {
        if (favorites.includes(id)) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    }, [favorites, removeFavorite, addFavorite]);

    const value = useMemo(() => {
        const isFavorite = (id: string) => favorites.includes(id);
        return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
    }, [favorites, addFavorite, removeFavorite, toggleFavorite]);

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
