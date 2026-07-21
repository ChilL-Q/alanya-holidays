import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AdminRoute } from './AdminRoute';
import { useAuth } from '../../context/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Loader2: ({ className }: any) => <svg data-testid="loader-icon" className={className} />
}));

describe('AdminRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockChild = <div data-testid="admin-content">Admin Content</div>;

    it('shows loading state when authentication is being verified', () => {
        (useAuth as any).mockReturnValue({
            isLoading: true,
            isAuthenticated: false,
            user: null
        });

        render(
            <MemoryRouter>
                <AdminRoute>{mockChild}</AdminRoute>
            </MemoryRouter>
        );

        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
        expect(screen.getByText('Verifying permissions...')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('redirects to home when user is not authenticated', () => {
        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: false,
            user: null
        });

        // We use a trick to check redirection in MemoryRouter:
        // Render a route for '/' and see if it gets displayed
        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
                    <Route path="/admin" element={<AdminRoute>{mockChild}</AdminRoute>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('home-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('redirects to home when user is authenticated but not an admin', () => {
        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            user: { role: 'guest' }
        });

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
                    <Route path="/admin" element={<AdminRoute>{mockChild}</AdminRoute>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('home-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('renders children when user is authenticated and is an admin', () => {
        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            user: { role: 'admin' }
        });

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
                    <Route path="/admin" element={<AdminRoute>{mockChild}</AdminRoute>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    });

    it('logs warning when access is denied', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (useAuth as any).mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            user: { role: 'host' }
        });

        render(
            <MemoryRouter initialEntries={['/admin-panel']}>
                <AdminRoute>{mockChild}</AdminRoute>
            </MemoryRouter>
        );

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Access denied to /admin-panel. Requirement: admin role. Current role: host')
        );
        
        consoleSpy.mockRestore();
    });
});
