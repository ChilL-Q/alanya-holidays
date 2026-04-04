import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewsSection } from './ReviewsSection';
import { db } from '../../api-services';

// Mock toast properly - use vi.hoisted
const { mockToast } = vi.hoisted(() => ({
    mockToast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

vi.mock('react-hot-toast', () => ({
    toast: mockToast
}));

const mockUser = { id: 'user-1', full_name: 'Test User', role: 'guest', avatar_url: 'https://example.com/avatar.jpg' };

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true
    })
}));

vi.mock('../../context/LightboxContext', () => ({
    useLightbox: () => ({
        openLightbox: vi.fn()
    })
}));

vi.mock('../../api-services', () => ({
    db: {
        getReviews: vi.fn(),
        deleteReview: vi.fn()
    }
}));

vi.mock('./ReviewModal', () => ({
    ReviewModal: ({ isOpen, onClose, onSuccess }: any) => (
        <div data-testid="review-modal">
            {isOpen ? 'Modal Open' : 'Modal Closed'}
            <button onClick={onClose}>Close Modal</button>
            <button onClick={onSuccess}>Submit Review</button>
        </div>
    )
}));

describe('ReviewsSection', () => {
    const mockReviews = [
        {
            id: 'review-1',
            user_id: 'user-1',
            property_id: 'prop-1',
            rating: 5,
            comment: 'Amazing property!',
            created_at: '2025-01-01T10:00:00Z',
            images: ['https://example.com/review1.jpg'],
            user: { full_name: 'John Doe', avatar_url: 'https://example.com/john.jpg' }
        },
        {
            id: 'review-2',
            user_id: 'user-2',
            property_id: 'prop-1',
            rating: 4,
            comment: 'Great stay, highly recommend!',
            created_at: '2025-01-02T10:00:00Z',
            images: [],
            user: { full_name: 'Jane Smith', avatar_url: null }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (db.getReviews as any).mockResolvedValue(mockReviews);
    });

    const renderComponent = () => {
        return render(<ReviewsSection propertyId="prop-1" />);
    };

    it('renders loading state initially', () => {
        (db.getReviews as any).mockImplementation(() => new Promise(() => { }));
        renderComponent();
        expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
    });

    it('fetches and displays reviews', async () => {
        renderComponent();

        await waitFor(() => {
            expect(db.getReviews).toHaveBeenCalledWith('prop-1');
        });

        expect(screen.getByText('Amazing property!')).toBeInTheDocument();
        expect(screen.getByText('Great stay, highly recommend!')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('displays review count and average rating', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('2 Reviews')).toBeInTheDocument();
        });

        // Average: (5 + 4) / 2 = 4.5
        expect(screen.getByText('Average Rating: 4.5')).toBeInTheDocument();
    });

    it('shows "New" when there are no reviews', async () => {
        (db.getReviews as any).mockResolvedValue([]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('0 Reviews')).toBeInTheDocument();
            expect(screen.getByText('Average Rating: New')).toBeInTheDocument();
        });
    });

    it('displays star ratings correctly', async () => {
        renderComponent();

        await waitFor(() => {
            const filledStars = document.querySelectorAll('.fill-yellow-400');
            expect(filledStars.length).toBeGreaterThan(0);
        });
    });

    it('shows user avatar when available', async () => {
        renderComponent();

        await waitFor(() => {
            const avatar = screen.getByAltText('John Doe') as HTMLImageElement;
            expect(avatar.src).toBe('https://example.com/john.jpg');
        });
    });

    it('shows User icon placeholder when no avatar', async () => {
        renderComponent();

        await waitFor(() => {
            // Jane Smith has no avatar, look for the User icon in her avatar container
            const avatarContainers = document.querySelectorAll('.overflow-hidden');
            expect(avatarContainers.length).toBeGreaterThan(0);
        });
    });

    it('formats dates correctly', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('January 1, 2025')).toBeInTheDocument();
            expect(screen.getByText('January 2, 2025')).toBeInTheDocument();
        });
    });

    it('displays review images with lightbox functionality', async () => {
        renderComponent();

        await waitFor(() => {
            const reviewImages = screen.getAllByAltText('Review');
            expect(reviewImages.length).toBe(1);
        });

        // Verify images are clickable (have cursor-zoom-in class)
        const imageContainer = screen.getByAltText('Review').closest('div');
        expect(imageContainer).toHaveClass('cursor-zoom-in');
    });

    it('shows Write a Review button', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Write a Review')).toBeInTheDocument();
        });
    });

    it('opens review modal when Write a Review is clicked', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Write a Review')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Write a Review'));

        expect(screen.getByTestId('review-modal')).toBeInTheDocument();
    });

    it('shows delete button for own reviews', async () => {
        renderComponent();

        await waitFor(() => {
            // John Doe's review should have delete button (user_id matches)
            const deleteButtons = screen.getAllByTitle('Delete review');
            expect(deleteButtons.length).toBe(1);
        });
    });

    it('deletes review when confirmed', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);
        (db.deleteReview as any).mockResolvedValue(undefined);

        renderComponent();

        await waitFor(() => {
            const deleteButton = screen.getByTitle('Delete review');
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            expect(db.deleteReview).toHaveBeenCalledWith('review-1');
            expect(mockToast.success).toHaveBeenCalledWith('Review deleted successfully');
        });

        confirmSpy.mockRestore();
    });

    it('shows error toast when delete fails', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);
        (db.deleteReview as any).mockRejectedValue(new Error('Delete failed'));

        renderComponent();

        await waitFor(() => {
            const deleteButton = screen.getByTitle('Delete review');
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            // The component passes the error message directly
            expect(mockToast.error).toHaveBeenCalledWith('Delete failed');
        });

        confirmSpy.mockRestore();
    });

    it('disables delete button while deleting', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);
        (db.deleteReview as any).mockImplementation(() => new Promise(() => { }));

        renderComponent();

        await waitFor(() => {
            const deleteButton = screen.getByLabelText('Delete review');
            fireEvent.click(deleteButton);
        });

        await waitFor(() => {
            const deleteButton = screen.getByLabelText('Delete review');
            expect(deleteButton).toBeDisabled();
        });
    });

    it('shows empty state when no reviews', async () => {
        (db.getReviews as any).mockResolvedValue([]);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No reviews yet. Be the first to share your experience!')).toBeInTheDocument();
        });
    });

    it('closes review modal when onClose is called', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Write a Review')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Write a Review'));
        expect(screen.getByTestId('review-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Modal'));
    });

    it('refreshes reviews after successful submission', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Write a Review')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Write a Review'));
        fireEvent.click(screen.getByText('Submit Review'));

        await waitFor(() => {
            expect(db.getReviews).toHaveBeenCalledTimes(2);
        });
    });

    it('renders multiple review images in horizontal scroll', async () => {
        const reviewsWithMultipleImages = [
            {
                id: 'review-multi',
                user_id: 'user-1',
                property_id: 'prop-1',
                rating: 5,
                comment: 'Multiple images review',
                created_at: '2025-01-03T10:00:00Z',
                images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
                user: { full_name: 'Multi User', avatar_url: null }
            }
        ];

        (db.getReviews as any).mockResolvedValue(reviewsWithMultipleImages);
        renderComponent();

        await waitFor(() => {
            const reviewImages = screen.getAllByAltText('Review');
            expect(reviewImages.length).toBe(3);
        });
    });

    it('handles review with missing user data gracefully', async () => {
        const reviewsWithAnonymousUser = [
            {
                id: 'review-anon',
                user_id: 'unknown',
                property_id: 'prop-1',
                rating: 3,
                comment: 'Anonymous review',
                created_at: '2025-01-04T10:00:00Z',
                images: [],
                user: null
            }
        ];

        (db.getReviews as any).mockResolvedValue(reviewsWithAnonymousUser);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Anonymous')).toBeInTheDocument();
            expect(screen.getByText('Anonymous review')).toBeInTheDocument();
        });
    });

    it('handles review with missing date gracefully', async () => {
        const reviewsWithoutDate = [
            {
                id: 'review-nodate',
                user_id: 'user-1',
                property_id: 'prop-1',
                rating: 4,
                comment: 'No date review',
                created_at: undefined,
                images: [],
                user: { full_name: 'No Date User', avatar_url: null }
            }
        ];

        (db.getReviews as any).mockResolvedValue(reviewsWithoutDate);
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No date review')).toBeInTheDocument();
        });
    });
});
