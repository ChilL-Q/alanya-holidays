import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditProductPage } from './AdminEditProductPage';

vi.mock('../../api-services', () => ({
    db: {
        getProduct: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn()
    }
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { role: 'admin', id: '123' }, isLoading: false })
}));

describe('AdminEditProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the product editor form', () => {
        render(
            <BrowserRouter>
                <AdminEditProductPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Product Details')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Photos')).toBeInTheDocument();
    });
});
