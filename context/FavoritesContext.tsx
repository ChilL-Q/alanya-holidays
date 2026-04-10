import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../api-services';

interface FavoritesContextType {
    favorites: string[];
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth(); // Assuming useAuth is available
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync with DB on login
    const isMountedRef = useRef(true);

     useEffect(() => {
         isMountedRef.current = true;
         if (isAuthenticated && user?.id) {
             db.getFavorites().then(dbFavorites => {
                 // Use functional update to avoid stale closure on favorites state
                 if (isMountedRef.current) setFavorites(prev => Array.from(new Set([...prev, ...dbFavorites])));
             }).catch(console.error);
         }
         return () => { isMountedRef.current = false; };
     }, [isAuthenticated, user]);

    // Persist to LocalStorage
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    const addFavorite = async (id: string) => {
        const previousFavorites = [...favorites];
        setFavorites((prev) => {
            if (!prev.includes(id)) return [...prev, id];
            return prev;
        });
        if (isAuthenticated && user?.id) {
            try {
                await db.addFavorite({ item_id: id });
            } catch (error) {
                console.error('Failed to add favorite:', error);
                // Rollback on DB error
                setFavorites(previousFavorites);
            }
        }
    };

    const removeFavorite = async (id: string) => {
        const previousFavorites = [...favorites];
        setFavorites((prev) => prev.filter((favId) => favId !== id));
        if (isAuthenticated && user?.id) {
            try {
                await db.removeFavorite({ item_id: id });
            } catch (error) {
                console.error('Failed to remove favorite:', error);
                // Rollback on DB error
                setFavorites(previousFavorites);
            }
        }
    };

    const isFavorite = (id: string) => favorites.includes(id);

    const toggleFavorite = (id: string) => {
        if (isFavorite(id)) {
            removeFavorite(id);
        } else {
            addFavorite(id);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
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
