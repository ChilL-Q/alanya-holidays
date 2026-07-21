import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HostRoute } from './HostRoute';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock lucide-react Loader2
vi.mock('lucide-react', () => ({
    Loader2: ({ className }: { className?: string }) => (
        <div data-testid="loader-icon" className={className} />
    ),
}));

// Mock console.warn
const originalWarn = console.warn;
const mockWarn = vi.fn();

import { useAuth } from '../../context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('HostRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.warn = mockWarn;
    });

    afterEach(() => {
        console.warn = originalWarn;
    });

    const mockNavigateProps = {
        isAuthenticated: false,
        user: null,
        isLoading: false,
    };

    describe('Loading State', () => {
        it('shows loading spinner when isLoading is true', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
            expect(screen.getByText('Verifying permissions...')).toBeInTheDocument();
            expect(screen.queryByText('Host Dashboard')).not.toBeInTheDocument();
        });

        it('renders loading state with correct styling classes', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            const { container } = render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const loadingContainer = container.querySelector('.min-h-screen');
            expect(loadingContainer).toBeInTheDocument();
            expect(loadingContainer).toHaveClass('flex');
            expect(loadingContainer).toHaveClass('items-center');
            expect(loadingContainer).toHaveClass('justify-center');
        });

        it('renders loader with correct color classes', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const loader = screen.getByTestId('loader-icon');
            expect(loader).toHaveClass('text-teal-600');
            expect(loader).toHaveClass('dark:text-cyan-400');
        });

        it('renders loading text with correct styling', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const loadingText = screen.getByText('Verifying permissions...');
            expect(loadingText).toHaveClass('text-slate-500');
            expect(loadingText).toHaveClass('animate-pulse');
        });
    });

    describe('Unauthenticated User', () => {
        it('redirects to "/" when not authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
            expect(screen.queryByText('Host Dashboard')).not.toBeInTheDocument();
        });

        it('passes location state when redirecting unauthenticated user', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });

            const LocationCapture = () => {
                const location = useLocation();
                return (
                    <div>
                        <span data-testid="redirect-from">
                            {location.state?.from?.pathname ?? 'no-state'}
                        </span>
                    </div>
                );
            };

            render(
                <MemoryRouter initialEntries={['/host/properties']}>
                    <Routes>
                        <Route path="/" element={<LocationCapture />} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Properties</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('redirect-from').textContent).toBe('/host/properties');
        });

        it('uses replace prop for navigation when unauthenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            // Verify redirect happened (Navigate component with replace)
            expect(screen.getByTestId('home')).toBeInTheDocument();
        });
    });

    describe('Guest User (Non-Host/Admin)', () => {
        it('redirects to "/" when user has guest role', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123', role: 'guest' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
            expect(screen.queryByText('Host Dashboard')).not.toBeInTheDocument();
        });

        it('logs warning when guest tries to access host route', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123', role: 'guest' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div>Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('Access denied to /host/dashboard')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('Requirement: host/admin role')
            );
            expect(mockWarn).toHaveBeenCalledWith(
                expect.stringContaining('Current role: guest')
            );
        });

        it('redirects guest to home with replace prop', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123', role: 'guest' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
        });

        it('redirects user with unknown role to home', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123', role: 'vendor' as any },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
        });
    });

    describe('Host User', () => {
        it('renders children when user has host role', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div data-testid="host-content">Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByTestId('host-content')).toBeInTheDocument();
            expect(screen.getByText('Host Dashboard')).toBeInTheDocument();
        });

        it('does not redirect host user', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByText('Host Dashboard')).toBeInTheDocument();
            expect(screen.queryByTestId('home')).not.toBeInTheDocument();
        });

        it('does not log warning for host user', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(mockWarn).not.toHaveBeenCalled();
        });

        it('renders multiple children elements for host', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/properties']}>
                    <HostRoute>
                        <div>Header</div>
                        <div>Main Content</div>
                        <div>Footer</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByText('Header')).toBeInTheDocument();
            expect(screen.getByText('Main Content')).toBeInTheDocument();
            expect(screen.getByText('Footer')).toBeInTheDocument();
        });
    });

    describe('Admin User', () => {
        it('renders children when user has admin role', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'admin-123', role: 'admin' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div data-testid="admin-content">Admin Host View</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByTestId('admin-content')).toBeInTheDocument();
            expect(screen.getByText('Admin Host View')).toBeInTheDocument();
        });

        it('does not redirect admin user', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'admin-123', role: 'admin' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Admin Host View</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByText('Admin Host View')).toBeInTheDocument();
            expect(screen.queryByTestId('home')).not.toBeInTheDocument();
        });

        it('does not log warning for admin user', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'admin-123', role: 'admin' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Admin Host View</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(mockWarn).not.toHaveBeenCalled();
        });

        it('allows admin to access all host routes', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'admin-123', role: 'admin' },
                isLoading: false,
            });

            const { rerender } = render(
                <MemoryRouter initialEntries={['/host/properties']}>
                    <HostRoute>
                        <div>Properties</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByText('Properties')).toBeInTheDocument();

            rerender(
                <MemoryRouter initialEntries={['/host/bookings']}>
                    <HostRoute>
                        <div>Bookings</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByText('Bookings')).toBeInTheDocument();
        });
    });

    describe('User with Null Role', () => {
        it('redirects when user role is null', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123', role: null },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
        });

        it('redirects when user object is missing role property', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'user-123' } as any,
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Host Dashboard</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
        });
    });

    describe('Location Handling', () => {
        it('captures current location for redirect state', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/settings']}>
                    <Routes>
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                        <Route
                            path="/host/*"
                            element={
                                <HostRoute>
                                    <div>Settings</div>
                                </HostRoute>
                            }
                        />
                    </Routes>
                </MemoryRouter>
            );

            // Should redirect to home
            expect(screen.getByTestId('home')).toBeInTheDocument();
        });

        it('handles nested routes correctly', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/properties/123/edit']}>
                    <HostRoute>
                        <div data-testid="nested-content">Edit Property</div>
                    </HostRoute>
                </MemoryRouter>
            );

            expect(screen.getByTestId('nested-content')).toBeInTheDocument();
        });
    });

    describe('Component Structure', () => {
        it('renders Fragment wrapper for authorized users', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                user: { id: 'host-123', role: 'host' },
                isLoading: false,
            });

            const { container } = render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Content</div>
                    </HostRoute>
                </MemoryRouter>
            );

            // Content should be directly rendered (Fragment doesn't add DOM nodes)
            expect(container).toHaveTextContent('Content');
        });

        it('renders Navigate component for unauthorized users', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                user: null,
                isLoading: false,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <Routes>
                        <Route path="*" element={<HostRoute><div>Content</div></HostRoute>} />
                        <Route path="/" element={<div data-testid="home">Home</div>} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('home')).toBeInTheDocument();
        });
    });

    describe('Dark Mode Support', () => {
        it('renders loading state with dark mode classes', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            const { container } = render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const bgElement = container.querySelector('.bg-white');
            expect(bgElement).toHaveClass('dark:bg-slate-950');
        });
    });

    describe('Animation Classes', () => {
        it('renders loader with animation classes', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const loader = screen.getByTestId('loader-icon');
            expect(loader).toHaveClass('animate-spin');
        });

        it('renders loader centered in container', () => {
            mockUseAuth.mockReturnValue({
                ...mockNavigateProps,
                isLoading: true,
            });

            render(
                <MemoryRouter initialEntries={['/host/dashboard']}>
                    <HostRoute>
                        <div>Host Dashboard</div>
                    </HostRoute>
                </MemoryRouter>
            );

            const loader = screen.getByTestId('loader-icon');
            expect(loader).toHaveClass('mx-auto');
            expect(loader).toHaveClass('mb-4');
        });
    });
});
