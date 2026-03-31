import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthRoute } from './AuthRoute';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock lucide-react Loader2 as a simple div
vi.mock('lucide-react', () => ({
    Loader2: ({ className }: { className?: string }) => (
        <div data-testid="loader2" className={className} />
    ),
}));

import { useAuth } from '../../context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('AuthRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a loading spinner when isLoading=true', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <AuthRoute>
                    <div>Protected Content</div>
                </AuthRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loader2')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to "/" with state { from: location } when not authenticated', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

        const capturedLocation: any = null;

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <div
                                data-testid="home"
                                ref={(el) => {
                                    // Location state is checked via the Navigate component behaviour;
                                    // we verify the redirect happened by confirming the home page renders.
                                }}
                            >
                                Home
                            </div>
                        }
                    />
                    <Route
                        path="/protected"
                        element={
                            <AuthRoute>
                                <div>Protected Content</div>
                            </AuthRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        // Should have been redirected to home
        expect(screen.getByTestId('home')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('passes state { from: location } when redirecting unauthenticated user', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

        // Capture the Navigate state by rendering a component that reads location state
        const HomeCapture = () => {
            const loc = useLocation();
            return (
                <div>
                    <span data-testid="from-path">
                        {loc.state?.from?.pathname ?? 'no-state'}
                    </span>
                </div>
            );
        };

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/" element={<HomeCapture />} />
                    <Route
                        path="/protected"
                        element={
                            <AuthRoute>
                                <div>Protected Content</div>
                            </AuthRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('from-path').textContent).toBe('/protected');
    });

    it('renders children when isAuthenticated=true', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <AuthRoute>
                    <div>Protected Content</div>
                </AuthRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.queryByTestId('loader2')).not.toBeInTheDocument();
    });

    it('does not redirect when isAuthenticated=true', () => {
        mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home</div>} />
                    <Route
                        path="/protected"
                        element={
                            <AuthRoute>
                                <div data-testid="protected">Protected Content</div>
                            </AuthRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('protected')).toBeInTheDocument();
        expect(screen.queryByTestId('home')).not.toBeInTheDocument();
    });
});
