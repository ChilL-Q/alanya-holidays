import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../api-services/supabase';

// Mock Supabase
vi.mock('../api-services/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signInWithOtp: vi.fn(),
            verifyOtp: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn()
        },
        from: vi.fn(),
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: null, error: null })
        }
    }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        role: 'host',
        email: 'test@example.com'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Default: no session
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
        (supabase.auth.onAuthStateChange as any).mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } }
        });
    });

    it('initializes as unauthenticated when no session exists', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
    });

    it('loads user profile if session exists on mount', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } }
        });
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.name).toBe('Test User');
        expect(result.current.user?.role).toBe('host');
    });

    it('updates state on auth state change', async () => {
        let authChangeHandler: any;
        (supabase.auth.onAuthStateChange as any).mockImplementation((handler: any) => {
            authChangeHandler = handler;
            return { data: { subscription: { unsubscribe: vi.fn() } } };
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Mock profile for the new user
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
        });

        // Trigger SIGNED_IN
        await act(async () => {
            await authChangeHandler('SIGNED_IN', { user: mockUser });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.email).toBe('test@example.com');
    });

    it('handles login success', async () => {
        (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: mockUser }, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let loginResult;
        await act(async () => {
            loginResult = await result.current.login('test@example.com', 'pass');
        });

        expect(loginResult).toEqual({ success: true });
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('handles register success and triggers welcome email', async () => {
        (supabase.auth.signUp as any).mockResolvedValue({ data: { user: mockUser }, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.register('New User', 'new@test.com', 'pass', 'guest');
        });

        expect(supabase.auth.signUp).toHaveBeenCalled();
        expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
    });

    it('handles logout', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.logout();
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
        expect(result.current.user).toBe(null);
    });

    it('updates user profile', async () => {
        // Initial state: logged in
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } }
        });
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
        });
        (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.updateUser({ name: 'Updated Name' });
        });

        expect(supabase.auth.updateUser).toHaveBeenCalled();
        expect(result.current.user?.name).toBe('Updated Name');
    });
});
