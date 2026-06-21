import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAddBlogPostPage } from './AdminAddBlogPostPage';

vi.mock('../../api-services', () => ({
    db: {
        createBlogPost: vi.fn(),
        uploadBlogMediaBatch: vi.fn(),
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'admin-1', full_name: 'Admin', email: 'admin@test.com' },
        isAuthenticated: true
    })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

vi.mock('react-hot-toast', () => ({
    toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn().mockReturnValue('toast-id') },
    default: { error: vi.fn(), success: vi.fn(), loading: vi.fn().mockReturnValue('toast-id') }
}));

const CONTENT_PLACEHOLDER = /Write the full content here/i;

describe('AdminAddBlogPostPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('inserts [image-1] placeholder into content textarea when clicking "Insert to text" on a preview', async () => {
        await act(async () => {
            render(<AdminAddBlogPostPage />);
        });

        const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
            expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Insert to text/i));

        const textarea = screen.getByPlaceholderText(CONTENT_PLACEHOLDER) as HTMLTextAreaElement;
        expect(textarea.value).toBe('[image-1]');
    });
});
