import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, type UserProfile } from './AuthContext';
import { supabase } from '../lib/supabase';
import { AuthError, type User, type Session } from '@supabase/supabase-js';

vi.mock('../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        signInWithOAuth: vi.fn(),
        updateUser: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    },
  };
});

const mockBaseUser: User = {
  id: 'usr_test_789',
  app_metadata: {},
  user_metadata: { full_name: 'Original Name' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'testuser@alanya.com',
  phone: '+905550001122',
  role: 'authenticated',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const mockBaseSession: Session = {
  access_token: 'valid-access-token-xyz',
  refresh_token: 'valid-refresh-token-xyz',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockBaseUser,
};

const mockInitialProfile: UserProfile = {
  id: 'usr_test_789',
  email: 'testuser@alanya.com',
  full_name: 'Original Name',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Original bio',
  phone: '+905550001122',
  company_name: 'Original Holidays Ltd',
  role: 'user',
  iban: null,
  bank_name: null,
  bank_account_holder_name: null,
  crypto_wallet: null,
  social_links: { instagram: '@original' },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

// Component 1: Primary Profile Editor
const ProfileEditor: React.FC<{ onResult?: (res: { profile: UserProfile | null; error: Error | null }) => void }> = ({ onResult }) => {
  const { profile, updateProfile } = useAuth();
  return (
    <div data-testid="profile-editor">
      <div data-testid="editor-name">{profile?.full_name || 'no-name'}</div>
      <div data-testid="editor-bio">{profile?.bio || 'no-bio'}</div>
      <div data-testid="editor-phone">{profile?.phone || 'no-phone'}</div>
      <div data-testid="editor-company">{profile?.company_name || 'no-company'}</div>
      <button
        data-testid="btn-update-bio"
        onClick={async () => {
          const res = await updateProfile({ bio: 'Updated bio in Alanya' });
          onResult?.(res);
        }}
      >
        Update Bio
      </button>
      <button
        data-testid="btn-update-full"
        onClick={async () => {
          const res = await updateProfile({
            full_name: 'New Name',
            bio: 'New bio',
            phone: '+905559998877',
            company_name: 'New Company',
          });
          onResult?.(res);
        }}
      >
        Update All Details
      </button>
    </div>
  );
};

// Component 2: Secondary Observer (Simulates Navbar or Header observing profile reactivity)
const ProfileObserver: React.FC = () => {
  const { profile, isAuthenticated, user } = useAuth();
  return (
    <div data-testid="profile-observer">
      <span data-testid="observer-name">{profile?.full_name || 'anonymous'}</span>
      <span data-testid="observer-auth-status">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="observer-user-id">{user?.id || 'none'}</span>
    </div>
  );
};

// Component 3: Security Editor
const SecurityEditor: React.FC<{ onResult?: (res: { error: Error | null }) => void }> = ({ onResult }) => {
  const { updatePassword, user, session, isAuthenticated } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  return (
    <div data-testid="security-editor">
      <span data-testid="sec-auth">{isAuthenticated ? 'auth-ok' : 'auth-none'}</span>
      <span data-testid="sec-token">{session?.access_token || 'no-token'}</span>
      <span data-testid="sec-user-email">{user?.email || 'no-email'}</span>
      {errorMsg && <div data-testid="sec-error">{errorMsg}</div>}
      {successMsg && <div data-testid="sec-success">{successMsg}</div>}
      <button
        data-testid="btn-change-password"
        onClick={async () => {
          const res = await updatePassword('BrandNewSecurePassword2026!');
          if (res.error) {
            setErrorMsg(res.error.message);
          } else {
            setSuccessMsg('Password updated successfully');
          }
          onResult?.(res);
        }}
      >
        Change Password
      </button>
    </div>
  );
};

describe('Empirical Challenge: AuthContext State Reactivity & Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile Reactivity & Edge Cases', () => {
    it('synchronously updates in-memory profile state and triggers re-renders across multiple components without page reload', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const updatedProfile: UserProfile = {
        ...mockInitialProfile,
        bio: 'Updated bio in Alanya',
        updated_at: '2026-08-20T01:00:00.000Z',
      };

      const fromMock = vi.mocked(supabase.from);
      fromMock.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      let callbackResult: { profile: UserProfile | null; error: Error | null } | undefined;

      render(
        <AuthProvider>
          <ProfileEditor onResult={(res) => { callbackResult = res; }} />
          <ProfileObserver />
        </AuthProvider>
      );

      // Verify initial state across both components
      expect(await screen.findByTestId('editor-name')).toHaveTextContent('Original Name');
      expect(screen.getByTestId('editor-bio')).toHaveTextContent('Original bio');
      expect(screen.getByTestId('observer-name')).toHaveTextContent('Original Name');
      expect(screen.getByTestId('observer-auth-status')).toHaveTextContent('logged-in');

      // Trigger profile update
      await act(async () => {
        screen.getByTestId('btn-update-bio').click();
      });

      // Verify updateProfile resolution payload
      expect(callbackResult).toBeDefined();
      expect(callbackResult?.error).toBeNull();
      expect(callbackResult?.profile?.bio).toBe('Updated bio in Alanya');

      // Verify instantaneous reactive update in both subscriber components without reload
      expect(screen.getByTestId('editor-bio')).toHaveTextContent('Updated bio in Alanya');
      expect(screen.getByTestId('editor-name')).toHaveTextContent('Original Name');
      expect(screen.getByTestId('observer-name')).toHaveTextContent('Original Name');
      expect(screen.getByTestId('observer-auth-status')).toHaveTextContent('logged-in');
    });

    it('returns error and does not throw when called by unauthenticated user', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      let callbackResult: { profile: UserProfile | null; error: Error | null } | undefined;

      render(
        <AuthProvider>
          <ProfileEditor onResult={(res) => { callbackResult = res; }} />
        </AuthProvider>
      );

      await screen.findByTestId('editor-name');
      expect(screen.getByTestId('editor-name')).toHaveTextContent('no-name');

      await act(async () => {
        screen.getByTestId('btn-update-bio').click();
      });

      expect(callbackResult).toBeDefined();
      expect(callbackResult?.profile).toBeNull();
      expect(callbackResult?.error).toBeInstanceOf(Error);
      expect(callbackResult?.error?.message).toBe('User is not logged in');
    });

    it('preserves existing in-memory profile state when Supabase database returns an error', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const fromMock = vi.mocked(supabase.from);
      fromMock.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Row level security violation: update disallowed', code: '42501' },
              }),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof supabase.from>);

      let callbackResult: { profile: UserProfile | null; error: Error | null } | undefined;

      render(
        <AuthProvider>
          <ProfileEditor onResult={(res) => { callbackResult = res; }} />
          <ProfileObserver />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('editor-bio')).toHaveTextContent('Original bio');
      });

      await act(async () => {
        screen.getByTestId('btn-update-bio').click();
      });

      // Assert error is returned
      expect(callbackResult?.error).toBeDefined();
      expect(callbackResult?.error?.message).toContain('Row level security violation');
      expect(callbackResult?.profile).toBeNull();

      // Assert existing state is NOT wiped or overwritten with null
      expect(screen.getByTestId('editor-bio')).toHaveTextContent('Original bio');
      expect(screen.getByTestId('observer-name')).toHaveTextContent('Original Name');
    });

    it('catches and wraps unexpected runtime exceptions thrown by Supabase client', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const fromMock = vi.mocked(supabase.from);
      fromMock.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockInitialProfile, error: null }),
          })),
        })),
        update: vi.fn(() => {
          throw new Error('Fatal socket network timeout');
        }),
      } as unknown as ReturnType<typeof supabase.from>);

      let callbackResult: { profile: UserProfile | null; error: Error | null } | undefined;

      render(
        <AuthProvider>
          <ProfileEditor onResult={(res) => { callbackResult = res; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('editor-name')).toHaveTextContent('Original Name');
      });

      await act(async () => {
        screen.getByTestId('btn-update-bio').click();
      });

      expect(callbackResult?.error).toBeDefined();
      expect(callbackResult?.error?.message).toBe('Fatal socket network timeout');
      expect(callbackResult?.profile).toBeNull();
      // Component remains alive and mounted
      expect(screen.getByTestId('editor-name')).toHaveTextContent('Original Name');
    });
  });

  describe('updatePassword Supabase Auth Communication & Session Integrity', () => {
    it('successfully calls supabase.auth.updateUser and preserves existing session and user state intact', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const updateUserMock = vi.mocked(supabase.auth.updateUser);
      updateUserMock.mockResolvedValue({
        data: { user: mockBaseUser },
        error: null,
      });

      let callbackResult: { error: Error | null } | undefined;

      render(
        <AuthProvider>
          <SecurityEditor onResult={(res) => { callbackResult = res; }} />
          <ProfileObserver />
        </AuthProvider>
      );

      // Verify authenticated initial state
      await waitFor(() => {
        expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
      });
      expect(screen.getByTestId('sec-token')).toHaveTextContent('valid-access-token-xyz');
      expect(screen.getByTestId('sec-user-email')).toHaveTextContent('testuser@alanya.com');
      expect(screen.getByTestId('observer-auth-status')).toHaveTextContent('logged-in');

      // Trigger password change
      await act(async () => {
        screen.getByTestId('btn-change-password').click();
      });

      // Verify Supabase Auth API call
      expect(updateUserMock).toHaveBeenCalledTimes(1);
      expect(updateUserMock).toHaveBeenCalledWith({
        password: 'BrandNewSecurePassword2026!',
      });

      // Verify result
      expect(callbackResult).toBeDefined();
      expect(callbackResult?.error).toBeNull();
      expect(screen.getByTestId('sec-success')).toHaveTextContent('Password updated successfully');

      // CRITICAL: Session and User integrity must remain intact after password update
      expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
      expect(screen.getByTestId('sec-token')).toHaveTextContent('valid-access-token-xyz');
      expect(screen.getByTestId('sec-user-email')).toHaveTextContent('testuser@alanya.com');
      expect(screen.getByTestId('observer-auth-status')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('observer-user-id')).toHaveTextContent('usr_test_789');
    });

    it('handles Supabase Auth error (e.g. weak password / rate limit) without corrupting session', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const authError = new AuthError(
        'Password must contain at least 1 uppercase letter and 1 symbol',
        422,
        'weak_password'
      );

      const updateUserMock = vi.mocked(supabase.auth.updateUser);
      updateUserMock.mockResolvedValue({
        data: { user: null },
        error: authError,
      });

      let callbackResult: { error: Error | null } | undefined;

      render(
        <AuthProvider>
          <SecurityEditor onResult={(res) => { callbackResult = res; }} />
          <ProfileObserver />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
      });

      await act(async () => {
        screen.getByTestId('btn-change-password').click();
      });

      expect(callbackResult?.error).toBeDefined();
      expect(callbackResult?.error?.message).toBe('Password must contain at least 1 uppercase letter and 1 symbol');
      expect(screen.getByTestId('sec-error')).toHaveTextContent('Password must contain at least 1 uppercase letter');

      // Session MUST remain completely intact even if password update was rejected
      expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
      expect(screen.getByTestId('sec-token')).toHaveTextContent('valid-access-token-xyz');
      expect(screen.getByTestId('observer-auth-status')).toHaveTextContent('logged-in');
    });

    it('catches unexpected thrown exception during updateUser and returns clean error object', async () => {
      const getSessionMock = vi.mocked(supabase.auth.getSession);
      getSessionMock.mockResolvedValue({
        data: { session: mockBaseSession },
        error: null,
      });

      const updateUserMock = vi.mocked(supabase.auth.updateUser);
      updateUserMock.mockRejectedValue(new Error('Supabase gateway unreachable 503'));

      let callbackResult: { error: Error | null } | undefined;

      render(
        <AuthProvider>
          <SecurityEditor onResult={(res) => { callbackResult = res; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
      });

      await act(async () => {
        screen.getByTestId('btn-change-password').click();
      });

      expect(callbackResult?.error).toBeDefined();
      expect(callbackResult?.error?.message).toBe('Supabase gateway unreachable 503');
      expect(screen.getByTestId('sec-error')).toHaveTextContent('Supabase gateway unreachable 503');
      expect(screen.getByTestId('sec-auth')).toHaveTextContent('auth-ok');
    });
  });
});
