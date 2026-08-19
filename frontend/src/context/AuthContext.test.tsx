import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
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
});
