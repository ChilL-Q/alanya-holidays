import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { useAuth } from './AuthContext';
import { db } from '../api-services';

// Mock AuthContext
vi.mock('./AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock DB
vi.mock('../api-services', () => ({
    db: {
        getFavorites: vi.fn().mockResolvedValue([]),
        toggleFavorite: vi.fn().mockResolvedValue(undefined)
    }
}));

// Mock localStorage with proper isolation
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageStore[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
    }),
    clear: vi.fn(() => {
        localStorageStore = {};
    }),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FavoritesProvider>{children}</FavoritesProvider>
);

describe('FavoritesContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageStore = {};
        localStorageMock.getItem.mockImplementation((key: string) => localStorageStore[key] || null);
        (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });
        (db.getFavorites as any).mockResolvedValue([]);
        (db.toggleFavorite as any).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('useFavorites', () => {
        it('should throw error when used outside FavoritesProvider', () => {
            expect(() => renderHook(() => useFavorites())).toThrow(
                'useFavorites must be used within a FavoritesProvider'
            );
        });
    });

    describe('initialization', () => {
        it('should initialize with empty favorites when localStorage is empty', () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.favorites).toEqual([]);
        });

        it('should load favorites from localStorage on initialization', () => {
            const mockFavorites = ['item-1', 'item-2', 'item-3'];
            localStorageStore['favorites'] = JSON.stringify(mockFavorites);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.favorites).toEqual(mockFavorites);
        });

        it('should throw error when localStorage contains invalid JSON', () => {
            localStorageStore['favorites'] = 'invalid-json';

            expect(() => {
                renderHook(() => useFavorites(), { wrapper });
            }).toThrow();
        });
    });

    describe('addFavorite', () => {
        it('should add favorite to local state for unauthenticated user', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
            });

            expect(result.current.favorites).toContain('item-1');
            expect(result.current.favorites).toHaveLength(1);
        });

        it('should not add duplicate favorite', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
                await result.current.addFavorite('item-1');
            });

            expect(result.current.favorites).toHaveLength(1);
        });

        it('should sync with DB for authenticated user', async () => {
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
            });

            expect(db.toggleFavorite).toHaveBeenCalledWith({
                user_id: 'user-123',
                item_id: 'item-1'
            });
        });

        it('should save to localStorage when adding favorite', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'favorites',
                JSON.stringify(['item-1'])
            );
        });

        it('should handle DB sync error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });
            (db.toggleFavorite as any).mockRejectedValue(new Error('DB error'));

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
            });

            // Should still add locally despite DB error
            expect(result.current.favorites).toContain('item-1');
            consoleSpy.mockRestore();
        });
    });

    describe('removeFavorite', () => {
        it('should remove favorite from local state', async () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2', 'item-3']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('item-2');
            });

            expect(result.current.favorites).toEqual(['item-1', 'item-3']);
        });

        it('should handle removing non-existent favorite gracefully', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('non-existent');
            });

            expect(result.current.favorites).toEqual([]);
        });

        it('should sync with DB for authenticated user', async () => {
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });

            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('item-1');
            });

            expect(db.toggleFavorite).toHaveBeenCalledWith({
                user_id: 'user-123',
                item_id: 'item-1'
            });
        });

        it('should save to localStorage when removing favorite', async () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('item-1');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'favorites',
                JSON.stringify(['item-2'])
            );
        });

        it('should handle DB sync error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });
            (db.toggleFavorite as any).mockRejectedValue(new Error('DB error'));

            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('item-1');
            });

            // Should still remove locally despite DB error
            expect(result.current.favorites).toEqual(['item-2']);
            consoleSpy.mockRestore();
        });
    });

    describe('isFavorite', () => {
        it('should return true for existing favorite', () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2', 'item-3']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.isFavorite('item-2')).toBe(true);
        });

        it('should return false for non-existent favorite', () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2', 'item-3']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.isFavorite('item-999')).toBe(false);
        });

        it('should return false for empty favorites', () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.isFavorite('item-1')).toBe(false);
        });
    });

    describe('toggleFavorite', () => {
        it('should add favorite when not already favorited', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.toggleFavorite('item-1');
            });

            expect(result.current.favorites).toContain('item-1');
        });

        it('should remove favorite when already favorited', async () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.toggleFavorite('item-1');
            });

            expect(result.current.favorites).not.toContain('item-1');
            expect(result.current.favorites).toEqual(['item-2']);
        });

        it('should sync with DB when toggling for authenticated user', async () => {
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.toggleFavorite('item-1');
            });

            expect(db.toggleFavorite).toHaveBeenCalledWith({
                user_id: 'user-123',
                item_id: 'item-1'
            });
        });
    });

    describe('DB sync on login', () => {
        it('should sync favorites from DB when user authenticates', async () => {
            const dbFavorites = ['db-item-1', 'db-item-2'];
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });
            (db.getFavorites as any).mockResolvedValue(dbFavorites);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            // Wait for the async DB fetch to complete
            await waitFor(() => {
                expect(result.current.favorites).toEqual(
                    expect.arrayContaining([...dbFavorites])
                );
            });
        });

        it('should merge DB favorites with local favorites without duplicates', async () => {
            const localFavorites = ['local-item-1', 'shared-item'];
            const dbFavorites = ['db-item-1', 'shared-item'];
            
            localStorageStore['favorites'] = JSON.stringify(localFavorites);
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });
            (db.getFavorites as any).mockResolvedValue(dbFavorites);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            // Wait for the async DB fetch to complete
            await waitFor(() => {
                expect(result.current.favorites).toHaveLength(3);
                expect(result.current.favorites).toEqual(
                    expect.arrayContaining(['local-item-1', 'shared-item', 'db-item-1'])
                );
            });
        });

        it('should not sync when user is not authenticated', async () => {
            (useAuth as any).mockReturnValue({
                user: null,
                isAuthenticated: false
            });

            renderHook(() => useFavorites(), { wrapper });

            // Wait to ensure no DB call is made
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(db.getFavorites).not.toHaveBeenCalled();
        });

        it('should handle DB sync error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (useAuth as any).mockReturnValue({
                user: { id: 'user-123' },
                isAuthenticated: true
            });
            
            // Mock to reject - the context catches the error with .catch(console.error)
            (db.getFavorites as any).mockRejectedValue(new Error('DB error'));

            // The context should initialize without crashing even if DB fails
            const { result } = renderHook(() => useFavorites(), { wrapper });

            // Give the async operation time to complete
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            // Should initialize without crashing (favorites should be defined)
            expect(result.current.favorites).toBeDefined();
            expect(result.current.favorites).toEqual([]);
            
            consoleSpy.mockRestore();
        });
    });

    describe('localStorage persistence', () => {
        it('should persist favorites to localStorage on change', async () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.addFavorite('item-1');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'favorites',
                JSON.stringify(['item-1'])
            );
        });

        it('should update localStorage when removing favorite', async () => {
            localStorageStore['favorites'] = JSON.stringify(['item-1', 'item-2']);

            const { result } = renderHook(() => useFavorites(), { wrapper });

            await act(async () => {
                await result.current.removeFavorite('item-1');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'favorites',
                JSON.stringify(['item-2'])
            );
        });
    });

    describe('context values', () => {
        it('should provide all required context values', () => {
            const { result } = renderHook(() => useFavorites(), { wrapper });

            expect(result.current.favorites).toBeDefined();
            expect(result.current.addFavorite).toBeDefined();
            expect(result.current.removeFavorite).toBeDefined();
            expect(result.current.isFavorite).toBeDefined();
            expect(result.current.toggleFavorite).toBeDefined();

            expect(typeof result.current.addFavorite).toBe('function');
            expect(typeof result.current.removeFavorite).toBe('function');
            expect(typeof result.current.isFavorite).toBe('function');
            expect(typeof result.current.toggleFavorite).toBe('function');
        });
    });
});
