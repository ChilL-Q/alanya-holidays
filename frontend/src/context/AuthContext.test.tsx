import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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

const TestConsumer: React.FC = () => {
  const { user, loading, isAuthenticated, signIn, signOut } = useAuth();

  if (loading) return <div>Loading Auth...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-email">{user?.email || 'no-email'}</div>
      <button onClick={() => signIn('test@example.com', 'password123')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
};

const PasswordAndProfileConsumer: React.FC = () => {
  const { profile, updatePassword, updateProfile } = useAuth();

  return (
    <div>
      <div data-testid="profile-name">{profile?.full_name || 'no-profile'}</div>
      <div data-testid="profile-bio">{profile?.bio || 'no-bio'}</div>
      <button
        onClick={async () => {
          await updatePassword('new-secure-pass-123');
        }}
      >
        Change Password
      </button>
      <button
        onClick={async () => {
          await updateProfile({
            full_name: 'Alex Rivera Updated',
            bio: 'Living in Alanya',
          });
        }}
      >
        Update Profile
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const ComponentOutside = () => {
      useAuth();
      return null;
    };

    expect(() => render(<ComponentOutside />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });

  it('provides unauthenticated state when no session exists', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const statusEl = await screen.findByTestId('auth-status');
    expect(statusEl.textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('no-email');
  });

  it('provides authenticated user when active session exists', async () => {
    const mockUser = {
      id: 'usr_123',
      email: 'alex@example.com',
      user_metadata: { full_name: 'Alex Rivera' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          access_token: 'fake-jwt',
          user: mockUser,
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    const statusEl = await screen.findByTestId('auth-status');
    expect(statusEl.textContent).toBe('authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('alex@example.com');
  });

  it('calls signIn on supabase client when invoked', async () => {
    (supabase.auth.signInWithPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: { id: 'usr_123', email: 'test@example.com' },
        session: { access_token: 'fake-jwt', user: { id: 'usr_123', email: 'test@example.com' } },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByTestId('auth-status');

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('calls updatePassword on supabase.auth.updateUser and returns clean result', async () => {
    (supabase.auth.updateUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: 'usr_123' } },
      error: null,
    });

    render(
      <AuthProvider>
        <PasswordAndProfileConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Change Password').click();
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: 'new-secure-pass-123',
    });
  });

  it('updates profile and reactively updates state', async () => {
    const mockUser = {
      id: 'usr_123',
      email: 'alex@example.com',
      user_metadata: { full_name: 'Alex Rivera' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        session: {
          access_token: 'fake-jwt',
          user: mockUser,
        },
      },
      error: null,
    });

    const initialProfileData = {
      id: 'usr_123',
      email: 'alex@example.com',
      full_name: 'Alex Rivera',
      bio: null,
      role: 'user',
      avatar_url: null,
      phone: null,
      company_name: null,
      iban: null,
      bank_name: null,
      bank_account_holder_name: null,
      crypto_wallet: null,
      social_links: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedProfileData = {
      id: 'usr_123',
      email: 'alex@example.com',
      full_name: 'Alex Rivera Updated',
      bio: 'Living in Alanya',
      role: 'user',
      avatar_url: null,
      phone: null,
      company_name: null,
      iban: null,
      bank_name: null,
      bank_account_holder_name: null,
      crypto_wallet: null,
      social_links: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: initialProfileData, error: null }),
          single: vi.fn().mockResolvedValue({ data: initialProfileData, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: updatedProfileData, error: null }),
          })),
        })),
      })),
    });

    render(
      <AuthProvider>
        <PasswordAndProfileConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alex Rivera');
    });

    await act(async () => {
      screen.getByText('Update Profile').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alex Rivera Updated');
      expect(screen.getByTestId('profile-bio')).toHaveTextContent('Living in Alanya');
    });
  });
});
