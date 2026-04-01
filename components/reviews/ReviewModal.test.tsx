import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { ReviewModal } from './ReviewModal';
import { db } from '../../api-services';

// Rule 1: vi.hoisted for shared mocks
const { mockToast } = vi.hoisted(() => ({
    mockToast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn()
    }
}));

// Rule 2: Standard mocks
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('react-hot-toast', () => ({
    toast: mockToast
}));

vi.mock('../../hooks/useSubmitShortcut', () => ({
    useSubmitShortcut: vi.fn()
}));

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    db: {
        uploadImage: vi.fn(),
        addReview: vi.fn()
    }
}));

// Mock Modal component
vi.mock('../ui/Modal', () => ({
    Modal: ({ children, isOpen, title }: any) => isOpen ? (
        <div data-testid="modal">
            <h1>{title}</h1>
            {children}
        </div>
    ) : null
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('ReviewModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        propertyId: 'prop-1',
        userId: 'user-1',
        onSuccess: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders null if not open', () => {
        const { container } = render(<ReviewModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders review form when open', () => {
        render(<ReviewModal {...defaultProps} />);
        expect(screen.getByText('reviews.write_title')).toBeInTheDocument();
        expect(screen.getByLabelText(/5 Stars/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('reviews.placeholder')).toBeInTheDocument();
    });

    it('updates rating on star click', () => {
        render(<ReviewModal {...defaultProps} />);
        const star3 = screen.getByLabelText('3 Stars');
        fireEvent.click(star3);
        expect(star3).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByLabelText('4 Stars')).toHaveAttribute('aria-pressed', 'false');
    });

    it('updates comment text', () => {
        render(<ReviewModal {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('reviews.placeholder');
        fireEvent.change(textarea, { target: { value: 'Great stay!' } });
        expect(textarea).toHaveValue('Great stay!');
    });

    it('handles image upload and removal', async () => {
        render(<ReviewModal {...defaultProps} />);
        
        // Find the hidden input
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        expect(screen.getByRole('img', { name: /Review upload 1/i })).toBeInTheDocument();

        const removeBtn = screen.getByLabelText('Remove image');
        fireEvent.click(removeBtn);

        expect(screen.queryByRole('img', { name: /Review upload 1/i })).not.toBeInTheDocument();
    });

    it('submits review successfully', async () => {
        (db.uploadImage as any).mockResolvedValue('http://example.com/img.jpg');
        (db.addReview as any).mockResolvedValue({});

        render(<ReviewModal {...defaultProps} />);
        
        fireEvent.change(screen.getByPlaceholderText('reviews.placeholder'), { 
            target: { value: 'Wonderful place!' } 
        });

        const submitBtn = screen.getByText('reviews.submit');
        
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(db.addReview).toHaveBeenCalledWith(expect.objectContaining({
            property_id: 'prop-1',
            user_id: 'user-1',
            rating: 5,
            comment: 'Wonderful place!'
        }));

        expect(mockToast.success).toHaveBeenCalledWith('reviews.success');
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles submission error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.addReview as any).mockRejectedValue(new Error('RLS Error'));

        render(<ReviewModal {...defaultProps} />);
        
        fireEvent.change(screen.getByPlaceholderText('reviews.placeholder'), { 
            target: { value: 'Test comment' } 
        });

        await act(async () => {
            fireEvent.click(screen.getByText('reviews.submit'));
        });

        expect(mockToast.error).toHaveBeenCalledWith('RLS Error');
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });

    it('submits on Cmd+Enter shortcut in textarea', async () => {
        (db.addReview as any).mockResolvedValue({});
        render(<ReviewModal {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('reviews.placeholder');
        fireEvent.change(textarea, { target: { value: 'Shortcut test' } });
        
        await act(async () => {
            fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
        });

        expect(db.addReview).toHaveBeenCalled();
    });
});
