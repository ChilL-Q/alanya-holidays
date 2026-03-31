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

    // ─── Additional tests for uncovered branches ──────────────────────────────

    it('login error returns { success: false, error }', async () => {
        (supabase.auth.signInWithPassword as any).mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let loginResult: any;
        await act(async () => {
            loginResult = await result.current.login('bad@example.com', 'wrong');
        });

        expect(loginResult).toEqual({ success: false, error: 'Invalid credentials' });
    });

    it('register error returns { success: false, error }', async () => {
        (supabase.auth.signUp as any).mockResolvedValue({
            data: { user: null },
            error: { message: 'Email already registered' }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let registerResult: any;
        await act(async () => {
            registerResult = await result.current.register('User', 'existing@test.com', 'pass', 'guest');
        });

        expect(registerResult).toEqual({ success: false, error: 'Email already registered' });
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('register without user does not send welcome email', async () => {
        (supabase.auth.signUp as any).mockResolvedValue({
            data: { user: null },
            error: null
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let registerResult: any;
        await act(async () => {
            registerResult = await result.current.register('User', 'new@test.com', 'pass', 'guest');
        });

        expect(registerResult).toEqual({ success: true });
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('sendOtp success returns { success: true }', async () => {
        (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let otpResult: any;
        await act(async () => {
            otpResult = await result.current.sendOtp('user@example.com');
        });

        expect(otpResult).toEqual({ success: true });
        expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'user@example.com' });
    });

    it('sendOtp error returns { success: false, error }', async () => {
        (supabase.auth.signInWithOtp as any).mockResolvedValue({
            error: { message: 'OTP send failed' }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let otpResult: any;
        await act(async () => {
            otpResult = await result.current.sendOtp('user@example.com');
        });

        expect(otpResult).toEqual({ success: false, error: 'OTP send failed' });
    });

    it('verifyOtp success returns { success: true }', async () => {
        (supabase.auth.verifyOtp as any).mockResolvedValue({ error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let verifyResult: any;
        await act(async () => {
            verifyResult = await result.current.verifyOtp('user@example.com', '123456');
        });

        expect(verifyResult).toEqual({ success: true });
        expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
            email: 'user@example.com',
            token: '123456',
            type: 'email',
        });
    });

    it('verifyOtp error returns { success: false, error }', async () => {
        (supabase.auth.verifyOtp as any).mockResolvedValue({
            error: { message: 'Invalid OTP token' }
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let verifyResult: any;
        await act(async () => {
            verifyResult = await result.current.verifyOtp('user@example.com', 'bad-token', 'signup');
        });

        expect(verifyResult).toEqual({ success: false, error: 'Invalid OTP token' });
    });

    it('updateEmail resolves without throwing on success', async () => {
        (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.updateEmail('new@example.com');
            })
        ).resolves.not.toThrow();

        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
    });

    it('updateEmail throws when supabase returns an error', async () => {
        const authError = { message: 'Email update failed', status: 400 };
        (supabase.auth.updateUser as any).mockResolvedValue({ data: null, error: authError });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.updateEmail('bad@example.com');
            })
        ).rejects.toEqual(authError);
    });

    it('updatePassword resolves without throwing on success', async () => {
        (supabase.auth.updateUser as any).mockResolvedValue({ data: {}, error: null });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.updatePassword('newSecurePass123');
            })
        ).resolves.not.toThrow();

        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newSecurePass123' });
    });

    it('updatePassword throws when supabase returns an error', async () => {
        const authError = { message: 'Password update failed', status: 400 };
        (supabase.auth.updateUser as any).mockResolvedValue({ data: null, error: authError });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.updatePassword('weak');
            })
        ).rejects.toEqual(authError);
    });

    it('updateUser returns early when user is null (not logged in)', async () => {
        // No session → user stays null
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toBe(null);

        await act(async () => {
            await result.current.updateUser({ name: 'Should Not Update' });
        });

        // updateUser should have returned early without calling supabase
        expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('updateUser logs error and does not update local state when supabase returns error', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser } }
        });
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
        });
        (supabase.auth.updateUser as any).mockResolvedValue({
            data: null,
            error: { message: 'Update failed' }
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const nameBefore = result.current.user?.name;

        await act(async () => {
            await result.current.updateUser({ name: 'Attempted Name' });
        });

        // Name should remain unchanged because the error branch was taken
        expect(result.current.user?.name).toBe(nameBefore);
        expect(consoleSpy).toHaveBeenCalledWith('Error updating user:', expect.anything());

        consoleSpy.mockRestore();
    });

    it('falls back to session metadata when profile query returns null data', async () => {
        const userWithMeta = {
            id: 'user-456',
            email: 'meta@example.com',
            created_at: '2024-01-01',
            user_metadata: {
                full_name: 'Meta User',
                role: 'guest',
            }
        };

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: userWithMeta } }
        });
        // profile query returns null data (not found)
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null })
        });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isAuthenticated).toBe(true);
        // Should fall back to metadata
        expect(result.current.user?.name).toBe('Meta User');
        expect(result.current.user?.role).toBe('guest');
    });

    it('falls back to session metadata when profile query throws', async () => {
        const userWithMeta = {
            id: 'user-789',
            email: 'error@example.com',
            created_at: '2024-01-01',
            user_metadata: {
                full_name: 'Error Fallback User',
                role: 'host',
            }
        };

        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: userWithMeta } }
        });
        // profile query throws an error
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockRejectedValue(new Error('DB connection error'))
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.name).toBe('Error Fallback User');
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching user profile:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('useAuth throws when used outside of AuthProvider', () => {
        // renderHook without the wrapper means no AuthProvider
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used within an AuthProvider'
        );
    });
});
