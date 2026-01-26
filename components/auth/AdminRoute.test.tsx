import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminRoute } from './AdminRoute';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';

// Mock the hook directly
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('AdminRoute', () => {
    it('shows loading state initially', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            isLoading: true,
            isAuthenticated: false,
            user: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
        });

        render(
            <MemoryRouter>
                <AdminRoute>
                    <div>Admin Content</div>
                </AdminRoute>
            </MemoryRouter>
        );

        expect(screen.getByText(/Verifying permissions/i)).toBeInTheDocument();
    });

    it('redirects to home if not authenticated', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <div>Admin Content</div>
                        </AdminRoute>
                    } />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('redirects to home if user is not admin', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            user: { id: '1', email: 'test@test.com', role: 'user', full_name: 'Test' },
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/" element={<div>Home Page</div>} />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <div>Admin Content</div>
                        </AdminRoute>
                    } />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('renders children if user is admin', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            user: { id: '1', email: 'admin@test.com', role: 'admin', full_name: 'Admin' },
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn(),
        });

        render(
            <MemoryRouter>
                <AdminRoute>
                    <div>Admin Content</div>
                </AdminRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
});
